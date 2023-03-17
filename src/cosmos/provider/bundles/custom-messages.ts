import { paramCase } from 'param-case'
import { camelCase } from 'camel-case'
import type {
  JsonObject,
  Event,
  Spec,
} from '../types';
import type { Message } from '../cosmos-api-provider';
import { formatBalance } from '../utils';
import * as spec from './spec';

export interface CustomMessage {
    name: string,
    spec: Spec,
    parser: {
        raw: CustomParser<JsonObject>
        human: CustomParser<JsonObject>
    },
    events:CustomParser<Event[]>
}

export type CustomParser<T> = (value: Message) => Promise<T>;

const ACCOUNT_PREFIX = process.env['ADDRESS_PREFIX']

export const CUSTOM_MESSAGES: { [key: string]: { [key: string]: CustomMessage } } = {
    distribution: {
        "WithdrawDelegatorReward": {
            spec: {
                name: "call.distribution.withdraw-delegator-reward",
                schema: {
                    delegatorAddress: spec.address(
                        {
                            addressType: 'cosmos',
                            prefix: ACCOUNT_PREFIX || 'cosmos'
                        }),
                    validatorAddress: spec.address(
                        {
                            addressType: 'cosmos',
                            prefix: ACCOUNT_PREFIX || 'cosmos'
                        }),
                    amount: spec.balance()
                },
                meta: {
                    kind: 'call',
                    name: 'withdraw-delegator-reward',
                    description: 'Represents delegation withdrawal to a delegator from a single validator.',
                    labels: {
                        kind: 'call',
                        event: 'withdraw-delegator-reward',
                        module: 'distribution'
                    },
                    scope: 'distribution'
                }
            },
            name: "WithdrawDelegatorReward",
            parser: {
                raw: withdrawDelegatorRewardRawParser(),
                human: withdrawDelegatorRewardHumanParser()
            },
            events: removeUsedEvent('withdraw_rewards')
        },
        "WithdrawValidatorCommission": {
            spec: {
                name: "call.distribution.withdraw-validator-commission",
                schema: {
                    validatorAddress: spec.address(
                        {
                            addressType: 'cosmos',
                            prefix: ACCOUNT_PREFIX || 'cosmos'
                        }),
                    amount: spec.balance()
                },
                meta: {
                    kind: 'call',
                    name: 'withdraw-validator-commission',
                    description: 'Withdraws the full commission to the validator address.',
                    labels: {
                        kind: 'call',
                        event: 'withdraw-validator-commission',
                        module: 'distribution'
                    },
                    scope: 'distribution'
                }
            },
            name: "WithdrawValidatorCommission",
            parser: {
                raw: withdrawValidatorCommissionRawParser(),
                human: withdrawValidatorCommissionHumanParser()
            },
            events: removeUsedEvent('withdraw_commission')
        }
    },
    evidence: {
        "SubmitEvidence": {
            spec: {
                name: "call.evidence.submit-evidence",
                schema: {
                    submitter: spec.address({
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                    evidence: spec.unknown(),
                    evidenceHash: spec.hash()
                },
                meta: {
                    kind: 'call',
                    name: 'submit-evidence',
                    description: 'Submits an arbitrary Evidence of misbehavior such as equivocation or counterfactual signing.',
                    labels: {
                        kind: 'call',
                        event: 'submit-evidence',
                        module: 'evidence'
                    },
                    scope: 'evidence'
                }
            },
            name: "SubmitEvidence",
            parser: {
                raw: addExtraEventArgument('submit_evidence', 'evidence_hash', 'raw'),
                human: addExtraEventArgument('submit_evidence', 'evidence_hash', 'human')
            },
            events: removeUsedEvent('submit_evidence')
        }
    },
    gov: {
        "SubmitProposal":{
            spec: {
                name: "call.gov.submit-proposal",
                meta: {
                    kind: 'call',
                    name: 'submit-proposal',
                    description: 'Submit arbitrary proposal.',
                    labels: {
                        kind: 'call',
                        event: 'submit-proposal',
                        module: 'gov'
                    },
                    scope: 'gov'},
                schema: {
                    content: spec.unknown(),
                    initialDeposit: spec.array({
                        items: spec.balance()
                    }),
                    proposer: spec.address({
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                    proposalId: spec.number()
                }
            },
            name: "SubmitProposal",
            parser: {
                raw: addExtraEventArgument('submit_proposal', 'proposal_id', 'raw'),
                human: addExtraEventArgument('submit_proposal', 'proposal_id', 'human')
            },
            events: removeUsedEvent('submit_proposal')
        }
    },
    staking: {
        "BeginRedelegate": {
            name: 'BeginRedelegate',
            spec: {
                name: "call.staking.begin-redelegate",
                meta: {
                    kind: 'call',
                    name: 'begin-redelegate',
                    description: 'Redelegation of coins from a delegator and source validator to a destination validator.',
                    labels: {
                        kind: 'call',
                        event: 'begin-redelegate',
                        module: 'staking'
                    },
                    scope: 'staking'},
                schema: {
                    delegatorAddress: spec.address({
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                    validatorSrcAddress: spec.address({
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                    validatorDstAddress: spec.address({
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                    amount: spec.balance(),
                    completion_time: spec.unknown()
                }
            },
            parser: {
                raw: addExtraEventArgument('redelegate','completion_time','raw'),
                human: addExtraEventArgument('redelegate','completion_time','human')
            },
            events: removeUsedEvent('redelegate')
        },
        "Undelegate": {
            name: 'Undelegate',
            spec: {
                name: "call.staking.undelegate",
                meta: {
                    kind: 'call',
                    name: 'undelegate',
                    description: 'Delegator undelegation from a validator.',
                    labels: {
                        kind: 'call',
                        event: 'undelegate',
                        module: 'staking'
                    },
                    scope: 'staking'},
                schema: {
                    delegatorAddress: spec.address({
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                    validatorAddress: spec.address({
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                    amount: spec.balance(),
                    completionTime: spec.unknown()
                }
            },
            parser: {
                raw: addExtraEventArgument('unbond','completion_time','raw'),
                human: addExtraEventArgument('unbond','completion_time','human')
            },
            events: removeUsedEvent('unbond')
        }
    }
}

async function withdrawParser(
    value: Message,
    event_name: string,
    formatType: 'raw' | 'human'): Promise<JsonObject> {
    const result = await value.getArgumets(formatType)
    //Add 'amount' from response withdraw event
    const withdrawRewardsEvent = value.events.find(e => e.type === event_name)
    if (withdrawRewardsEvent) {
        const amount = withdrawRewardsEvent.attributes['amount']
        if (amount != undefined) {
            const amount_matches = (amount as string).match(/^(\d+)([^\d]+)$/);
            if (amount_matches) {
                const amountValue = Number(amount_matches[1]);
                const coinInfo = await value.provider.getDenom(amount_matches[2])
                result['amount'] = formatBalance(amountValue, coinInfo.decimals, coinInfo.symbol, formatType)
            }
        }
    }
    return result
}
function withdrawDelegatorRewardRawParser(): CustomParser<JsonObject> {
    return async value => {
        return await withdrawParser(value, 'withdraw_rewards', 'raw')
    }
}
function withdrawDelegatorRewardHumanParser(): CustomParser<JsonObject> {
    return async value => {
        return await withdrawParser(value, 'withdraw_rewards', 'human')
    }
}
function withdrawValidatorCommissionRawParser(): CustomParser<JsonObject> {
    return async value => {
        return await withdrawParser(value, 'withdraw_commission', 'raw')
    }
}
function withdrawValidatorCommissionHumanParser(): CustomParser<JsonObject> {
    return async value => {
        return await withdrawParser(value, 'withdraw_commission', 'human')
    }
}
function addExtraEventArgument(event_name:string, attribut_name:string, formatType: 'human' | 'raw'): CustomParser<JsonObject> {
    return async value => {
        const result = await value.getArgumets(formatType)
        const event = value.events.find(e => e.type === event_name)
        if(event){
            const attributeValue = event.attributes[attribut_name]
            result[camelCase(attribut_name)] = attributeValue;
        }
        return result
    }
}

function removeUsedEvent(eventName:string): CustomParser<Event[]> {
    return async message => {
        let events = await message.getEvents();
        events = events.filter(e => e.name == paramCase(eventName))
        return events;
    }
}
