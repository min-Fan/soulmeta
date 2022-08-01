const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat');

describe('Testing WorldCup', function () {
    let signer, accounts
    let soul, nft, admin, sales

    beforeEach("deploy", async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Soul = await ethers.getContractFactory("SoulmetaToken");
        soul = await Soul.deploy();
        // console.log("soul address ==>", soul.address)

        const Nft = await ethers.getContractFactory("Soulmeta3dnft");
        nft = await Nft.deploy(soul.address);
        await nft.deployed();
        // console.log("nft address ==>", nft.address)

        let Admin = await ethers.getContractFactory('NftAdmin')
        admin = await upgrades.deployProxy(Admin, [nft.address])
        await admin.deployed();
        // console.log("admin upd deployed to: ==>", admin.address)

        await nft.transferOwnership(admin.address)

        let Sales = await ethers.getContractFactory('NftSales')
        sales = await upgrades.deployProxy(Sales, [soul.address, nft.address, admin.address])
        await sales.deployed();
        // console.log("sales upd deployed to: ==>", sales.address)

        // set role
        await admin.setSalesRole(sales.address)
    })

    it('onlyOwner', async function () {
        let owner  = await nft.owner()
        console.log("owner ==>", owner) 
        let owner2  = await admin.owner()
        console.log("owner2 ==>", owner2) 
        let urlOld = await nft.baseURI()
        console.log("urlOld ==>", urlOld) 
        let setUrlTx = await admin.safeSetBaseURI("test")
        await setUrlTx.wait()
        let urlNew = await nft.baseURI()
        console.log("urlNew ==>", urlNew)
    })

    it('tonkenURI', async function() { 
        await soul.approve(sales.address, "100000000000000000000000000")
        await sales.playerMint(1, 1);
        let tokenids = await nft.getTokenIdList(accounts[0])
        let tokenUri = await sales.tokenURI(tokenids[0])
        console.log("tokenUri ==>", tokenUri)
    })

    it("isWhite", async function() {
        await sales.setWhiteList(accounts, true)
        let isWhite = await sales.isWhiteList(accounts[0])
        console.log("isWhite ==>", isWhite)
    })

    it("white create NFT", async function() {
        await sales.setWhiteList(accounts, true)
        let createTx = await sales.playerMint(1, 2)
        createTx.wait()
        let tokenids = await nft.getTokenIdList(accounts[0])
        let tokenUri = await sales.tokenURI(tokenids[0])
        console.log("admin tokenids ==>", tokenids)
        console.log("admin tokenUri ==>", tokenUri)
    })

    it("player create NFT", async function() {
        // 授权代币
        await soul.approve(sales.address, "100000000000000000000000000")
        let createTx = await sales.playerMint(1, 2)
        let createTx2 = await sales.playerMint(2, 2)
        createTx.wait()
        createTx2.wait()
        let tokenids = await nft.getTokenIdList(accounts[0])
        console.log("player tokenids ==>", tokenids)
        let balance = await soul.balanceOf(accounts[0])
        console.log("player balance ==>", balance)
    })

})