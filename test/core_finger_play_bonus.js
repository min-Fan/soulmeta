const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')
const { syncBuiltinESMExports } = require('module')
const { getEnvAddr } = require('../env.js')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('Testing Core SoulmetaFingerPlayBonus', function () {
    let soul, smbc, fingerPlayBonus
    let signer, accounts
    let block, toDay

    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Soul = await ethers.getContractFactory('SoulmetaToken')
        soul = await Soul.deploy()

        let Smbc = await ethers.getContractFactory('SoulmetaItemBuilder721')
        smbc = await Smbc.deploy('Soul Meta Box Creator', 'SMBC', 'https://soulmeta.io/nft-info/smbc/')

        await smbc.setSuperMinter(accounts[0])

        await smbc.mintMulti(accounts[1], [1, 3, 5, 7, 9])
        await smbc.mintMulti(accounts[2], [2, 4, 6, 8])

        let FingerPlayBonus = await ethers.getContractFactory('SoulmetaFingerPlayBonus')
        fingerPlayBonus = await FingerPlayBonus.deploy()

        await fingerPlayBonus.initialize(soul.address, accounts[5], smbc.address)
        await fingerPlayBonus.setMeta(soul.address, accounts[5], smbc.address, true)

        block = await ethers.provider.getBlock()
        toDay = parseInt(block.timestamp / 86400)
    })

    it('SoulmetaFingerPlayBonus --> pledgeNft', async function () {
        let account_1_b_1 = await smbc.balanceOf(accounts[1])
        let account_2_b_1 = await smbc.balanceOf(accounts[2])
        let fingerPlayBonus_721_b_1 = await smbc.balanceOf(fingerPlayBonus.address)

        await smbc.connect(signer[1]).setApprovalForAll(fingerPlayBonus.address, true)
        await fingerPlayBonus.connect(signer[1]).pledgeNft([9, 7])

        let fingerPlayBonus_721_b_2 = await smbc.balanceOf(fingerPlayBonus.address)

        await smbc.connect(signer[2]).setApprovalForAll(fingerPlayBonus.address, true)
        await fingerPlayBonus.connect(signer[2]).pledgeNft([2, 6, 8])

        let account_1_b_2 = await smbc.balanceOf(accounts[1])
        let account_2_b_2 = await smbc.balanceOf(accounts[2])
        let fingerPlayBonus_721_b_3 = await smbc.balanceOf(fingerPlayBonus.address)

        expect(fingerPlayBonus_721_b_1.add(2)).to.equal(fingerPlayBonus_721_b_2)
        expect(fingerPlayBonus_721_b_2.add(3)).to.equal(fingerPlayBonus_721_b_3)
        expect(fingerPlayBonus_721_b_1.add(5)).to.equal(fingerPlayBonus_721_b_3)

        expect(account_1_b_1.sub(2)).to.equal(account_1_b_2)
        expect(account_2_b_1.sub(3)).to.equal(account_2_b_2)

        // console.log(await fingerPlayBonus.userPledge(toDay, accounts[1])) // 2
        // console.log(await fingerPlayBonus.totalPledge(toDay)) // 5
    })

    it('SoulmetaFingerPlayBonus --> receiveNft', async function () {
        let account_721_b_1 = await smbc.balanceOf(accounts[1])
        let fingerPlayBonus_721_b_1 = await smbc.balanceOf(fingerPlayBonus.address)

        await smbc.connect(signer[1]).setApprovalForAll(fingerPlayBonus.address, true)
        await fingerPlayBonus.connect(signer[1]).pledgeNft([3, 7, 5])

        let account_721_b_2 = await smbc.balanceOf(accounts[1])
        let fingerPlayBonus_721_b_2 = await smbc.balanceOf(fingerPlayBonus.address)

        await smbc.connect(signer[2]).setApprovalForAll(fingerPlayBonus.address, true)
        await fingerPlayBonus.connect(signer[2]).pledgeNft([2, 8])

        let fingerPlayBonus_721_b_3 = await smbc.balanceOf(fingerPlayBonus.address)

        expect(fingerPlayBonus_721_b_1.add(3)).to.equal(fingerPlayBonus_721_b_2)
        expect(fingerPlayBonus_721_b_2.add(2)).to.equal(fingerPlayBonus_721_b_3)
        expect(fingerPlayBonus_721_b_1.add(5)).to.equal(fingerPlayBonus_721_b_3)

        await fingerPlayBonus.connect(signer[1]).receiveNft()

        let account_721_b_3 = await smbc.balanceOf(accounts[1])
        let fingerPlayBonus_721_b_4 = await smbc.balanceOf(fingerPlayBonus.address)

        expect(account_721_b_1.sub(3)).to.equal(account_721_b_2)
        expect(fingerPlayBonus_721_b_3.sub(3)).to.equal(fingerPlayBonus_721_b_4)
        expect(fingerPlayBonus_721_b_4).to.equal(2)
        expect(account_721_b_1).to.equal(account_721_b_3)
    })

    it('SoulmetaFingerPlayBonus --> searchUserBonus getUserBonusApi', async function () {
        let account1_count = 5
        let account2_count = 3

        let lastSettleDay = await fingerPlayBonus.lastSettleDay()

        if (lastSettleDay < toDay-1) {
            let account1_lastSettleDay = lastSettleDay - 2
            let account2_lastSettleDay = lastSettleDay - 1

            for (let i = account1_lastSettleDay; i < toDay; i++) {
                await fingerPlayBonus.setBonusPool(i, ethers.utils.parseEther('10'))
            }
            
            await fingerPlayBonus.setUserData(accounts[1], account1_count, 0, 0, account1_lastSettleDay)
            await fingerPlayBonus.setUserData(accounts[2], account2_count, 0, 0, account2_lastSettleDay)
    
            await fingerPlayBonus.setUserDayData(account1_lastSettleDay, accounts[1], account1_count)
            await fingerPlayBonus.setUserDayData(account2_lastSettleDay, accounts[2], account2_count)
    
            await fingerPlayBonus.setTotalDayData(account1_lastSettleDay, account1_count)
            await fingerPlayBonus.setTotalDayData(account2_lastSettleDay, account1_count+account2_count)

            for (let i = account2_lastSettleDay + 1; i < toDay-1; i++) {
                await fingerPlayBonus.setTotalDayData(i, account1_count+account2_count)
            }

            for (let i = account1_lastSettleDay; i < toDay-1; i++) {
                await fingerPlayBonus.setMoneyRate(i, ethers.utils.parseEther('10').div(await fingerPlayBonus.totalPledge(i)))
            }
    
            let notGet_account1_1 = await fingerPlayBonus.searchUserBonus(accounts[1])
            let notGet_account2_1 = await fingerPlayBonus.searchUserBonus(accounts[2])

            let notGet_account1_2 = ethers.utils.parseEther('0')
            for (let i = account1_lastSettleDay; i < toDay-1; i++) {
                let rate = await fingerPlayBonus.moneyRate(i)
                let get = rate.mul(account1_count)
                notGet_account1_2 = notGet_account1_2.add(get)
            }

            notGet_account1_2 = notGet_account1_2.add((await fingerPlayBonus.bonusPool(toDay-1)).div(account1_count+account2_count).mul(account1_count))

            let notGet_account2_2 = ethers.utils.parseEther('0')
            for (let i = account2_lastSettleDay; i < toDay-1; i++) {
                let rate = await fingerPlayBonus.moneyRate(i)
                let get = rate.mul(account2_count)
                notGet_account2_2 = notGet_account2_2.add(get)
            }

            notGet_account2_2 = notGet_account2_2.add((await fingerPlayBonus.bonusPool(toDay-1)).div(account1_count+account2_count).mul(account2_count))

            expect(notGet_account1_1).to.equal(notGet_account1_2)
            expect(notGet_account2_1).to.equal(notGet_account2_2)

        } else if (lastSettleDay == toDay-1) {

            await fingerPlayBonus.setBonusPool(toDay-1, ethers.utils.parseEther('10'))

            await fingerPlayBonus.setUserData(accounts[1], account1_count, 0, 0, toDay-1)
            await fingerPlayBonus.setUserData(accounts[2], account2_count, 0, 0, toDay-1)
    
            await fingerPlayBonus.setUserDayData(toDay-1, accounts[1], account1_count)
            await fingerPlayBonus.setUserDayData(toDay-1, accounts[2], account2_count)
    
            await fingerPlayBonus.setTotalDayData(toDay-1, account1_count+account2_count)
    
            let result_account1 = await fingerPlayBonus.searchUserBonus(accounts[1])
            let result_account2 = await fingerPlayBonus.searchUserBonus(accounts[2])
    
            expect(result_account1.add(result_account2)).to.equal(ethers.utils.parseEther('10'))
            expect(ethers.utils.parseEther('10').div(account1_count+account2_count).mul(account1_count)).to.equal(result_account1)
            expect(ethers.utils.parseEther('10').div(account1_count+account2_count).mul(account2_count)).to.equal(result_account2)
        
        } else {
            // lastSettleDay >= toDay
            let account1_lastSettleDay = lastSettleDay - 2
            let account2_lastSettleDay = lastSettleDay - 1

            for (let i = account1_lastSettleDay; i < toDay; i++) {
                await fingerPlayBonus.setBonusPool(i, ethers.utils.parseEther('10'))
            }
            
            await fingerPlayBonus.setUserData(accounts[1], account1_count, 0, 0, account1_lastSettleDay)
            await fingerPlayBonus.setUserData(accounts[2], account2_count, 0, 0, account2_lastSettleDay)
    
            await fingerPlayBonus.setUserDayData(account1_lastSettleDay, accounts[1], account1_count)
            await fingerPlayBonus.setUserDayData(account2_lastSettleDay, accounts[2], account2_count)
    
            await fingerPlayBonus.setTotalDayData(account1_lastSettleDay, account1_count)
            await fingerPlayBonus.setTotalDayData(account2_lastSettleDay, account1_count+account2_count)

            for (let i = account2_lastSettleDay + 1; i < toDay; i++) {
                await fingerPlayBonus.setTotalDayData(i, account1_count+account2_count)
            }

            for (let i = account1_lastSettleDay; i < toDay; i++) {
                await fingerPlayBonus.setMoneyRate(i, ethers.utils.parseEther('10').div(await fingerPlayBonus.totalPledge(i)))
            }
    
            let notGet_account1_1 = await fingerPlayBonus.searchUserBonus(accounts[1])
            let notGet_account2_1 = await fingerPlayBonus.searchUserBonus(accounts[2])

            let notGet_account1_2 = ethers.utils.parseEther('0')
            for (let i = account1_lastSettleDay; i < toDay-1; i++) {
                let rate = await fingerPlayBonus.moneyRate(i)
                let get = rate.mul(account1_count)
                notGet_account1_2 = notGet_account1_2.add(get)
            }

            notGet_account1_2 = notGet_account1_2.add((await fingerPlayBonus.bonusPool(toDay-1)).div(account1_count+account2_count).mul(account1_count))

            let notGet_account2_2 = ethers.utils.parseEther('0')
            for (let i = account2_lastSettleDay; i < toDay-1; i++) {
                let rate = await fingerPlayBonus.moneyRate(i)
                let get = rate.mul(account2_count)
                notGet_account2_2 = notGet_account2_2.add(get)
            }

            notGet_account2_2 = notGet_account2_2.add((await fingerPlayBonus.bonusPool(toDay-1)).div(account1_count+account2_count).mul(account2_count))

            expect(notGet_account1_1).to.equal(notGet_account1_2)
            expect(notGet_account2_1).to.equal(notGet_account2_2)
        }
    })
})