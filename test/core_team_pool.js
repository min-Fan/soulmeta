const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const { syncBuiltinESMExports } = require('module')
const { getEnvAddr } = require('../env.js')

describe('Testing Core SoulmetaTeamPool', function () {
    let usdt, frog, teamPool
    let signer, accounts

    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Usdt = await ethers.getContractFactory('EvilUSDT')
        usdt = await Usdt.deploy()

        let Frog = await ethers.getContractFactory('CryptoD721V2')
        frog = await Frog.deploy('CryptoD721V2', 'V2', '')

        await frog.setMinter(accounts[0], true)
        await frog.setGroupInfo(1, 4)
        await frog.mintMulti(accounts[1], 1, 1)
        await frog.mintMulti(accounts[2], 1, 1)
        await frog.mintMulti(accounts[3], 1, 2)

        let TeamPool = await ethers.getContractFactory('SoulmetaTeamPool')
        teamPool = await TeamPool.deploy()

        await teamPool.initialize(usdt.address, frog.address, 1)
        await teamPool.setMeta(usdt.address, frog.address, 1, true)
        await teamPool.setTokenIds([1, 2, 3, 4])
    })

    it('SoulmetaTeamPool --> getUserBonus searchUserBonus', async function () {
        await usdt.transfer(teamPool.address, ethers.utils.parseEther('100'))

        let account_1_b_1 = await usdt.balanceOf(accounts[1])
        let account_2_b_1 = await usdt.balanceOf(accounts[2])
        let account_3_b_1 = await usdt.balanceOf(accounts[3])

        let adviser_b_1 = await usdt.balanceOf(teamPool.address)

        let result_1_1 = await teamPool.searchUserBonus(accounts[1])
        let result_2_1 = await teamPool.searchUserBonus(accounts[2])
        let result_3_1 = await teamPool.searchUserBonus(accounts[3])

        await teamPool.connect(signer[1]).getUserBonus()
        // await teamPool.connect(signer[2]).getUserBonus() // 不能再领取
        // await teamPool.connect(signer[3]).getUserBonus() // 不能再领取

        let account_1_b_2 = await usdt.balanceOf(accounts[1])
        let account_2_b_2 = await usdt.balanceOf(accounts[2])
        let account_3_b_2 = await usdt.balanceOf(accounts[3])

        let adviser_b_2 = await usdt.balanceOf(teamPool.address)

        expect(account_1_b_1.add(result_1_1)).to.equal(account_1_b_2)
        expect(account_2_b_1.add(result_2_1)).to.equal(account_2_b_2)
        expect(account_3_b_1.add(result_3_1)).to.equal(account_3_b_2)

        expect(adviser_b_1).to.equal((result_1_1.add(result_2_1)).add(result_3_1))
        expect(adviser_b_2).to.equal(0)
    })

    it('SoulmetaTeamPool --> getUserBonus searchUserBonus error', async function () {
        await usdt.transfer(teamPool.address, ethers.utils.parseEther('100'))

        let result = await teamPool.searchUserBonus(accounts[4])
        expect(result).to.equal(0)

        // error
        // await teamPool.connect(signer[4]).getUserBonus()
    })
})