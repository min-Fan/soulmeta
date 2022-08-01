const { expect } = require('chai')
const { ethers } = require('hardhat')
const { getEnvAddr } = require('../env.js')
const testAddrs = getEnvAddr(97)

describe('Testing team', function () {
    let signer, accounts
    let team, usdt, U_ACC

    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Team = await ethers.getContractFactory('SoulmetaTeamNFT')
        team = await Team.deploy()
        await team.initialize('Soul Meta Community Leader', 'SMCL', 'https://soulmeta.io/nft-info/smcl/')
        let Usdt = await ethers.getContractFactory('EvilUSDT')
        usdt = await Usdt.deploy()
        await team.setMeta(usdt.address, accounts[0])
        U_ACC = Number.parseInt(await usdt.decimals())
    })

    it('New Team', async function () {
        let balance

        balance = await team.balanceOf(accounts[1])
        expect(balance).to.equal(0)

        await team.newTeam(accounts[1], 0)

        balance = await team.balanceOf(accounts[1])
        expect(balance).to.equal(5)
    })

    it('Add Reward', async function () {

        let info = await team.teams(accounts[1])
        const totalReward1 = info.totalReward

        await team.addReward(accounts[1], ethers.utils.parseUnits('0.6', U_ACC))

        info = await team.teams(accounts[1])
        const totalReward2 = info.totalReward
        expect(totalReward1.add(ethers.utils.parseUnits('0.6', U_ACC))).to.equal(totalReward2)
    })

    it('Claim Reward', async function () {
        await team.newTeam(accounts[1], 0)
        await team.addReward(accounts[1], ethers.utils.parseUnits('0.6', U_ACC))
        await usdt.transfer(team.address, ethers.utils.parseUnits('200', U_ACC))

        const meta = await team.meta()

        const b1 = await usdt.balanceOf(accounts[1])
        const tokenId = await team.tokenOfOwnerByIndex(accounts[1], 0)

        await team.connect(signer[1]).claimReward(tokenId)
        const b2 = await usdt.balanceOf(accounts[1])
        const b = await usdt.balanceOf(team.address)
        expect(b).to.equal(ethers.utils.parseUnits('199.4', U_ACC))
        expect(b1.add(ethers.utils.parseUnits('0.6', U_ACC))).to.equal(b2)

        let info = await team.teams(accounts[1])
        expect(info.totalReward).to.equal(info.rewarded)
    })

    it('Claim Reward', async function () {
        await team.newTeam(accounts[1], 0)
        await team.addReward(accounts[1], ethers.utils.parseUnits('0.6', U_ACC))
        await usdt.transfer(team.address, ethers.utils.parseUnits('200', U_ACC))

        const b1 = await usdt.balanceOf(accounts[1])
        const tokenId = await team.tokenOfOwnerByIndex(accounts[1], 0)

        await team.connect(signer[1]).claimReward(tokenId)
        const b2 = await usdt.balanceOf(accounts[1])
        const b = await usdt.balanceOf(team.address)
        expect(b).to.equal(ethers.utils.parseUnits('199.4', U_ACC))
        expect(b1.add(ethers.utils.parseUnits('0.6', U_ACC))).to.equal(b2)

        let info = await team.teams(accounts[1])
        expect(info.totalReward).to.equal(info.rewarded)
    })

    it('Claim Reward multiple account', async function () {
        await team.newTeam(accounts[1], 0)
        await team.newTeam(accounts[5], 0)
        await team.addReward(accounts[1], ethers.utils.parseUnits('0.6', U_ACC))
        await usdt.transfer(team.address, ethers.utils.parseUnits('200', U_ACC))

        const b1_1 = await usdt.balanceOf(accounts[1])
        const b2_1 = await usdt.balanceOf(accounts[2])
        let tokenId = await team.tokenOfOwnerByIndex(accounts[1], 0)
        let tokenId1 = await team.tokenOfOwnerByIndex(accounts[1], 1)
        await team.connect(signer[1]).transferFrom(accounts[1], accounts[2], tokenId)
        await team.connect(signer[1]).transferFrom(accounts[1], accounts[2], tokenId1)

        const b5_1 = await usdt.balanceOf(accounts[5])
        tokenId = await team.tokenOfOwnerByIndex(accounts[5], 3)
        await team.connect(signer[5]).claimReward(tokenId)
        const b5_2 = await usdt.balanceOf(accounts[5])
        expect(tokenId).to.equal(9)
        expect(b5_1).to.equal(b5_2)

        tokenId = await team.tokenOfOwnerByIndex(accounts[1], 0)
        await team.connect(signer[1]).claimReward(tokenId)
        const b1_2 = await usdt.balanceOf(accounts[1])
        const b2_2 = await usdt.balanceOf(accounts[2])
        const b = await usdt.balanceOf(team.address)
        expect(b).to.equal(ethers.utils.parseUnits('199.4', U_ACC))
        expect(b1_1.add(ethers.utils.parseUnits('0.36', U_ACC))).to.equal(b1_2)
        expect(b2_1.add(ethers.utils.parseUnits('0.24', U_ACC))).to.equal(b2_2)


    })

    it('multiple newTeam', async function () {
        await team.newTeamBatch([accounts[1], accounts[2]], 2)

        const b1 = await team.balanceOf(accounts[1])
        const b2 = await team.balanceOf(accounts[2])
        const b0 = await team.balanceOf(accounts[0])

        expect(b1).to.equal(3)
        expect(b2).to.equal(3)
        expect(b0).to.equal(4)

        const leader1 = await team.leaders(await team.tokenOfOwnerByIndex(accounts[0], 0))
        const leader2 = await team.leaders(await team.tokenOfOwnerByIndex(accounts[0], 1))
        expect(leader1).to.equal(accounts[1])
        expect(leader2).to.equal(accounts[1])
        const leader3 = await team.leaders(await team.tokenOfOwnerByIndex(accounts[0], 2))
        const leader4 = await team.leaders(await team.tokenOfOwnerByIndex(accounts[0], 3))
        expect(leader3).to.equal(accounts[2])
        expect(leader4).to.equal(accounts[2])


        let leader = await team.leaders(await team.tokenOfOwnerByIndex(accounts[1], 2))
        expect(leader).to.equal(accounts[1])
        leader = await team.leaders(await team.tokenOfOwnerByIndex(accounts[2], 1))
        expect(leader).to.equal(accounts[2])
    })

})
