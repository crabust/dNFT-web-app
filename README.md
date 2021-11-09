# dNFT: NFT derivatives dApp 

This dApp is a [DeFi & Cross-chain Interoperability Hackathon](https://gitcoin.co/issue/terra-money/bounties/2/100026890) submission and consists of two parts:

- [front-end dApp](https://github.com/akalmykov/dcw721-dapp/), this repository
- [a cw721 contract with metadata extension](https://github.com/akalmykov/dcw721-contract/)

dNFT is a dApp that give NFT collectors an opportunity to mint derivtive NFT artworks based on the NFTs they already own. The derivative NFTs are procedurally generated based original NFTs and are fully owned by a collector. dNFT is completely decentralized, has no backend and all maginc happens right in your browser.

This proof-of-concept dApp supports one generation method - Nerual Style Transfer. However, in the future, dNFT will support several generation methods and would allow adding new as plugins. 

The smart contract behind dNFT is based on cw721 standard with metadata extension (see [dcw721-contract repository](https://github.com/akalmykov/dcw721-contract/)). Any derivative NFT stores links (`token_id`) of the original NFTs and generation parameters. This allows to

- traceback any derivative back to the original artwork
- prove the ownership of the original NFTs in time of minting a derivative
- deterministically recreate any derivative artwork from sources
- make derivatives unique: an owner can't mint several derivatives with the same "derivation" method

When dNFT is fully developed into an NFT marketplace, it will allow the creators earn royalties from sale and re-sale of the derivatives based on their original NFTs. 

# Using the dApp

Connect to Terra Extension and wait for your collection to be loaded. Choose a content NFT (left) and apply to it the style of a another NFT (right). Try different parameeters and model settings. The resulting image can be minted as a derivative NFT. Click "Reload NFT Collection" to see your minted derivative.
<p align="center"><img src="https://user-images.githubusercontent.com/4420479/140731951-3b484e92-bea6-4c2d-8dca-c38618549d69.png" width=50% height=50%></p>

# Building and Running locally
To build dNFT dApp, install Yarn, go to the repository root and execute:

`yarn install`

`yarn build`

To launch dNFT locally, run:

`yarn run start`

Open the dApp in Google Chrome with Terra Extension installed.

# Live Demo on Bombay-12 testnet

The live demo is available here: https://dare2defy.xyz
A link to vide demo: https://youtu.be/rsoNpKQ0HUo

You can use one of the following ready-made test accounts with original, pre-minted NFTs:
| Account   | Address                                                                                                  | Mnemonic                                                                                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| test5     | `terra18wlvftxzj6zt0xugy2lr9nxzu402690ltaf4ss`                                                           | `second render cat sing soup reward cluster island bench diet lumber grocery repeat balcony perfect diesel stumble piano distance caught occur example ozone loyal`        |
| test7     | `terra17tv2hvwpg0ukqgd2y5ct2w54fyan7z0zxrm2f9`                                                           | `noble width taxi input there patrol clown public spell aunt wish punch moment will misery eight excess arena pen turtle minimum grain vague inmate`                       |
| test9     | `terra1333veey879eeqcff8j3gfcgwt8cfrg9mq20v6f`                                                           | `index light average senior silent limit usual local involve delay update rack cause inmate wall render magnet common feature laundry exact casual resource hundred`       |
| test11    | `terra1jh0v64kew5agna23gzg6akuyqd46nrsk8kudks`                                                           | `october next pepper inject angry climb observe enable merry rebuild worry rhythm shallow throw panda cloud capital sunset insane badge maximum shoot destroy flag`     |

You can use them to test the dApp and derivative minting using a pre-deployed contract `terra1zzf3207sepmhs2t8f2j0zwsklgahrtchn5hxth` on Bombay-12 testnet.

Note that only original minter, which is set when contract is created, can mint original NFTs. If you want to mint new original NFTs, you can use minter's account `terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp` with mnemonics

`quality vacuum heart guard buzz spike sight swarm shove special gym robust assume sudden deposit grid alcohol choice devote leader tilt noodle tide penalty`

Alternatively, you can deploy a brand new contract and make the dApp work with your contract by following the instruction below.

# How to deploy your own contract (step-by-step instruction)
## Uploadign and creating a contract

Before you start, you will need Chrome with Terra Extention installed. 

- Create two Terra accounts: an original minter's account and an ownwer's account. They both will need some LUNA balance to pay for gas fees. For illustration, we are going to use
    - `terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp` as a minter's account
    - `terra1757tkx08n0cqrw7p86ny9lnxsqeth0wgp0em95` as an NFT owner's account
- First, we need to login to Terra Extention and authorize in https://station.terra.money/contracts with the minter's account
<p align="center"><img src="https://user-images.githubusercontent.com/4420479/140627523-4503e432-3e6e-44dc-84e6-c8c8de97f0d1.png" width=50% height=50%></p>

- Click "Upload" button, and upload cw721terra.wasm from the [contract repository](https://github.com/akalmykov/dcw721-contract/) (see `artifacts` directory)
 
<p align="center"><img src="https://user-images.githubusercontent.com/4420479/140627562-a910040d-b5e9-464b-bde2-b1bae40bd01e.png" width=50% height=50%></p>

- In the "History" tab, find "Store" transaction for the code upload. You will see code_id 18145 in the transaction title.
<p align="center"><img src="https://user-images.githubusercontent.com/4420479/140627722-0fc199a8-574e-4f12-a42d-cccdf160106e.png" width=50% height=50%></p>

- Alternatively, look at the transaction details and locate store code_id:

<p align="center"><img src="https://user-images.githubusercontent.com/4420479/140627739-acd20249-e7d5-47b4-996c-4a2f05424772.png" width=50% height=50%></p>

- Next, create a new contract with Code 18145 and InitMsg json as follows:

`{"name":"dnft7", "symbol":"SMB", "minter":"terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp"}`

Fields `name` and `symbol` can be arbitrary, the only important field in `minter`. Only this address can mint original NFTs, which could be later used by their owners to produce derivative artwork.

<p align="center"><img src="https://user-images.githubusercontent.com/4420479/140645746-6bfd1330-55ce-4897-b905-978354049c6c.png" width=50% height=50%></p>

- After creating the contract, go to History tab and find `MsgInstantiateContract` transaction
<p align="center"><img src="https://user-images.githubusercontent.com/4420479/140627714-59027b81-e12e-40b5-9111-f761affefc15.png" width=50% height=50%></p>

- In this transaction details, locate `contract_address` field
<p align="center"><img src="https://user-images.githubusercontent.com/4420479/140645930-d0da648a-eb48-451b-8831-a938abdfdf50.png" width=50% height=50%></p>

- Your contract address is `terra1zzf3207sepmhs2t8f2j0zwsklgahrtchn5hxth`. Open `index.html`, find `CONTRACT_ADDRESS` in the `<head>` section and change it to your contract address:

```
<script>  
    const CONTRACT_ADDRESS = "terra1zzf3207sepmhs2t8f2j0zwsklgahrtchn5hxth";      
</script>
```


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

**Note**: If you mint new NFTs, make sure that they have unique `token_id` values.
