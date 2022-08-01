const { ethers, upgrades, network, run } = require('hardhat')
const c = require('../common.js')
const { getEnvAddr } = require('../../env.js')
const addrs = getEnvAddr()

async function deploy () {
    const CONTRACT = 'MonsterNft'

    const params = [
        "Monster NFT", 
        "MONSTER"
    ]
    const nft = await c.deployRaw(CONTRACT, params)
    console.log(`${CONTRACT} deployed to:`, nft.address)
}

async function verify () {
    const CONTRACT = 'MonsterNft'
    const addr = addrs.monsterNFT
    const params = [
        "Monster NFT", 
        "MONSTER"
    ]
    await c.verifyRaw(CONTRACT, addr, params)
}

async function init () {
    
}


async function main () {
    await deploy()
    // await verify()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
