# goodboi-smart-contracts

This repo holds the Ethereum smart contracts for [Good Boi Society](https://goodboisociety.io).

As of now there is only [one contract](./contracts/GoodBoiSociety.sol) which is a simple ERC721 contract using OpenZeppelin's contract system.

## Setup

1. Install [MetaMask](https://metamask.io/) to your browser
2. Create a new MetaMask wallet and take note of the 12-word mnemonic seed
3. Install [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm) to your system
4. Use NVM to install NodeJS ~12: `nvm install 12.18 && nvm use 12.18`
5. Install NodeJS dependencies: `npm install`
6. Copy example secrets file: `cp env-example .env`
7. Update secrets (new mnemonic seed and Infura API token): `vim .env`

You can use MetaMask to generate a new wallet and grab the seed from there. Doing this makes it very easy to work with the contract since the `withdraw` function will send you all the collected ETH from the contract.

Now your repo is setup to deploy and interact with your contracts.

## Testing

For testing we're using Ganache to get a local blockchain and then utilizing Truffle with some OpenZeppelin helpers to run unit tests on the contract.

```
# In one Terminal window/tab/session
npx ganache-cli --defaultBalanceEther 50000

# In another
npx truffle test
```

There is a unit test I've left commented out because it's very time consuming since it mints all 9999 doges to confirm the upper lower bounds, that doges will not go over, and that we don't get 0 or > 9999 tokenIds.

## Deploying

Truffle makes it easy! Please note, you will need some ETH in the wallet in order for the deployment to happen. On average it will cost ~0.003 ETH to deploy (at least on Rinkeby so far).

```
$ export NETWORK=rinkeby   # use mainnet for live network
$ npx truffle deploy --network $NETWORK
```

Truffle will do it's thing and spit out some details about the deployment. You need to take note of the `contract address` - you will use that in several places.

Truffle creates a folder called `build` where metadata is stored. You should back this folder up in case the contents were removed so you can still manage the contract as the owner.

## Frontend

At this point, you've got a deployed contract which will mint new Good Bois to those who invoke the `mintDoge` function along with 0.075 ETH. How do you actually get someone to do this? You need some Javascript on a website to actually do that contract interaction.

Here's what you need to gather:
* Contract address (outputted in `truffle deploy` step above)
* Contract ABI (`cat build/contracts/GoodBoiSociety.json | jq .abi` - assumes you have `jq` installed to your system)

You need a website (HTML + CSS + JS) that makes use of web3 and MetaMask Javascript. You need to define the contract address, the ABI (as array), load web3 and MetaMask Javascript, and invoke the `mintDoge` contract.

See [goodboisociety.io](https://github.com/patrn-me/goodboisociety.io/) repo for an example. Here are the specific places where this occurs:

1. Load web3, MetaMask, and your own custom Javascript file in your HTML: [ex 1](https://github.com/patrn-me/goodboisociety.io/blob/e2e3a56049bba6035a93faa981a81004c62941d1/index.html#L589-L592)
2. Define an HTML class (we used `buyDoge`) on an anchor link in which you can invoke the MetaMask prompt: [ex 2](https://github.com/patrn-me/goodboisociety.io/blob/e2e3a56049bba6035a93faa981a81004c62941d1/index.html#L54)
3. Define contract address and ABI in your custom Javascript: [ex 3](https://github.com/patrn-me/goodboisociety.io/blob/e2e3a56049bba6035a93faa981a81004c62941d1/js/main.js#L1-L2)
4. Define function to invoke `mintDoge` contract function with `numberOfTokens` parameter: [ex 4](https://github.com/patrn-me/goodboisociety.io/blob/e2e3a56049bba6035a93faa981a81004c62941d1/js/main.js#L631-L645)
5. Setup click event for your `buyDoge` HTML classes: [ex 5](https://github.com/patrn-me/goodboisociety.io/blob/e2e3a56049bba6035a93faa981a81004c62941d1/js/main.js#L590-L621)

The following Javascript code is the main piece here:

```
let dogeCostWei = w3.utils.toWei("0.075");
...
const contract = new w3.eth.Contract(abi, contractAddress, {from: walletAddress});
const res = await contract.methods.mintDoge(1).send({from: walletAddress, value: dogeCostWei})
```

This is where the magic happens!

When users in the frontend click your magic button (whatever class you wired up `onclick` events for), they will be onboarded with MetaMask install if they don't have it. If they do have it the Javascript will connect their MetaMask wallet to the site and proceed to prompt the user to send 0.075 ETH along with invoking the `mintDoge` contract function. Once they confirm, funds are sent, function invoked, and you'll see updates on Etherscan. When received, the ETH network will trigger the `payable` event and mint the NFT and transfer to the sender!

NFTs can then be seen in the user's OpenSea account!

## Interacting

After deploying you will need to interact with the contract....at least, you will if you want to withdraw the ETH!

### Console

The simplest way to interact is manually running commands in the Truffle console: `npx truffle console --network $NETWORK`

In the console you have to load your contract and can manually invoke functions...like this:

```
$ npx truffle console --network $NETWORK
truffle(rinkeby)> let gb = await GoodBoiSociety.deployed();
undefined
truffle(rinkeby)> (await gb.MAX_DOGES()).toString()
'9999'
truffle(rinkeby)> gb.tokenURI(5)
'ipfs://QmaWpBxEhSi1tRdjjhbGBq7evTDc5pGJfA6ryFuJ2Ai3St/5'
```

### Scripted

You can script contract interactions and use them in conjunction with Truffle. See the [scripts](./scripts) folder to see what's been created so far. If you review the code you'll notice it's the same as the console.

As of now we only have a script to withdraw the balance in the contract address to the creator (root address of the mnemonic seed you generated earlier):

```
$ npx truffle exec scripts/withdraw.js --network rinkeby
Using network 'rinkeby'.

Contract balance has been withdrawn to contract creator. Check your balance!
```

## Support

Make an issue in this repo if you have questions, or hit up `lza_menace` in the GoodBoiSociety Discord.
