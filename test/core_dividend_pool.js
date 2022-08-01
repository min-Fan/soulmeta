const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const { syncBuiltinESMExports } = require('module')
const { getEnvAddr } = require('../env.js')

function preMonth(month) {
    return month % 100 == 1 ? month - 89 : month - 1;
}

function nextMonth(month) {
    return month % 100 == 12 ? month + 89 : month + 1;
}

describe('Testing Core SoulmetaDividendPool', function () {
    let usdt, frog, dividendPool
    let signer, accounts, month
    let time = new Date()

    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Usdt = await ethers.getContractFactory('EvilUSDT')
        usdt = await Usdt.deploy()

        let Frog = await ethers.getContractFactory('CryptoD721V2')
        frog = await Frog.deploy('CryptoD721V2', 'V2', '')

        await frog.setMinter(accounts[0], true)
        await frog.setGroupInfo(1, 10)
        await frog.setGroupInfo(2, 10) // 不影响
        await frog.mintMulti(accounts[1], 1, 5)
        await frog.mintMulti(accounts[2], 1, 4)

        let DividendPool = await ethers.getContractFactory('SoulmetaDividendPool')
        dividendPool = await DividendPool.deploy()

        await dividendPool.initialize(usdt.address, frog.address, accounts[0], 1)
        await dividendPool.setMeta(usdt.address, frog.address, accounts[0], 1, true)

        month = time.getFullYear() * 100 + time.getMonth() + 1
    })

    it('SoulmetaDividendPool --> pledgeNft', async function () {
        let account_1_b_1 = await frog.balanceOf(accounts[1])
        let account_2_b_1 = await frog.balanceOf(accounts[2])
        let dividendPool_721_b_1 = await frog.balanceOf(dividendPool.address)

        await frog.connect(signer[1]).setApprovalForAll(dividendPool.address, true)
        await dividendPool.connect(signer[1]).pledgeNft([1, 2])

        let dividendPool_721_b_2 = await frog.balanceOf(dividendPool.address)

        await frog.connect(signer[2]).setApprovalForAll(dividendPool.address, true)
        await dividendPool.connect(signer[2]).pledgeNft([6, 7, 8])

        let account_1_b_2 = await frog.balanceOf(accounts[1])
        let account_2_b_2 = await frog.balanceOf(accounts[2])
        let dividendPool_721_b_3 = await frog.balanceOf(dividendPool.address)

        expect(dividendPool_721_b_1.add(2)).to.equal(dividendPool_721_b_2)
        expect(dividendPool_721_b_2.add(3)).to.equal(dividendPool_721_b_3)
        expect(dividendPool_721_b_1.add(5)).to.equal(dividendPool_721_b_3)

        expect(account_1_b_1.sub(2)).to.equal(account_1_b_2)
        expect(account_2_b_1.sub(3)).to.equal(account_2_b_2)

        expect(await dividendPool.userPledgeNftCount(month, accounts[1])).to.equal(2)
        expect(await dividendPool.userPledgeNftCount(month, accounts[2])).to.equal(3)
        expect(await dividendPool.pledgeNftCount(month)).to.equal(5)
    })

    it('SoulmetadividendPool --> receiveNft', async function () {
        let account_721_b_1 = await frog.balanceOf(accounts[1])
        let dividendPool_721_b_1 = await frog.balanceOf(dividendPool.address)

        await frog.connect(signer[1]).setApprovalForAll(dividendPool.address, true)
        await dividendPool.connect(signer[1]).pledgeNft([1, 2, 3])

        let account_721_b_2 = await frog.balanceOf(accounts[1])
        let dividendPool_721_b_2 = await frog.balanceOf(dividendPool.address)

        await frog.connect(signer[2]).setApprovalForAll(dividendPool.address, true)
        await dividendPool.connect(signer[2]).pledgeNft([7, 8])

        let dividendPool_721_b_3 = await frog.balanceOf(dividendPool.address)

        expect(dividendPool_721_b_1.add(3)).to.equal(dividendPool_721_b_2)
        expect(dividendPool_721_b_2.add(2)).to.equal(dividendPool_721_b_3)
        expect(dividendPool_721_b_1.add(5)).to.equal(dividendPool_721_b_3)

        await dividendPool.connect(signer[1]).receiveNft()

        let account_721_b_3 = await frog.balanceOf(accounts[1])
        let dividendPool_721_b_4 = await frog.balanceOf(dividendPool.address)

        expect(account_721_b_1.sub(3)).to.equal(account_721_b_2)
        expect(dividendPool_721_b_3.sub(3)).to.equal(dividendPool_721_b_4)
        expect(dividendPool_721_b_4).to.equal(2)
        expect(account_721_b_1).to.equal(account_721_b_3)

        expect(await dividendPool.userPledgeNftCount(month, accounts[1])).to.equal(0)
        expect(await dividendPool.userPledgeNftCount(month, accounts[2])).to.equal(2)
        expect(await dividendPool.pledgeNftCount(month)).to.equal(2)
    })

    it('SoulmetadividendPool --> searchUserBonus getUserBonusApi', async function () {
        let account1_count = 5
        let account2_count = 3

        let lastMonth = await dividendPool.lastMonth()
        await usdt.transfer(dividendPool.address, ethers.utils.parseEther('100'))

        if (lastMonth < preMonth(month)) {
            let account1_lastMonth = preMonth(preMonth(lastMonth))
            let account2_lastMonth = preMonth(lastMonth)

            for (let i = account1_lastMonth; i != month; i = nextMonth(i)) {
                await dividendPool.setBonusPool(i, ethers.utils.parseEther('10'))
            }
            
            await dividendPool.setUserData(accounts[1], 0, 0, [1, 3, 9], account1_lastMonth)
            await dividendPool.setUserData(accounts[2], 0, 0, [8, 4], account2_lastMonth)
    
            await dividendPool.setUserDayData(account1_lastMonth, accounts[1], account1_count)
            await dividendPool.setUserDayData(account2_lastMonth, accounts[2], account2_count)
    
            await dividendPool.setTotalDayData(account1_lastMonth, account1_count)
            await dividendPool.setTotalDayData(account2_lastMonth, account1_count+account2_count)

            for (let i = account2_lastMonth + 1; i != preMonth(month); i = nextMonth(i)) {
                await dividendPool.setTotalDayData(i, account1_count+account2_count)
            }

            for (let i = account1_lastMonth; i != preMonth(month); i = nextMonth(i)) {
                await dividendPool.setMoneyRate(i, ethers.utils.parseEther('10').div(await dividendPool.pledgeNftCount(i)))
            }

            let account1_b_1 = await usdt.balanceOf(accounts[1])
            let account2_b_1 = await usdt.balanceOf(accounts[2])
    
            let notGet_account1_1 = await dividendPool.searchUserBonus(accounts[1])
            let notGet_account2_1 = await dividendPool.searchUserBonus(accounts[2])

            await dividendPool.connect(signer[1]).getUserBonus()
            await dividendPool.connect(signer[2]).getUserBonus()

            let account1_b_2 = await usdt.balanceOf(accounts[1])
            let account2_b_2 = await usdt.balanceOf(accounts[2])

            expect(notGet_account1_1).to.equal(account1_b_2.sub(account1_b_1))
            expect(notGet_account2_1).to.equal(account2_b_2.sub(account2_b_1))

        } else if (lastMonth == preMonth(month)) {

            await dividendPool.setBonusPool(preMonth(month), ethers.utils.parseEther('10'))

            await dividendPool.setUserData(accounts[1], 0, 0, [9, 3, 1], preMonth(month))
            await dividendPool.setUserData(accounts[2], 0, 0, [8, 2], preMonth(month))
    
            await dividendPool.setUserDayData(preMonth(month), accounts[1], account1_count)
            await dividendPool.setUserDayData(preMonth(month), accounts[2], account2_count)
    
            await dividendPool.setTotalDayData(preMonth(month), account1_count+account2_count)
    
            let result_account1 = await dividendPool.searchUserBonus(accounts[1])
            let result_account2 = await dividendPool.searchUserBonus(accounts[2])
    
            expect(result_account1.add(result_account2)).to.equal(ethers.utils.parseEther('10').div(2))
            expect(ethers.utils.parseEther('10').div(2).div(account1_count+account2_count).mul(account1_count)).to.equal(result_account1)
            expect(ethers.utils.parseEther('10').div(2).div(account1_count+account2_count).mul(account2_count)).to.equal(result_account2)
        
        } else {
            // lastMonth >= month
            let account1_lastMonth = preMonth(preMonth(lastMonth))
            let account2_lastMonth = preMonth(lastMonth)

            for (let i = account1_lastMonth; i != month; i = nextMonth(i)) {
                await dividendPool.setBonusPool(i, ethers.utils.parseEther('10'))
            }
            
            await dividendPool.setUserData(accounts[1], 0, 0, [3, 9, 1], account1_lastMonth)
            await dividendPool.setUserData(accounts[2], 0, 0, [8, 4], account2_lastMonth)
    
            await dividendPool.setUserDayData(account1_lastMonth, accounts[1], account1_count)
            await dividendPool.setUserDayData(account2_lastMonth, accounts[2], account2_count)
    
            await dividendPool.setTotalDayData(account1_lastMonth, account1_count)
            await dividendPool.setTotalDayData(account2_lastMonth, account1_count+account2_count)

            for (let i = nextMonth(account2_lastMonth); i != month; i = nextMonth(i)) {
                await dividendPool.setTotalDayData(i, account1_count+account2_count)
            }

            for (let i = account1_lastMonth; i != month; i = nextMonth(i)) {
                await dividendPool.setMoneyRate(i, ethers.utils.parseEther('10').div(await dividendPool.pledgeNftCount(i)))
            }

            let account1_b_1 = await usdt.balanceOf(accounts[1])
            let account2_b_1 = await usdt.balanceOf(accounts[2])
    
            let notGet_account1_1 = await dividendPool.searchUserBonus(accounts[1])
            let notGet_account2_1 = await dividendPool.searchUserBonus(accounts[2])

            await dividendPool.connect(signer[1]).getUserBonus()
            await dividendPool.connect(signer[2]).getUserBonus()

            let account1_b_2 = await usdt.balanceOf(accounts[1])
            let account2_b_2 = await usdt.balanceOf(accounts[2])

            expect(notGet_account1_1).to.equal(account1_b_2.sub(account1_b_1))
            expect(notGet_account2_1).to.equal(account2_b_2.sub(account2_b_1))
        }
    })
})