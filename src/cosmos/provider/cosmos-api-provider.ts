import type { Log } from 'universe-types';
import { sha256 } from '@cosmjs/crypto';
import { fromBase64, toHex } from '@cosmjs/encoding';
import fetch from 'node-fetch';
import { paramCase } from 'param-case';
import { camelCase } from 'camel-case';
import type {
  JsonObject,
  JsonValue,
  Event,
  Spec,
} from './types';
import { CUSTOM_MESSAGES } from './bundles/custom-messages';
import { getModulesSpecs } from './bundles/cosmos-bundle';
import { formatBalance } from './utils';

export class Block {
    public height: number;
    public time: Date;
    public hash: string;
    public txs: string[];

    constructor(blockJson: any) {
        if (Object.keys(blockJson).includes('block') &&
            Object.keys(blockJson).includes('block_id')) {
            this.height = Number(blockJson.block.header.height)
            this.time = new Date(blockJson.block.header.time)
            this.hash = blockJson.block_id.hash
            this.txs = blockJson.block.data.txs.map((tx: string) => {
                //const hash = toHex(sha256(fromBase64(block.block.data.txs[0]))).toUpperCase()
                return toHex(sha256(fromBase64(tx))).toUpperCase()
            })
        }
        else if (Object.keys(blockJson).includes('message')) {
            throw Error('Bad request: ' + blockJson.message)
        }
        else throw Error('Wrong block data format')
    }
}

export class Transaction {
    public hash: string;
    public blockHeight: number;
    public status: 'Good' | 'Bad';
    public messages: Array<Message>;

    constructor(txJson: any, provider: CosmosApiProvider) {
        if (Object.keys(txJson).includes('tx') &&
            Object.keys(txJson).includes('tx_response')) {
            this.hash = txJson.tx_response.txhash
            this.blockHeight = Number(txJson.tx_response.height)
            this.status = txJson.tx_response.code === 0 ? 'Good' : 'Bad'
            this.messages = txJson.tx_response.tx.body.messages.map((msg: { "@type": any;[x: string]: any; },
                index: number) => {
                const msgLog = txJson.tx_response.logs.find((log: { msg_index: number; }) => log.msg_index == index)
                if (msgLog) {
                    const message = new Message(msg,
                        msgLog.events.map((e: any) => new CosmosEvent(e)),
                        provider)
                    return message
                }
                else return new Message(msg, [], provider)
            })
        }
        else if (Object.keys(txJson).includes('message')) {
            if (txJson.message.includes('tx not found')) {
                this.hash = txJson.message.match(/([0-9A-F]{64})/)[0]
                this.status = 'Bad'
                this.blockHeight = -1
                this.messages = []
            }
            else throw Error('Bad request: ' + txJson.message)
        }
        else throw Error('Wrong transaction data format')
    }
}

export class Message {
    public module: string;
    public name: string;
    public type: string;
    public events: Array<CosmosEvent>;
    public provider: CosmosApiProvider;
    private arguments: Record<string, any>

    constructor(msgJson: any, events: CosmosEvent[], provider: CosmosApiProvider) {
        if (Object.keys(msgJson).includes('@type')) {
            this.type = msgJson['@type'] as string
            const typeParts = this.type.split('.')
            this.module = typeParts[1]
            this.name = typeParts[3].replace(/^Msg/, '')
            this.arguments = {}
            Object.keys(msgJson).filter(k => k != '@type').forEach(atr => {
                this.arguments[atr] = msgJson[atr]
            })
            this.events = events
            this.provider = provider
        }
        else throw Error('Wrong message data format')
    }

    public async getArgumets(formatType: 'raw' | 'human'): Promise<JsonObject> {
        const result: JsonObject = await replaceCosmosCoins(this.arguments, this.provider, formatType)
        // await Promise.all(Object.entries(this.arguments).map(async ([key, value]) => {

        //     if (isCosmosCoin(value)) {
        //         const coinData = await this.provider.getDenom(value.denom)
        //         result[camelCase(key)] = formatBalance(Number(value.amount), coinData.decimals, coinData.symbol, formatType)
        //     }
        //     else {
        //         result[camelCase(key)] = value;
        //     }
        // }));
        return result;
    }

    public async getEvents(): Promise<Event[]> {
        const result: Event[] = []

        await Promise.all(this.events.map(async e => {
            const casedName = paramCase(e.type)
            const event: Event = {
                name: `event.${this.module}.${casedName}`,
                params: {
                    raw: await this.getEventArguments(e, 'raw'),
                    human: await this.getEventArguments(e, 'human')
                }
            }
            result.push(event)
        }))
        return result;
    }

    async getEventArguments(event: CosmosEvent, formatType: 'raw' | 'human'): Promise<JsonObject> {
        const args: JsonObject = {}
        await Promise.all(Object.keys(event.attributes).map(async attr => {
            let val = event.attributes[attr]
            const balance = (val as string).match(/^(\d+)([^\d]+)$/);
            if (balance) {
                const balanceValue = Number(balance[1]);
                const coinInfo = await this.provider.getDenom(balance[2])
                val = formatBalance(balanceValue, coinInfo.decimals, coinInfo.symbol, formatType)
            }
            args[attr] = val;
        }))
        return args
    }
}

export class CosmosEvent {
    public type: string;
    public attributes: Record<string, JsonValue>;

    constructor(eventChain: any) {
        if (Object.keys(eventChain).includes('type') &&
            Object.keys(eventChain).includes('attributes')) {
            this.type = eventChain.type;
            this.attributes = {}
            eventChain.attributes.forEach((attr: any) => {
                this.attributes[attr.key] = attr.value
            })
        }
        else throw Error('Wrong event data format')
    }
}

export interface CosmosCoin {
    denom: string,
    amount: string
}

function isCosmosCoin(value: any): value is CosmosCoin {
    return typeof value === 'object' && value !== null && 'denom' in value && 'amount' in value;
}

async function replaceCosmosCoins(input: any, provider: CosmosApiProvider, formatType: 'raw' | 'human'): Promise<any> {
    if (Array.isArray(input)) {
        return await Promise.all(input.map(async i => await replaceCosmosCoins(i, provider, formatType)));
    } else if (isCosmosCoin(input)) {
        const coinData = await provider.getDenom(input.denom)
        return formatBalance(Number(input.amount), coinData.decimals, coinData.symbol, formatType)
    } else if (typeof input === 'object' && input !== null) {
        const result: JsonObject = {};
        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                result[camelCase(key)] = await replaceCosmosCoins(input[key], provider, formatType);
            }
        }
        return result;
    }
    return input;
}

async function replaceSomthingInSomething(input: any,
    options: Record<string, any>,
    check: (val: any, options: Record<string, any>) => Boolean,
    replace: (val: any, options: Record<string, any>) => any): Promise<any> {
    if (Array.isArray(input)) {
        return input.map(i => replaceSomthingInSomething(i, options, check, replace));
    } else if (check(input, options)) {
        return replace(input, options)
    } else if (typeof input === 'object' && input !== null) {
        const result: Record<string, any> = {};
        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                result[key] = replaceSomthingInSomething(input[key], options, check, replace);
            }
        }
        return result;
    }
    return input;
}






export interface Coin {
    symbol: string;
    decimals: number;
}

export class CosmosApiProvider {
    private endpoint: string;
    private supportedModules: string[];
    private protoPath: string;

    constructor(api_endpoint: string, supportedModules: string[], protoPath: string) {
        this.endpoint = api_endpoint;
        this.supportedModules = supportedModules;
        this.protoPath = protoPath;
    }

    public async getLatesBlock(): Promise<Block> {
        const result = await this.get(`cosmos/base/tendermint/v1beta1/blocks/latest`)
        return new Block(result)
    }

    public async getBlock(height: number): Promise<Block> {
        const result = await this.get(`cosmos/base/tendermint/v1beta1/blocks/${height}`)
        return new Block(result)
    }

    public async getTx(hash: string): Promise<Transaction> {
        const result = await this.get(`cosmos/tx/v1beta1/txs/${hash}`)
        const tx = new Transaction(result, this)
        return tx;
    }

    public async getDenom(denom: string): Promise<Coin> {
        const result = (await this.get(`cosmos/bank/v1beta1/denoms_metadata/${denom}`)) as any
        if (Object.keys(result).includes('metadata')) {
            return {
                symbol: result.metadata.symbol,
                decimals: result.metadata.denom_units.find((d: { denom: any; }) => d.denom === result.metadata.symbol).exponent
            }
        }
        else return {
            symbol: denom,
            decimals: 0
        }
    }

    public async get(request: string): Promise<unknown> {
        const result = await fetch(this.endpoint + request)
        return await result.json()
    }

    public async getEvents(blockHeight: number): Promise<Event[]> {
        const block = await this.getBlock(blockHeight)
        const txs = await Promise.all(block.txs.map(async txHash => {
            const tx = await this.getTx(txHash)
            return tx
        }))
        const events: Event[] = []
        const messages = []
        await Promise.all(txs.filter(tx => tx.status === 'Good').map(async tx => {
            await Promise.all(tx.messages.filter(m => this.supportedModules.includes(m.module)).map(async msg => {
                const msgEvents = await this.getMessages(msg, tx.hash, blockHeight)
                events.push(...msgEvents)
            }))
        }))
        return events;
    }

    async getMessages(message: Message, txHash: string, blockHeight: number): Promise<Event[]> {
      const events: Event[] = []
      const event: Event = {
          name: `call.${message.module}.${paramCase(message.name)}`,
          payload: {
              txHash: txHash,
              blockHeight: blockHeight
          },
          params: {
              raw: await message.getArgumets('raw'),
              human: await message.getArgumets('human')
          }
      }
      let msgEvents: Event[] = []
      if (Object.keys(CUSTOM_MESSAGES).includes(message.module) && Object.keys(CUSTOM_MESSAGES[message.module]).includes(message.name)) {
          const custom_message = CUSTOM_MESSAGES[message.module][message.name]
          event.params.raw = await custom_message.parser.raw(message)
          event.params.human = await custom_message.parser.human(message)

          msgEvents.push(...await custom_message.events(message))
      }
      else {
          msgEvents.push(...await message.getEvents())
      }

      events.push(event)
      events.push(...msgEvents)
      return events;
    }

    public async getSpecs(log: Log): Promise<Spec[]> {
        return await getModulesSpecs(this.protoPath, this.supportedModules, log);
    }
}
