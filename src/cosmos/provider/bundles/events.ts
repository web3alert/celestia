import type { Spec } from '../types';
import * as spec from './spec';

const ACCOUNT_PREFIX = process.env['ADDRESS_PREFIX']

export const MODULES_EVENTSPECS: { [key: string]: Spec[] } =
{
    bank: [
        {
            name: "event.bank.transfer",
            schema: {
                sender: spec.address(
                    {
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                recipient: spec.address(
                    {
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                amount: spec.balance()
            },
            meta: {
                kind: 'event',
                name: 'transfer',
                description: 'Coin trasnfer.',
                labels: {
                    kind: 'event',
                    event: 'transfer',
                    module: 'bank'
                },
                scope: 'bank'
            }
        },
        {
            name: "event.bank.coin-spent",
            schema: {
                spender: spec.address(
                    {
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                amount: spec.balance()
            },
            meta: {
                kind: 'event',
                name: 'coin-spent',
                description: 'Coin spent.',
                labels: {
                    kind: 'event',
                    event: 'coin-spent',
                    module: 'bank'
                },
                scope: 'bank'
            }
        },
        {
            name: "event.bank.coin-received",
            schema: {
                receiver: spec.address(
                    {
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                amount: spec.balance()
            },
            meta: {
                kind: 'event',
                name: 'coin-received',
                description: 'Coin received.',
                labels: {
                    kind: 'event',
                    event: 'coin-received',
                    module: 'bank'
                },
                scope: 'bank'
            }
        },
        {
            name: "event.bank.coinbase",
            schema: {
                minter: spec.address(
                    {
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                amount: spec.balance()
            },
            meta: {
                kind: 'event',
                name: 'coinbase',
                description: 'Coin minted.',
                labels: {
                    kind: 'event',
                    event: 'coinbase',
                    module: 'bank'
                },
                scope: 'bank'
            }
        },
        {
            name: "event.bank.burn",
            schema: {
                burner: spec.address(
                    {
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                amount: spec.balance()
            },
            meta: {
                kind: 'event',
                name: 'burn',
                description: 'Coin burned.',
                labels: {
                    kind: 'event',
                    event: 'burn',
                    module: 'bank'
                },
                scope: 'bank'
            }
        },
    ],
    distribution: [
        {
            name: "event.distribution.set-withdraw-address",
            schema: {
                withdraw_address: spec.address(
                    {
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    })
            },
            meta: {
                kind: 'event',
                name: 'set-withdraw-address',
                description: 'New withdraw address set.',
                labels: {
                    kind: 'event',
                    event: 'set-withdraw-address',
                    module: 'distribution'
                },
                scope: 'distribution'
            }
        },
        {
            name: "event.distribution.rewards",
            schema: {
                validator: spec.address(
                    {
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                amount: spec.balance()
            },
            meta: {
                kind: 'event',
                name: 'rewards',
                description: 'Delegator rewarded.',
                labels: {
                    kind: 'event',
                    event: 'rewards',
                    module: 'distribution'
                },
                scope: 'distribution'
            }
        },
        {
            name: "event.distribution.commission",
            schema: {
                validator: spec.address(
                    {
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                amount: spec.balance()
            },
            meta: {
                kind: 'event',
                name: 'commission',
                description: 'Validator get his commission.',
                labels: {
                    kind: 'event',
                    event: 'commission',
                    module: 'distribution'
                },
                scope: 'distribution'
            }
        },
        {
            name: "event.distribution.proposer-reward",
            schema: {
                proposer: spec.address(
                    {
                        addressType: 'cosmos',
                        prefix: ACCOUNT_PREFIX || 'cosmos'
                    }),
                amount: spec.balance()
            },
            meta: {
                kind: 'event',
                name: 'proposer-reward',
                description: 'Proposer rewarded.',
                labels: {
                    kind: 'event',
                    event: 'proposer-reward',
                    module: 'distribution'
                },
                scope: 'distribution'
            }
        },
    ]
}
//TODO!
