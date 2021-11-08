# dNFT: NFT derivatives dApp 

This dApp is a [DeFi & Cross-chain Interoperability Hackathon](https://gitcoin.co/issue/terra-money/bounties/2/100026890) submission and consists of two parts:

- [front-end dApp](https://github.com/akalmykov/dcw721-dapp/), this repository
- [a cw721 contract with metadata extension](https://github.com/akalmykov/dcw721-contract/)

dNFT is a dApp that give NFT collectors an opportunity to mint derivtive NFT artworks based on the NFTs they already own. The derivative NFTs are procedurally generated based original NFTs and are fully owned by a collector. 

This proof-of-concept dApp supports one generation method - Nerual Style Transfer. However, in the future, it support several generation methods and would allow adding new as plugins. The smart contract behind dNFT is based on cw721 standard with metadata extension (see [dcw721-contract repository](https://github.com/akalmykov/dcw721-contract/)). 

Any derivative NFT stores links (`token_id`) of the original NFTs and generation parameters. This allows to

- traceback any derivative back to the original artwork
- prove the ownership of the original NFTs in time of minting a derivative
- deterministically recreate any derivative artwork from sources

When dNFT is fully developed into an NFT marketplace, it will allow the creators earn royalties from sale and re-sale of the derivatives based on their original NFTs. 

# Building and Running locally
To build dNFT dApp, install Yarn, go to the repository root and execute:

`yarn install
yarn build`

To launch dNFT locally, run:

`yarn run start`

Open the dApp in Google Chrome with Terra Extension installed.

# Live Demo on Bombay-12 testnet

These are ready-made test accounts with original, pre-minted NFTs.

...

You can use them to test the dApp and derivative minting using a pre-deployed contract `terra1zzf3207sepmhs2t8f2j0zwsklgahrtchn5hxth` on Bombay-12 testnet.
Alternatively, you can deploy a new contract and make the dApp work with your contract by following the instruction below.

# Manual Deployment (step-by-step instruction)
## Creating contract

Before you start, you will need Chrome with Terra Extention installed. 

- Create two Terra accounts: an original minter's account and an ownwer's account. They both will need some LUNA balance to pay for gas fees. For illustration, we are going to use
    - `terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp` as a minter's account
    - `??` as an NFT owner's account
- First, we need to login to Terra Extention and authorize in https://station.terra.money/contracts with the minter's account
![image](https://user-images.githubusercontent.com/4420479/140627523-4503e432-3e6e-44dc-84e6-c8c8de97f0d1.png)
- Click "Upload" button, and upload cw721terra.wasm from https://github.com/akalmykov/dcw721-contract/ repository (see "artifacts")
 
![image](https://user-images.githubusercontent.com/4420479/140627562-a910040d-b5e9-464b-bde2-b1bae40bd01e.png)
- In the "History" tab, find "Store" transaction for the code upload. You will see code_id (`18145`) in the transaction title.
![image](https://user-images.githubusercontent.com/4420479/140627722-0fc199a8-574e-4f12-a42d-cccdf160106e.png)
- Alternatively, look at the transaction details and locate store code_id:

![image](https://user-images.githubusercontent.com/4420479/140627739-acd20249-e7d5-47b4-996c-4a2f05424772.png)
- Next, create a new contract with Code `18145` and InitMsg json as follows:
`{"name":"dnft7", "symbol":"SMB", "minter":"terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp"}`
Fields `name` and `symbol` can be arbitrary, the only important field in `minter`. Only this address can mint original NFTs, which could be later used by the owners to produce derivative NFTs.

![image](https://user-images.githubusercontent.com/4420479/140645746-6bfd1330-55ce-4897-b905-978354049c6c.png)
- After creating the contract, go to History tab and find `MsgInstantiateContract` transaction
![image](https://user-images.githubusercontent.com/4420479/140627714-59027b81-e12e-40b5-9111-f761affefc15.png)
- In this transaction details, locate `contract_address` field
- ![image](https://user-images.githubusercontent.com/4420479/140645930-d0da648a-eb48-451b-8831-a938abdfdf50.png)

- The contract address is `terra1zzf3207sepmhs2t8f2j0zwsklgahrtchn5hxth`. 
## Manual minting of original NFTs

Currently, dNFT allows to mint only derivative NFTs. Original NFTs should be minted manually. Below are the sample transaction minting several NFTs with `terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95` as an owner.  

- `{"mint":{"token_id":"vitalik_nakamoto", "owner":"terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95", "extension": {"external_url": "https://ipfs.infura.io/ipfs/Qmf1FKrkPeipuhMdw8LUCXcwgd2QibB9vUmyJsaZXPkBeD"}}}`

- `{"mint":{"token_id":"becca_notices", "owner":"terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95", "extension": {"external_url": "https://ipfs.infura.io/ipfs/QmYvKtfCLZaNbM9D1f2TsCPSaaDYNu6dB6f8M5gcVCu7uU"}}}`

- `{"mint":{"token_id":"bored_ape", "owner":"terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95", "extension": {"external_url": "https://ipfs.infura.io/ipfs/QmUZw1yGJexUyvsCeX6QPYsFJJfShCsqvkvEhdDHJuzMWZ"}}}`

- `{"mint":{"token_id":"towers", "owner":"terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95", "extension": {"external_url": "https://ipfs.infura.io/ipfs/QmYgfE5seqrh2khVH8WTdLTLMySA4Wzse18ghQ5i5Kdh5C"}}}`

- `{"mint":{"token_id":"trees", "owner":"terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95", "extension": {"external_url": "https://ipfs.infura.io/ipfs/QmeXTrnoVsPdqiUpzkcrmZRWC8jC6e4FK23HYFhc1sDDGw"}}}`

- `{"mint":{"token_id":"lizard", "owner":"terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95", "extension": {"external_url": "https://ipfs.infura.io/ipfs/QmQP321saFCEJPMA86sY2pCkUNFn1NQ9woLuLtYHmn5nz5"}}}`

- `{"mint":{"token_id":"tyler", "owner":"terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95", "extension": {"external_url": "https://ipfs.infura.io/ipfs/QmQVDGwSvigtCZwG8N3j7a1b6LWsgudwgcsTjakncmrXte"}}}`

- `{"mint":{"token_id":"f1", "owner":"terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95", "extension": {"external_url": "https://ipfs.infura.io/ipfs/QmerJuL4RPs9s6huJyGQT3sPp32RonHg6vnRgxVe5YpNGZ"}}}`

- `{"mint":{"token_id":"78022", "owner":"terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95", "extension": {"external_url": "https://ipfs.infura.io/ipfs/QmeeeLBTgMKSGybSMj44SoWR5XseiJHB8ratq25qggUaGs"}}}`


