import type { Log } from 'hurp-types';
import protobuf from 'protobufjs'
import { paramCase } from "param-case";
import type { Spec } from '../types';
import { getAllFiles } from '../utils'
import { CUSTOM_MESSAGES } from './custom-messages';
import { MODULES_EVENTSPECS } from './events';
import * as spec from './spec';

export async function getModulesSpecs(path:string, modules: string[], log: Log): Promise<Spec[]> {
    let root = new protobuf.Root();
    const files = getAllFiles(path)
    root.resolvePath = function (origin, target) {
        if (origin == '') return target
        else return path + '/' + target;
    };
    const cfg = await root.load(files, { alternateCommentMode: true });
    const specs: Spec[] = []
    modules.map(mod => {
        //Messages to Specs
        try {
            const msgService = cfg.lookupService(`.cosmos.${mod}.v1beta1.Msg`)
            if (msgService) {
                for (let key in msgService.methods) {
                    const method = msgService.methods[key]
                    let spec: Spec;
                    if (Object.keys(CUSTOM_MESSAGES).includes(mod) &&
                        Object.keys(CUSTOM_MESSAGES[mod]).includes(method.name)) {
                        const custom_msg = CUSTOM_MESSAGES[mod][method.name]
                        spec = custom_msg.spec
                    }
                    else {
                        const casedMethodName = paramCase(method.name)
                        const casedModuleName = paramCase(mod)
                        let description = ""
                        if (method.comment) {
                            description = method.comment.split('\n\n')[0].replace('\n', ' ')
                        }
                        spec = {
                            name: `call.${casedModuleName}.${casedMethodName}`,
                            schema: {},
                            meta: {
                                kind: 'call',
                                name: casedMethodName,
                                description: description,
                                labels: {
                                    kind: 'call',
                                    event: casedMethodName,
                                    module: casedModuleName
                                },
                                scope: casedModuleName
                            }
                        }
                        const methodRequestMetadata = cfg.lookup(`.cosmos.${mod}.v1beta1.${method.requestType}`) as protobuf.Type
                        for (let key in methodRequestMetadata.fields) {
                            const field = methodRequestMetadata.fields[key]
                            spec.schema[field.name] = getFieldSpec(field, cfg, log)
                        }
                    }
                    specs.push(spec)
                }
            }
        } catch (e) {
            const error = e as Error
            if (error.message.includes('no such Service')) {
                log.warn(error.message)
            }
            else throw e
        }
        //Events to Specs
        if (Object.keys(MODULES_EVENTSPECS).includes(mod)) {
            specs.push(...MODULES_EVENTSPECS[mod])
        }
    })
    return specs
}

function getFieldSpec(field: protobuf.Field, cfg: protobuf.Root, log: Log): spec.Spec {
    let result = spec.unknown()
    if (field.repeated) {
        result = spec.array({
            items: spec.unknown()
        })
        if(Object.keys(COSMOS_PRIMITIVE_SPECS_MAP).includes(field.type)){
            result = spec.array({
                items: COSMOS_PRIMITIVE_SPECS_MAP[field.type]
            })
        }
        else {
            const type = cfg.lookup(field.type)
            if (type == null) {//primitive
                log.warn('Need add new primitive in COSMOS_PRIMITIVE_SPECS_MAP: ' + field.type)
                result = spec.array({
                    items: spec.unknown()
                })
            }
            else {
                result = spec.array({
                    items: getReflectionSpec(type, cfg, log)
                })
            }
        }
    }
    else if (field.parsedOptions && 
        Array.isArray(field.parsedOptions) &&
        field.parsedOptions.some(e => Object.keys(e).includes('(cosmos_proto.scalar)') && e['(cosmos_proto.scalar)'] == 'cosmos.AddressString')) {
        result = spec.address({
            addressType: 'cosmos',
            prefix: process.env['ADDRESS_PREFIX'] || 'cosmos'
        })
    }
    else {
        if(Object.keys(COSMOS_PRIMITIVE_SPECS_MAP).includes(field.type)){
            result = COSMOS_PRIMITIVE_SPECS_MAP[field.type]
        }
        else {
            const type = cfg.lookup(field.type)
            if (type == null) {//primitive
                log.warn('Need add new primitive in COSMOS_PRIMITIVE_SPECS_MAP: ' + field.type)
                result = spec.unknown()
            }
            else {
                result = getReflectionSpec(type, cfg, log)
            }
        }
    }
    return result;
}

function getReflectionSpec(ref: protobuf.ReflectionObject, cfg: protobuf.Root, log:Log): spec.Spec {
    var result: spec.Spec = spec.unknown()
    //Object
    if (ref instanceof protobuf.Type) {
        const properties: Record<string, spec.Spec> = {}
        for (let fieldName in (ref as protobuf.Type).fields) {
            const field = (ref as protobuf.Type).fields[fieldName]
            properties[fieldName] = getFieldSpec(field, cfg, log)
        }
        result = spec.object({
            properties: properties
        })
    }
    //Enum
    else if (ref instanceof protobuf.Enum){
        const options: Record<string, spec.Spec> = {}
        for (let optionName in (ref as protobuf.Enum).values) {
            options[optionName] = spec.nullSpec()
        }
        result = spec.object({
            properties: options
        })
    }
    else {
        log.warn('UKNOWN Type: ' + ref.name)
    }
    return result;
}

const COSMOS_PRIMITIVE_SPECS_MAP: { [key: string]: spec.Spec } = {
    'string': spec.string(),
    'uint32': spec.number(),
    'uint64': spec.number(),
    'int64': spec.number(),
    'int32': spec.number(),
    'Timestamp': spec.string(),
    'cosmos.base.v1beta1.Coin': spec.balance(),
    'bool': spec.boolean(),
    'bytes': spec.hash(),
    'google.protobuf.Any': spec.unknown()
}
