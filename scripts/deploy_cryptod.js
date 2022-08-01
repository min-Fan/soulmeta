const { ethers } = require('hardhat')
const c = require('./common.js')
const { getEnvAddr } = require('../env.js')
const addrs = getEnvAddr()

const main = async () => {
    // const params = [
    //     'CryptoD.Frog',
    //     'CDF',
    //     'https://soulmeta.io/nft-info/cdf/'
    // ]
    // const cryptoD = await c.deployRaw('CryptoD721V2', params)
    // const cryptoD = await ethers.getContractAt('CryptoD721V2', addrs.cryptoD)
    // await cryptoD.setGroupInfo(1, 30)
    // await cryptoD.setGroupInfo(2, 1)
    // await cryptoD.setGroupInfo(3, 1)
    // await cryptoD.setGroupInfo(4, 1)
    // await cryptoD.setGroupInfo(5, 4)
    //
    // await cryptoD.setMinter(addrs.deployer, true)

    let nonce = await ethers.provider.getTransactionCount(addrs.deployer)

    // const oldD = await ethers.getContractAt('CryptoD721', addrs.cryptoDOld)
    // for (let i = 4; i <= 30; i++) {
    //     const owner = await oldD.ownerOf(i)
    //     await cryptoD.mint(owner, 1, { nonce })
    //     nonce++
    // }
    // {
    //     const owner = await oldD.ownerOf(31)
    //     await cryptoD.mint(owner, 2, { nonce })
    //     nonce++
    // }
    // {
    //     const owner = await oldD.ownerOf(32)
    //     await cryptoD.mint(owner, 3, { nonce })
    //     nonce++
    // }
    // {
    //     const owner = await oldD.ownerOf(33)
    //     await cryptoD.mint(owner, 4, { nonce })
    //     nonce++
    // }
    // for (let i = 34; i <= 37; i++) {
    //     const owner = await oldD.ownerOf(i)
    //     await cryptoD.mint(owner, 5, { nonce })
    //     nonce++
    // }

    await c.deploy('SoulmetaDividendPool', [
        addrs.usdt,
        addrs.cryptoD,
        addrs.shareholder,
        1
    ])
    {
        const contract = await c.deploy('SoulmetaTeamPool', [
            addrs.usdt,
            addrs.cryptoD,
            2
        ])
        const tx = await contract.setTokenIds([31])
        await tx.wait()
    }
    {
        const contract = await c.deploy('SoulmetaTeamPool', [
            addrs.usdt,
            addrs.cryptoD,
            3
        ], false)
        const tx = await contract.setTokenIds([32])
        await tx.wait()

    }
    {
        const contract = await c.deploy('SoulmetaTeamPool', [
            addrs.usdt,
            addrs.cryptoD,
            4
        ], false)
        const tx = await contract.setTokenIds([33])
        await tx.wait()

    }
    {
        const contract = await c.deploy('SoulmetaTeamPool', [
            addrs.usdt,
            addrs.cryptoD,
            5
        ], false)
        const tx = await contract.setTokenIds([34, 35, 36, 37])
        await tx.wait()

    }
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
