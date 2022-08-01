const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const { syncBuiltinESMExports } = require('module')
const { getEnvAddr } = require('../env.js')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('Testing Core Bonus', function () {
    let signer
    let soul, bonus, usdt, lp
    let nowDay
    let block

    const day = 30  // 30秒一天

    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Smb = await ethers.getContractFactory('SoulmetaItem1155')
        smb = await Smb.deploy('Soul Meta Box', 'SMB', 'https://soulmeta.io/nft-info/smb/', 'https://soulmeta.io/nft-info/smb/')

        let Soul = await ethers.getContractFactory('SoulmetaToken')
        soul = await Soul.deploy()

        let Usdt = await ethers.getContractFactory('EvilUSDT')
        usdt = await Usdt.deploy()

        let Lp = await ethers.getContractFactory('MockPair')
        lp = await upgrades.deployProxy(Lp, ['Soul LP', 'LP'], {initializer: 'initialize'})

        let NewLp = await ethers.getContractFactory('MockPair')
        newLp = await upgrades.deployProxy(NewLp, ['Soul LP', 'LP'], {initializer: 'initialize'})

        await smb.setMinter(accounts[0], true)

        let Bonus = await ethers.getContractFactory('SoulmetaBonus')
        bonus = await Bonus.deploy()
        await bonus.initialize(usdt.address, smb.address, soul.address, lp.address, accounts[0], newLp.address)
        await bonus.setMeta(usdt.address, smb.address, soul.address, lp.address, accounts[0], newLp.address, true)
    })

    it('SoulmetaBonus --> receiveOldLp', async function () {
        const oldlp = 90
        const inputlp = 60

        await bonus.setUserData(accounts[0],
            0,
            0,
            ethers.utils.parseEther(oldlp + ''),
            0,
            0,
            19150,
            19150,
            0,
            false
        )
        await bonus.setUserDayData(19150, accounts[0], 0, 0, ethers.utils.parseEther(oldlp + ''))
        await bonus.setTotalDayData(19150, 0, 500, ethers.utils.parseEther('100'))


        await lp.transfer(bonus.address, ethers.utils.parseEther('100'))

        let bonus_old_b_1 = await lp.balanceOf(bonus.address)
        let bonus_new_b_1 = await newLp.balanceOf(bonus.address)
        let result1 = await bonus.userInfos(accounts[0])

        await lp.approve(bonus.address, ethers.constants.MaxUint256)
        await newLp.approve(bonus.address, ethers.constants.MaxUint256)
        await bonus.inputTokenApi(ethers.utils.parseEther(inputlp + ''))

        let result2 = await bonus.userInfos(accounts[0])

        expect(result1.lp).to.equal(ethers.utils.parseEther(oldlp + ''))
        expect(result2.lp).to.equal(ethers.utils.parseEther(inputlp + ''))
        expect(result2.oldLp).to.equal(result1.lp)

        let lp_b_1 = await lp.balanceOf(accounts[0])
        let newLp_b_1 = await newLp.balanceOf(accounts[0])

        await bonus.receiveOldLp()

        let bonus_old_b_2 = await lp.balanceOf(bonus.address)
        let bonus_new_b_2 = await newLp.balanceOf(bonus.address)

        let lp_b_2 = await lp.balanceOf(accounts[0])
        let newLp_b_2 = await newLp.balanceOf(accounts[0])

        expect(lp_b_1.add(ethers.utils.parseEther(oldlp + ''))).to.equal(lp_b_2)
        expect(bonus_old_b_1.sub(ethers.utils.parseEther(oldlp + ''))).to.equal(bonus_old_b_2)
        expect(bonus_new_b_1.add(ethers.utils.parseEther(inputlp + ''))).to.equal(bonus_new_b_2)
        expect(newLp_b_1).to.equal(newLp_b_2)
    })

    // it('SoulmetaBonus --> inputSoulApi', async function () {
    //     block = await ethers.provider.getBlock()
    //     nowDay = parseInt(block.timestamp / day)

    //     await soul.transfer(accounts[0], ethers.utils.parseEther('30'))

    //     let soul_b_1 = await soul.balanceOf(accounts[0])
    //     let dayToken_1 = await bonus.dayToDayToken(nowDay, accounts[0])
    //     let total_1 = await bonus.totalInput()

    //     await soul.approve(bonus.address, ethers.constants.MaxUint256)
    //     await bonus.inputSoulApi(ethers.utils.parseEther('10'))

    //     let soul_b_2 = await soul.balanceOf(accounts[0])
    //     let dayToken_2 = await bonus.dayToDayToken(nowDay, accounts[0])
    //     let total_2 = await bonus.totalInput()

    //     expect(soul_b_1.sub(ethers.utils.parseEther('10'))).to.equal(soul_b_2)
    //     expect(dayToken_1.soul.add(ethers.utils.parseEther('10'))).to.equal(dayToken_2.soul)
    //     expect(total_1.soul.add(ethers.utils.parseEther('10'))).to.equal(total_2.soul)
    // })

    // it('SoulmetaBonus --> inputNftApi', async function () {
    //     const tokenId = 10086
    //     await smb.mint(accounts[0], tokenId, 100)

    //     let nft1155_b_1 = await smb.balanceOf(accounts[0], tokenId)
    //     let positive_1 = await bonus.appraise(tokenId)
    //     let negative_1 = await bonus.appraise(tokenId)

    //     let total_1 = await bonus.totalInput()

    //     await smb.setApprovalForAll(bonus.address, true)
    //     await bonus.inputNftApi(1, [tokenId, tokenId, tokenId])

    //     let nft1155_b_2 = await smb.balanceOf(accounts[0], tokenId)
    //     let positive_2 = await bonus.appraise(tokenId)
    //     let total_2 = await bonus.totalInput()
        
    //     expect(nft1155_b_1.sub(3)).to.equal(nft1155_b_2)
    //     expect(positive_1.positive.add(3)).to.equal(positive_2.positive)
    //     expect(total_1.nft.add(3)).to.equal(total_2.nft)

    //     await bonus.inputNftApi(2, [tokenId, tokenId, tokenId])

    //     let negative_2 = await bonus.appraise(tokenId)
    //     let total_3 = await bonus.totalInput()
    //     expect(negative_1.negative.add(3)).to.equal(negative_2.negative)
    //     expect(total_2.nft.add(3)).to.equal(total_3.nft)
    //     expect(total_1.nft.add(6)).to.equal(total_3.nft)
    // })

    // it('SoulmetaBonus --> inputTokenApi', async function () {
    //     // await lp.transfer(accounts[0], ethers.utils.parseEther('20'))

    //     let lp_b_1 = await lp.balanceOf(accounts[0])
    //     let total_1 = await bonus.totalInput()

    //     await lp.approve(bonus.address, ethers.constants.MaxUint256)
    //     await bonus.inputTokenApi(ethers.utils.parseEther('1'))

    //     let lp_b_2 = await lp.balanceOf(accounts[0])
    //     let total_2 = await bonus.totalInput()

    //     expect(lp_b_1.sub(ethers.utils.parseEther('1'))).to.equal(lp_b_2)
    //     expect(total_1.lp.add(ethers.utils.parseEther('1'))).to.equal(total_2.lp)
    // })

    // it('SoulmetaBonus --> receiveTokenApi', async function () {
    //     // await lp.transfer(bonus.address, ethers.utils.parseEther('20'))
        
    //     let lp_b_1 = await lp.balanceOf(accounts[0])
    //     let total_1 = await bonus.totalInput()

    //     await lp.approve(bonus.address, ethers.constants.MaxUint256)
    //     await bonus.inputTokenApi(ethers.utils.parseEther('2'))

    //     let lp_b_2 = await lp.balanceOf(accounts[0])
    //     let total_2 = await bonus.totalInput()

    //     await sleep(30000)
    //     await bonus.receiveTokenApi()

    //     let lp_b_3 = await lp.balanceOf(accounts[0])
    //     let total_3 = await bonus.totalInput()

    //     expect(lp_b_1.sub(ethers.utils.parseEther('2'))).to.equal(lp_b_2)
    //     expect(lp_b_1).to.equal(lp_b_3)

    //     expect(total_1.lp.add(ethers.utils.parseEther('2'))).to.equal(total_2.lp)
    //     expect(total_1.lp).to.equal(total_3.lp)
    // })

    // it('SoulmetaBonus --> searchUserBonusApi getUserBonusApi', async function () {
    //     const tokenId = 10086
    //     const bonusPool = 683
    //     const nft_1 = 30
    //     const nft_2 = 70
    //     const soul_1 = 98
    //     const soul_2 = 23
    //     const lp_1 = 23
    //     const lp_2 = 12

    //     // const keep_decimal = 10 // 保留位

    //     await smb.mint(accounts[0], tokenId, 1000)
    //     await smb.mint(accounts[1], tokenId, 1000)
    //     // await soul.transfer(accounts[0], ethers.utils.parseEther('1000'))
    //     await soul.transfer(accounts[1], ethers.utils.parseEther('5000'))

    //     // await lp.mint(accounts[0], ethers.utils.parseEther('50'))
    //     await lp.mint(accounts[1], ethers.utils.parseEther('50'))

    //     await usdt.transfer(bonus.address, ethers.utils.parseEther('5000'))

    //     let inputNft_0 = []
    //     let inputNft_1 = []

    //     for (var i = 0; i < nft_1; i++) {
    //         inputNft_0.push(tokenId)
    //     }

    //     for (var i = 0; i < nft_2; i++) {
    //         inputNft_1.push(tokenId)
    //     }

    //     await smb.setApprovalForAll(bonus.address, true)
    //     await bonus.inputNftApi(1, inputNft_0)

    //     await smb.connect(signer[1]).setApprovalForAll(bonus.address, true)
    //     await bonus.connect(signer[1]).inputNftApi(1, inputNft_1)

    //     block = await ethers.provider.getBlock()
    //     nowDay = parseInt(block.timestamp / day)

    //     // 分红池
    //     await bonus.addBonus(nowDay, ethers.utils.parseEther(bonusPool + ""))

    //     let dayToken_0_1 = await bonus.dayToDayToken(nowDay, accounts[0])
    //     let dayToken_1_1 = await bonus.dayToDayToken(nowDay, accounts[1])
    //     let totalDayToken_1 = await bonus.totalDayToken(nowDay)
    //     let total_1 = await bonus.totalInput()

    //     expect(dayToken_0_1.nft).to.equal(nft_1)
    //     expect(dayToken_1_1.nft).to.equal(nft_2)
    //     expect((dayToken_0_1.nft).add(dayToken_1_1.nft)).to.equal(totalDayToken_1.nft)
    //     expect(total_1.nft).to.equal(nft_1 + nft_2)

    //     let pool = await bonus.bonusPool(nowDay)
    //     expect(pool).to.equal(ethers.utils.parseEther(bonusPool + ""))

    //     // ------------------------------------------------------------------------------------

    //     let soul_b_0_1 = await soul.balanceOf(accounts[0])
    //     let soul_b_1_1 = await soul.balanceOf(accounts[1])

    //     await soul.approve(bonus.address, ethers.constants.MaxUint256)
    //     await bonus.inputSoulApi(ethers.utils.parseEther(soul_1 + ""))
    //     await soul.connect(signer[1]).approve(bonus.address, ethers.constants.MaxUint256)
    //     await bonus.connect(signer[1]).inputSoulApi(ethers.utils.parseEther(soul_2 + ""))

    //     let soul_b_0_2 = await soul.balanceOf(accounts[0])
    //     let soul_b_1_2 = await soul.balanceOf(accounts[1])

    //     let total_2 = await bonus.totalInput()

    //     expect(soul_b_0_1.sub(ethers.utils.parseEther(soul_1 + ""))).to.equal(soul_b_0_2)
    //     expect(soul_b_1_1.sub(ethers.utils.parseEther(soul_2 + ""))).to.equal(soul_b_1_2)

    //     expect(total_1.soul.add(ethers.utils.parseEther(soul_1 + soul_2 + ""))).to.equal(total_2.soul)

    //     // ------------------------------------------------------------------------------------

    //     let lp_b_0_1 = await lp.balanceOf(accounts[0])
    //     let lp_b_1_1 = await lp.balanceOf(accounts[1])

    //     await lp.approve(bonus.address, ethers.constants.MaxUint256)
    //     await bonus.inputTokenApi(ethers.utils.parseEther(lp_1 + ""))
    //     await lp.connect(signer[1]).approve(bonus.address, ethers.constants.MaxUint256)
    //     await bonus.connect(signer[1]).inputTokenApi(ethers.utils.parseEther(lp_2 + ""))

    //     let lp_b_0_2 = await lp.balanceOf(accounts[0])
    //     let lp_b_1_2 = await lp.balanceOf(accounts[1])

    //     let total_3 = await bonus.totalInput()

    //     expect(lp_b_0_1.sub(ethers.utils.parseEther(lp_1 + ""))).to.equal(lp_b_0_2)
    //     expect(lp_b_1_1.sub(ethers.utils.parseEther(lp_2 + ""))).to.equal(lp_b_1_2)

    //     expect(total_1.lp.add(ethers.utils.parseEther(lp_1 + lp_2 + ""))).to.equal(total_3.lp)

    //     block = await ethers.provider.getBlock()
    //     console.log(block.timestamp)

    //     // await sleep(40000)

    //     block = await ethers.provider.getBlock()
    //     console.log(block.timestamp)

    //     // 当天查

    //     let result1 = await bonus.searchUserBonusApi(accounts[0])
    //     console.log(result1[0])
    //     console.log(result1[1])
    //     console.log(result1[2])
    //     console.log(result1[3])


    //     // let result2 = await bonus.connect(signer[1]).searchUserBonusApi(accounts[1])

    //     // let usdt_b_0_1 = await usdt.balanceOf(accounts[0])
    //     // let usdt_b_1_1 = await usdt.balanceOf(accounts[1])

    //     // console.log(result1)
    //     // console.log(result2)

    //     // console.log(usdt_b_0_1)
    //     // console.log(usdt_b_1_1)

    //     // // 下一天领

    //     // let qqqqq = await usdt.balanceOf(bonus.address)
    //     // console.log(qqqqq)

    //     // await bonus.getUserBonusApi()
    //     // await bonus.connect(signer[1]).getUserBonusApi()
    //     // let usdt_b_0_2 = await usdt.balanceOf(accounts[0])
    //     // let usdt_b_1_2 = await usdt.balanceOf(accounts[1])

    //     // console.log(usdt_b_0_2)
    //     // console.log(usdt_b_1_2)

    //     // console.log(result1[0].accumulate)

    //     // expect((usdt_b_0_2 - usdt_b_0_1 + "").slice(0, keep_decimal)).to.equal((result1[0].accumulate + "").slice(0, keep_decimal))
    //     // expect((usdt_b_1_2 - usdt_b_1_1 + "").slice(0, keep_decimal)).to.equal((result2[0].accumulate + "").slice(0, keep_decimal))
    // })
})