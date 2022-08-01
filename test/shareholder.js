const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const { syncBuiltinESMExports } = require('module')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(56)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('Testing Shareholder', function () {
    let signers, accounts
    let sharer, usdt

    const day = 30  // 30秒一天

    beforeEach(async () => {
        signers = await ethers.getSigners()
        accounts = signers.map(item => item.address)

        let Usdt = await ethers.getContractFactory('EvilUSDT')
        usdt = await Usdt.deploy()

        let Sharer = await ethers.getContractFactory('SoulmetaShareholder')
        sharer = await Sharer.deploy()
        await sharer.initialize([usdt.address, ...addrs.shareDist])
    })

    it('Shareholder --> do', async function () {
        await usdt.transfer(sharer.address, ethers.utils.parseEther('600'))
        await sharer.divide()
        const b1 = await usdt.balanceOf(addrs.shareDist[0])
        const b2 = await usdt.balanceOf(addrs.shareDist[1])
        const b3 = await usdt.balanceOf(addrs.shareDist[2])
        const b4 = await usdt.balanceOf(addrs.shareDist[3])
        const b5 = await usdt.balanceOf(addrs.shareDist[4])
        const b6 = await usdt.balanceOf(addrs.shareDist[5])

        await expect(b1).to.equal(ethers.utils.parseEther('300'))
        await expect(b2).to.equal(ethers.utils.parseEther('60'))
        await expect(b3).to.equal(ethers.utils.parseEther('45'))
        await expect(b4).to.equal(ethers.utils.parseEther('15'))
        await expect(b5).to.equal(ethers.utils.parseEther('150'))
        await expect(b6).to.equal(ethers.utils.parseEther('30'))
    })
})