# celestia

Web3Alert intergration app for the Celestia network.

## About

It provides blockchain events and calls, customized to be human readable and wrapped into internal Web3Alert data structures.

While we continue to improve Web3Alert to make its integrations more abstract and generic, the primary goal of this app is to provide a quick way to get useful notifications for Celestia ecosystem and community using current Web3Alert features. So, it should be expected for this app to be eventually broken down into different basic pieces, allowing developers to build their own complex scenarios to work with blockchain data.

## Local Setup

```bash
cp example.env .env
npm install
npm start
```

## Make Queries

### Enumerate Events and Calls

```
POST http://localhost:3000/api/v1/streams/chain/enumerate
```

### Fetch Events

```
POST http://localhost:3000/api/v1/streams/chain/process
{
  "now": "2023-05-08T12:09:08.699Z",
  "state": { "block": 313042 },
  "params": { "event": "call.staking.create-validator" }
}
```
