const { expect } = require('chai')
const { ethers } = require('hardhat')
const { getEnvAddr } = require('../env.js')

describe('Testing soulRouter', function () {
    let signer, accounts
    let usdt, U_ACC
    let smb, smbc, soul, team, minter, s3dNft, bonus
    let store, controller, router

    let platform = '0xBcD09729602EdeD7801EB30dc0Dc686b0222111E'
    let jackpot = '0xa1bFf9029857392CB964b5B66336db47321c6369'
    let shareHolder = '0x1C8E5F9d141522E5112eB95ceBdbfE098BA55cd4'
    let receiveAddr = '0x9CfE5BEbC1867424241af395F803b62A3ec2e7CB'

    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Smb = await ethers.getContractFactory('SoulmetaItem1155')
        smb = await Smb.deploy('Soul Meta Box', 'SMB', 'https://soulmeta.io/nft-info/smb/', 'https://soulmeta.io/nft-info/smb/')

        let Smbc = await ethers.getContractFactory('SoulmetaItemBuilder721')
        smbc = await Smbc.deploy('Soul Meta Box Creator', 'SMBC', 'https://soulmeta.io/nft-info/smbc/')

        let Soul = await ethers.getContractFactory('SoulmetaToken')
        soul = await Soul.deploy()

        let Team = await ethers.getContractFactory('SoulmetaTeamNFT')
        team = await Team.deploy()
        await team.initialize('Soul Meta Community Leader', 'SMCL', 'https://soulmeta.io/nft-info/smcl/')

        let Store = await ethers.getContractFactory('SoulmetaStore')
        store = await Store.deploy()

        let Controller = await ethers.getContractFactory('SoulmetaController')
        controller = await Controller.deploy()

        let Usdt = await ethers.getContractFactory('EvilUSDT')
        usdt = await Usdt.deploy()

        let sMiner = await ethers.getContractFactory('SoulmetaItemBuilder721')
        minter = await sMiner.deploy('Soul Meta Box Creator', 'SMBC', 'https://soulmeta.io/nft-info/smbc/')

        let S3dNft = await ethers.getContractFactory('SoulmetaItemBuilder721')
        s3dNft = await S3dNft.deploy('Soul Meta Box Creator', 'S3dnft', 'https://soulmeta.io/nft-info/smbc/')

        let Bonus = await ethers.getContractFactory('SoulmetaBonus')
        bonus = await Bonus.deploy()
        await bonus.initialize(usdt.address, smb.address, soul.address, minter.address, controller.address, usdt.address,)
        await bonus.setMeta(usdt.address, smb.address, soul.address, minter.address, controller.address,usdt.address, true)

        let Router = await ethers.getContractFactory("SoulMetaRouter")
        router = await Router.deploy()

        await router.initialize([
            usdt.address,
            controller.address,
            soul.address,
            smbc.address,
            smb.address,
            store.address,
            s3dNft.address,
            accounts[9],
            minter.address,
            receiveAddr
        ])


        await controller.initialize([
            usdt.address,
            store.address,
            smb.address,
            smbc.address,
            soul.address,
            team.address,
            accounts[9],
            bonus.address,
            jackpot,
            shareHolder,
            receiveAddr,
            accounts[1],    // soulTransferAddr
            s3dNft.address,
            minter.address,
            accounts[0],
            accounts[0]
        ])

        await store.initialize()
        await soul.transfer(router.address, ethers.utils.parseEther('10000000'))
        await soul.transfer(controller.address, ethers.utils.parseEther('1000000'))

        await smb.setMinter(router.address, true)
        await smbc.setMinterBatch(router.address, true)
        await store.setApprovalForAll1155(smb.address, router.address)
        await store.setOperator(router.address, true)
        await s3dNft.setMinterBatch(accounts[0],true)
        await s3dNft.mint(accounts[0],1)
        U_ACC = Number.parseInt(await usdt.decimals())
    })

    it('createbox - check', async function () {
        await usdt.approve(controller.address, ethers.constants.MaxUint256)
        await soul.approve(controller.address, ethers.constants.MaxUint256)
        await soul.approve(router.address, ethers.constants.MaxUint256)
        await controller.setOperator(router.address, true)
        await controller.setApprovalForAll20(soul.address, router.address)
        await router.buildBox(1, 1, 0, 1, accounts[1])
        await router.buildBox(1, 1, 0, 1, accounts[1])
        await router.buildBox(1, 1, 0, 1, accounts[1])
        await router.buildBox(1, 1, 5, 1, accounts[1])
        await router.buildBox(1, 1, 10, 1, accounts[1])
        await router.buildBox(1, 1, 15, 1, accounts[1])
        await router.buildBox(1, 1, 20, 1, accounts[1])

        let pools_10101 = await store.poolSizes(10101)
        let pools_10102 = await store.poolSizes(10102)
        let pools_10103 = await store.poolSizes(10103)
        let pools_10104 = await store.poolSizes(10104)
        let pools_10105 = await store.poolSizes(10105)
        let pools_10110 = await store.poolSizes(10110)
        console.log("池子列表的数量：", pools_10101, pools_10102, pools_10103, pools_10104, pools_10105, pools_10110)


        await router.buildBox(1, 1, 0, 0, accounts[1])
        await router.buildBox(1, 1, 5, 0, accounts[1])
        await router.buildBox(1, 1, 10, 0, accounts[1])
        await router.buildBox(1, 1, 15, 0, accounts[1])
        await router.buildBox(1, 1, 20, 0, accounts[1])
        let pools_10111 = await store.poolSizes(10111)
        let pools_10112 = await store.poolSizes(10112)
        let pools_10113 = await store.poolSizes(10113)
        let pools_10114 = await store.poolSizes(10114)
        let pools_10115 = await store.poolSizes(10115)
        console.log("池子列表的数量：", pools_10111, pools_10112, pools_10113, pools_10114, pools_10115)


        await router.drawBox(accounts[0], 1, 1, 100 , accounts[1])
        await router.drawBox(accounts[0], 1, 1, 100 , accounts[1])
        await router.drawBox(accounts[0], 1, 1, 1 , accounts[1])
        await router.drawBox(accounts[0], 1, 1, 1 , accounts[1])
        await router.drawBox(accounts[0], 1, 1, 1 , accounts[1])
        let pools_2_10101 = await store.poolSizes(10101)
        let pools_2_10102 = await store.poolSizes(10102)
        let pools_2_10103 = await store.poolSizes(10103)
        let pools_2_10104 = await store.poolSizes(10104)
        let pools_2_10105 = await store.poolSizes(10105)
        let pools_2_10110 = await store.poolSizes(10110)
        console.log("剩余池子的数量：", pools_2_10101, pools_2_10102, pools_2_10103, pools_2_10104, pools_2_10105, pools_2_10110)

        let pools_2_10111 = await store.poolSizes(10111)
        let pools_2_10112 = await store.poolSizes(10112)
        let pools_2_10113 = await store.poolSizes(10113)
        let pools_2_10114 = await store.poolSizes(10114)
        let pools_2_10115 = await store.poolSizes(10115)
        console.log("池子列表的数量：", pools_2_10111, pools_2_10112, pools_2_10113, pools_2_10114, pools_2_10115)
    })
})