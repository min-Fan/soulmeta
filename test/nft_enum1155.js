const { expect } = require('chai')
const { ethers } = require('hardhat')
const { getEnvAddr } = require('../env.js')
const testAddrs = getEnvAddr(97)

describe('Testing enum1155', function () {
    let signer, accounts
    let smb

    beforeEach(async () => {

        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Smb = await ethers.getContractFactory('SoulmetaItem1155')
        smb = await Smb.deploy('Soul Meta Box', 'SMB', 'https://soulmeta.io/nft-info/smb/', 'https://soulmeta.io/nft-info/smb/')

        await smb.setMinter(accounts[0], true)

    })
    it('check enumerable', async () => {
        await smb.mintBatch(accounts[1], [2, 6, 5, 9, 8, 3], [1, 1, 1, 1, 1, 1])
        await smb.mint(accounts[1], 2, 60)
        await smb.mint(accounts[1], 6, 60)
        await smb.mint(accounts[2], 6, 60)
        await smb.mintBatch(accounts[2], [2, 8, 3], [2, 1, 5])
        await smb.connect(signer[1]).safeTransferFrom(accounts[1], accounts[2], 2, 61, '0x00')
        await smb.connect(signer[1]).safeTransferFrom(accounts[1], accounts[2], 8, 1, '0x00')

        const account = accounts[1]
        const acc = new Array(100).fill(account)
        let ids = []
        for (let i = 0; i < 100; i++) {
            ids.push(i + 1)
        }
        const balances_right = await smb.balanceOfBatch(acc, ids)
        ids = ids.filter((id, i) => {
            return balances_right[i].gt(0)
        })
        console.log(ids)

        const b = await smb.itemBalanceOf(account)
        let ids2 = []
        for (let i = 0; i < b; i++) {
            const tokenId = await smb.tokenOfOwnerByIndex(account, i)
            ids2.push(tokenId)
        }
        ids2 = ids2.sort((a, b) => a.sub(b).toNumber())
        console.log(ids2)
        ids2.forEach((id, i) => {
            expect(id).to.equal(ids[i])
        })

        const ids3 = await smb.getTokenIdList(account)
        console.log(ids3)

    })
    it('test viewer', async () => {
        let viewer = await ethers.getContractFactory('SmbViewer')
        viewer = await viewer.deploy(smb.address)

        let  balances = await viewer.getBalances(accounts[1], 3000)
        console.log(balances)
        // balances = balances.filter(item => item.gt(0))
        // console.log(balances)
    })


})