const { expect } = require('chai')
const { ethers } = require('hardhat')
const { getEnvAddr } = require('../env.js')
const testAddrs = getEnvAddr(97)

describe('Testing controller', function () {
    let signer, accounts
    let usdt, U_ACC
    let smb, smbc, soul, team
    let store, controller

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

        await controller.initialize([
            usdt.address,
            store.address,
            smb.address,
            smbc.address,
            soul.address,
            team.address,
            accounts[9],
            platform,
            jackpot,
            shareHolder,
            receiveAddr,
            accounts[1]    // soulTransferAddr
        ])

        await store.initialize()
        await store.setApprovalForAll1155(smb.address, controller.address)
        await store.setOperator(controller.address, true)
        const b = await soul.balanceOf(accounts[0])
        const b2 = await usdt.balanceOf(accounts[0])
        await soul.transfer(accounts[9], ethers.utils.parseEther('100'))
        await usdt.transfer(accounts[9], ethers.utils.parseEther('590'))

        await smb.setMinter(controller.address, true)
        await smbc.setMinterBatch(controller.address, true)
        U_ACC = Number.parseInt(await usdt.decimals())
    })

    it('create - referrer', async function () {
        // accounts[1] 推荐 accounts[0]
        let recommender = accounts[1]
        const amount = 3

        // accounts[0] 余额
        let usdt_b_0_1 = await usdt.balanceOf(accounts[0])

        let platform_b_1 = await usdt.balanceOf(platform)
        let jackpot_b_1 = await usdt.balanceOf(jackpot)
        let shareHolder_b_1 = await usdt.balanceOf(shareHolder)

        // 全局数据
        let recommender_b_1 = await controller.referWallet(recommender)
        let referrers_1 = await controller.referrers(accounts[0])

        // 结构体数据
        let info1 = await controller.totalAmount()
        let info_platform_b_1 = await info1.platform
        let info_jackpot_b_1 = await info1.jackpot
        let info_shareHolder_b_1 = await info1.shareHolder
        let info_recommender_b_1 = await info1.recommender

        // ----------------------------铸造----------------------------
        await soul.approve(controller.address, ethers.constants.MaxUint256)
        await usdt.approve(controller.address, ethers.constants.MaxUint256)
        await controller.buildBox(1, 1, 0, amount, recommender)
        // ----------------------------铸造----------------------------

        // accounts[0] 余额
        let usdt_b_0_2 = await usdt.balanceOf(accounts[0])
        // 扣 4u
        expect(usdt_b_0_1.sub(ethers.utils.parseUnits('4', U_ACC).mul(amount))).to.equal(usdt_b_0_2)

        // accounts[0] 第一次铸造
        let platform_b_2 = await usdt.balanceOf(platform)
        let jackpot_b_2 = await usdt.balanceOf(jackpot)
        let shareHolder_b_2 = await usdt.balanceOf(shareHolder)

        // 第一次铸造 全局数据
        let recommender_b_2 = await controller.referWallet(recommender)
        // 推荐人数据
        let referrers_2 = await controller.referrers(accounts[0])

        // 第一次铸造 结构体数据
        let info2 = await controller.totalAmount()
        let info_platform_b_2 = await info2.platform
        let info_jackpot_b_2 = await info2.jackpot
        let info_shareHolder_b_2 = await info2.shareHolder
        let info_recommender_b_2 = await info2.recommender

        // 平台 0.8
        expect(platform_b_1.add(ethers.utils.parseUnits('0.8', U_ACC).mul(amount))).to.equal(platform_b_2)
        // 奖池 1
        expect(jackpot_b_1.add(ethers.utils.parseUnits('1', U_ACC).mul(amount))).to.equal(jackpot_b_2)
        // 股东 1.2
        expect(shareHolder_b_1.add(ethers.utils.parseUnits('1.2', U_ACC).mul(amount))).to.equal(shareHolder_b_2)


        // 推荐奖励 0.4
        expect(recommender_b_1.add(ethers.utils.parseUnits('0.4', U_ACC).mul(amount))).to.equal(recommender_b_2)

        // 推荐人为0
        expect(referrers_1).to.equal(ethers.constants.AddressZero)
        // 推荐人
        expect(referrers_2).to.equal(recommender)


        // totalAmount 结构体数据
        // 平台 0.8
        expect(info_platform_b_1.add(ethers.utils.parseUnits('0.8', U_ACC).mul(amount))).to.equal(info_platform_b_2)
        // 奖池 1
        expect(info_jackpot_b_1.add(ethers.utils.parseUnits('1', U_ACC).mul(amount))).to.equal(info_jackpot_b_2)
        // 股东 1.2
        expect(info_shareHolder_b_1.add(ethers.utils.parseUnits('1.2', U_ACC).mul(amount))).to.equal(info_shareHolder_b_2)
        // 推荐总奖金 0.4
        expect(info_recommender_b_1.add(ethers.utils.parseUnits('0.4', U_ACC).mul(amount))).to.equal(info_recommender_b_2)

        // accounts[0] 第二次铸造
        // ----------------------------铸造----------------------------
        await controller.buildBox(1, 1, 0, 1, recommender)
        // ----------------------------铸造----------------------------

        // 第二次铸造 全局数据
        let recommender_b_3 = await controller.referWallet(recommender)

        // 第二次铸造 结构体数据
        let info3 = await controller.totalAmount()
        let info_recommender_b_3 = await info3.recommender

        // 推荐奖励 0.4
        expect(recommender_b_2.add(ethers.utils.parseUnits('0.4', U_ACC))).to.equal(recommender_b_3)
        // 推荐总奖金 0.4
        expect(info_recommender_b_2.add(ethers.utils.parseUnits('0.4', U_ACC))).to.equal(info_recommender_b_3)


        let recommender_b_4 = await controller.referWallet(accounts[0])
        // accounts[0] 推荐 accounts[1]
        recommender = accounts[0]
        // accounts[1] 第一次铸造
        // ----------------------------铸造----------------------------
        await usdt.transfer(accounts[1], ethers.utils.parseUnits('10', U_ACC))
        await usdt.connect(signer[1]).approve(controller.address, ethers.constants.MaxUint256)
        await soul.transfer(accounts[1], ethers.utils.parseEther('10'))
        await soul.connect(signer[1]).approve(controller.address, ethers.constants.MaxUint256)
        await controller.connect(signer[1]).buildBox(1, 1, 0, 1, recommender)
        // ----------------------------铸造----------------------------

        let info4 = await controller.totalAmount()
        let info_recommender_b_4 = await info4.recommender

        // 推荐总奖金 0.4 + 0.3(二级) + 0.2(三级)
        expect(info_recommender_b_3.add(ethers.utils.parseUnits('0.9', U_ACC))).to.equal(info_recommender_b_4)
        // 全局数据 0.4(accounts[0]铸造) + 0.2(三级)
        expect(recommender_b_4.add(ethers.utils.parseUnits('0.6', U_ACC))).to.equal(await controller.referWallet(accounts[0]))
        // 全局数据 accounts[0]铸造 accounts[1]二级推荐 0.3(二级)
        expect(recommender_b_3.add(ethers.utils.parseUnits('0.3', U_ACC))).to.equal(await controller.referWallet(accounts[1]))
    })

    it('create - knight', async function () {
        let recommender = accounts[1]

        await team.setMeta(usdt.address, controller.address)
        let receiveAddr_b_1 = await usdt.balanceOf(receiveAddr)

        // ----------------------------铸造----------------------------
        await usdt.approve(controller.address, ethers.constants.MaxUint256)
        await soul.approve(controller.address, ethers.constants.MaxUint256)
        await controller.buildBox(1, 1, 0, 1, recommender)
        // ----------------------------铸造----------------------------
        let receiveAddr_b_2 = await usdt.balanceOf(receiveAddr)
        // 1 - 0.3 - 0.1 = 0.6
        expect(receiveAddr_b_1.add(ethers.utils.parseUnits('0.6', U_ACC))).to.equal(receiveAddr_b_2)
    })

    it('open - try 600 times', async function () {
        // 先铸造
        // await soul.transfer(accounts[1], ethers.utils.parseEther('10'))
        await usdt.transfer(accounts[1], ethers.utils.parseUnits('100000', U_ACC))
        await usdt.approve(controller.address, ethers.constants.MaxUint256)
        await soul.approve(controller.address, ethers.constants.MaxUint256)
        await controller.buildBox(1, 1, 0, 1, accounts[1])
        await controller.buildBox(1, 1, 0, 1, accounts[1])
        await controller.buildBox(1, 1, 0, 1, accounts[1])
        await controller.buildBox(1, 1, 0, 1, accounts[1])
        await controller.buildBox(1, 1, 0, 1, accounts[1])
        await controller.buildBox(1, 1, 0, 1, accounts[1])
        await controller.buildBox(1, 1, 0, 1, accounts[1])
        await controller.buildBox(1, 1, 20, 1, accounts[1])
        // await controller.buildBox(1, 1, 15, 1, accounts[1])
        // await controller.buildBox(1, 1, 20, 1, accounts[1])

        let recommender = accounts[0]

        // await usdt.transfer(accounts[1], ethers.utils.parseUnits('10', U_ACC))
        let accounts_b_1 = await usdt.balanceOf(accounts[1])
        let soul_b_1 = await soul.balanceOf(accounts[1])
        // let controller_b_1 = await smb.balanceOf(controller.address, 1)
        // let accounts_smb_b_1 = await smb.balanceOf(accounts[1], 1)


        // ----------------------------开启----------------------------
        await soul.transfer(controller.address, ethers.utils.parseEther('100000'))
        await usdt.connect(signer[1]).approve(controller.address, ethers.constants.MaxUint256)

        const amount = 20
        for (let i = 0; i < amount; i++) {
            await controller.connect(signer[1]).drawBox(ethers.constants.AddressZero, 1, 1, 1, recommender)
            const p = new Array(8).fill(accounts[1])
            const mb = await smb.balanceOfBatch(p, [1, 2, 3, 4, 5, 6, 7, 8])
        }
        // ----------------------------开启----------------------------

        let accounts_b_2 = await usdt.balanceOf(accounts[1])
        let soul_b_2 = await soul.balanceOf(accounts[1])
        // let controller_b_2 = await smb.balanceOf(controller.address, 1)
        // let accounts_smb_b_2 = await smb.balanceOf(accounts[1], 1)

        // 支付4u
        expect(accounts_b_1.sub(ethers.utils.parseUnits('4', U_ACC).mul(amount))).to.equal(accounts_b_2)
        // 得到1 soul
        // expect(soul_b_1.add(ethers.utils.parseEther('1').mul(amount))).to.equal(soul_b_2)

        // controller 合约 token = 1 减少 1 个
        // expect(controller_b_1.sub(1)).to.equal(controller_b_2)
        // accounts[1] token = 1 增加 1 个
        // expect(accounts_smb_b_1.add(1)).to.equal(accounts_smb_b_2)
    })
    it('createbox - check poolId', async function () {
        await usdt.approve(controller.address, ethers.constants.MaxUint256)
        await soul.approve(controller.address, ethers.constants.MaxUint256)
        await controller.buildBox(1, 1, 0, 1, accounts[1])
        await controller.buildBox(1, 1, 5, 2, accounts[1])
        await controller.buildBox(1, 2, 20, 2, accounts[1])


        const as = await store.viewPool(1, 1, 1)
        expect(as.length).to.equal(1)
        const as2 = await store.viewPool(1, 1, 2)
        expect(as2.length).to.equal(1)
        const as3 = await store.viewPool(1, 2, 4)
        expect(as3.length).to.equal(0)
        const as4 = await store.boxPools(10205, 0)
        expect(as4.tokenId).to.equal(3)
    })
})