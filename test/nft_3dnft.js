const { expect } = require('chai')
const { ethers } = require('hardhat')
const { getEnvAddr } = require('../env.js')
const testAddrs = getEnvAddr(97)

describe('Testing Nft 3dnft', function () {
    let signer, accounts
    let sm3d, soul

    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Soul = await ethers.getContractFactory('SoulmetaToken')
        soul = await Soul.deploy()

        let Sm3d = await ethers.getContractFactory('Soulmeta3dnft')
        sm3d = await Sm3d.deploy(soul.address)

    })

    it('mint 1 nft', async function () {

        let b0_1 = await soul.balanceOf(accounts[0])

        await soul.approve(sm3d.address, ethers.constants.MaxUint256)
        await sm3d.playerMint(564612)

        let b0_2 = await soul.balanceOf(accounts[0])
        expect(b0_1.sub(ethers.utils.parseEther('100'))).to.equal(b0_2)

        // let bx = await soul.balanceOf(ethers.constants.AddressZero)
        // expect(bx).to.equal(ethers.utils.parseEther('95'))

        let b = await soul.balanceOf(sm3d.address)
        expect(b).to.equal(ethers.utils.parseEther('5'))
    })

    it('mint 105 nft', async function () {

        let b0_1 = await soul.balanceOf(accounts[0])

        await soul.approve(sm3d.address, ethers.constants.MaxUint256)
        await sm3d.playerMint(564612)

        let b0_2 = await soul.balanceOf(accounts[0])
        expect(b0_1.sub(ethers.utils.parseEther('100'))).to.equal(b0_2)

        // let bx = await soul.balanceOf(ethers.constants.AddressZero)
        // expect(bx).to.equal(ethers.utils.parseEther('95'))

        let b = await soul.balanceOf(sm3d.address)
        expect(b).to.equal(ethers.utils.parseEther('5'))
    })


})
