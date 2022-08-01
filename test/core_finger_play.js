const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const { syncBuiltinESMExports } = require('module')
const { getEnvAddr } = require('../env.js')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('Testing Core SoulmetaFingerPlay', function () {
    let soul, smbc, fingerPlay, fingerPlayBonus
    let signer, accounts

    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Soul = await ethers.getContractFactory('SoulmetaToken')
        soul = await Soul.deploy()

        let Smbc = await ethers.getContractFactory('SoulmetaItemBuilder721')
        smbc = await Smbc.deploy('Soul Meta Box Creator', 'SMBC', 'https://soulmeta.io/nft-info/smbc/')

        let FingerPlay = await ethers.getContractFactory('SoulmetaFingerPlay')
        fingerPlay = await FingerPlay.deploy()

        let FingerPlayBonus = await ethers.getContractFactory('SoulmetaFingerPlayBonus')
        fingerPlayBonus = await FingerPlayBonus.deploy()

        await fingerPlayBonus.initialize(soul.address, fingerPlay.address, smbc.address)

        await fingerPlay.initialize(accounts[0], soul.address, fingerPlayBonus.address, accounts[2])
        await fingerPlay.setMeta(accounts[0], soul.address, fingerPlayBonus.address, accounts[2], true)
    })

    it('SoulmetaFingerPlay --> enterRoom', async function () {
        const roomId = 20
        const amount = ethers.utils.parseEther('10')

        await soul.transfer(accounts[5], ethers.utils.parseEther('20'))
        await soul.transfer(accounts[6], ethers.utils.parseEther('40'))

        let soul_b_5_1 = await soul.balanceOf(accounts[5])
        let soul_b_6_1 = await soul.balanceOf(accounts[6])

        let in_room_5_1 = await fingerPlay.inRoomId(accounts[5])
        let in_room_6_1 = await fingerPlay.inRoomId(accounts[6])

        await soul.connect(signer[5]).approve(fingerPlay.address, ethers.constants.MaxUint256)
        await fingerPlay.connect(signer[5]).enterRoom(roomId, amount, 1)

        let soul_b_5_2 = await soul.balanceOf(accounts[5])

        let result1 = await fingerPlay.roomIdToUserInfo(roomId)
        let in_room_5_2 = await fingerPlay.inRoomId(accounts[5])
        let in_room_6_2 = await fingerPlay.inRoomId(accounts[6])

        expect(in_room_5_1).to.equal(0)
        expect(in_room_6_1).to.equal(0)
        expect(in_room_5_2).to.equal(roomId)
        expect(in_room_6_2).to.equal(0)

        expect(soul_b_5_1.sub(amount)).to.equal(soul_b_5_2)
        expect(result1.addr1).to.equal(accounts[5])
        expect(result1.addr2).to.equal(ethers.constants.AddressZero)
        expect(result1.amount).to.equal(amount)

        await soul.connect(signer[6]).approve(fingerPlay.address, ethers.constants.MaxUint256)
        await fingerPlay.connect(signer[6]).enterRoom(roomId, ethers.utils.parseEther('30'), 2)

        let soul_b_6_2 = await soul.balanceOf(accounts[6])

        let result2 = await fingerPlay.roomIdToUserInfo(roomId)
        let in_room_5_3 = await fingerPlay.inRoomId(accounts[5])
        let in_room_6_3 = await fingerPlay.inRoomId(accounts[6])

        expect(in_room_5_3).to.equal(roomId)
        expect(in_room_6_3).to.equal(roomId)

        expect(soul_b_6_1.sub(amount)).to.equal(soul_b_6_2)
        expect(result2.addr1).to.equal(accounts[5])
        expect(result2.addr2).to.equal(accounts[6])
        expect(result2.amount).to.equal(amount)

        // error fill up
        // await fingerPlay.connect(signer[7]).enterRoom(roomId, ethers.utils.parseEther('30'), 1)
    })

    it('SoulmetaFingerPlay --> settleGame', async function () {
        const roomId = 20
        const amount = ethers.utils.parseEther('10')

        await soul.transfer(accounts[5], ethers.utils.parseEther('20'))
        await soul.transfer(accounts[6], ethers.utils.parseEther('40'))

        let soul_b_5_1 = await soul.balanceOf(accounts[5])
        let soul_b_6_1 = await soul.balanceOf(accounts[6])

        let in_room_5_1 = await fingerPlay.inRoomId(accounts[5])
        let in_room_6_1 = await fingerPlay.inRoomId(accounts[6])

        await soul.connect(signer[5]).approve(fingerPlay.address, ethers.constants.MaxUint256)
        await fingerPlay.connect(signer[5]).enterRoom(roomId, amount, 2)

        let soul_b_2_2 = await soul.balanceOf(accounts[5])

        let result1 = await fingerPlay.roomIdToUserInfo(roomId)
        let in_room_5_2 = await fingerPlay.inRoomId(accounts[5])
        let in_room_6_2 = await fingerPlay.inRoomId(accounts[6])

        expect(in_room_5_1).to.equal(0)
        expect(in_room_6_1).to.equal(0)
        expect(in_room_5_2).to.equal(roomId)
        expect(in_room_6_2).to.equal(0)

        expect(soul_b_5_1.sub(amount)).to.equal(soul_b_2_2)
        expect(result1.addr2).to.equal(accounts[5])
        expect(result1.addr1).to.equal(ethers.constants.AddressZero)
        expect(result1.amount).to.equal(amount)

        await soul.connect(signer[6]).approve(fingerPlay.address, ethers.constants.MaxUint256)
        await fingerPlay.connect(signer[6]).enterRoom(roomId, ethers.utils.parseEther('30'), 1)

        let soul_b_6_2 = await soul.balanceOf(accounts[6])

        let result2 = await fingerPlay.roomIdToUserInfo(roomId)
        let in_room_5_3 = await fingerPlay.inRoomId(accounts[5])
        let in_room_6_3 = await fingerPlay.inRoomId(accounts[6])

        expect(in_room_5_3).to.equal(roomId)
        expect(in_room_6_3).to.equal(roomId)

        expect(soul_b_6_1.sub(amount)).to.equal(soul_b_6_2)
        expect(result2.addr2).to.equal(accounts[5])
        expect(result2.addr1).to.equal(accounts[6])
        expect(result2.amount).to.equal(amount)

        let winner = accounts[5]

        let soul_fish_b_1 = await soul.balanceOf(fingerPlay.address)
        let soul_fish_bonus_b_1 = await soul.balanceOf(fingerPlayBonus.address)
        let winner_b_1 = await soul.balanceOf(winner)

        await fingerPlay.settleGame(roomId, winner)

        let soul_fish_b_2 = await soul.balanceOf(fingerPlay.address)
        let soul_fish_bonus_b_2 = await soul.balanceOf(fingerPlayBonus.address)
        let winner_b_2 = await soul.balanceOf(winner)

        let in_room_5_4 = await fingerPlay.inRoomId(accounts[5])
        let in_room_6_4 = await fingerPlay.inRoomId(accounts[6])

        expect(in_room_5_4).to.equal(0)
        expect(in_room_6_4).to.equal(0)

        expect(amount.mul(2).mul(1).div(100)).to.equal(soul_fish_b_2)
        expect(soul_fish_bonus_b_1.add(amount.mul(2).mul(2).div(100))).to.equal(soul_fish_bonus_b_2)
        expect(winner_b_1.add(amount.mul(2).mul(90).div(100))).to.equal(winner_b_2)
    })
})