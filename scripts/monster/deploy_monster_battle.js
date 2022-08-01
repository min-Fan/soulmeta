const { ethers, upgrades, network, run } = require('hardhat')
const c = require('../common.js')
const { getEnvAddr } = require('../../env.js')
const addrs = getEnvAddr()

async function deploy () {
    const CONTRACT = 'MonsterBattle'
    console.log(`Deploying ${CONTRACT} on the chainId ${network.config.chainId}`)

    let MonsterBattle = await ethers.getContractFactory(CONTRACT)
    battle = await upgrades.deployProxy(MonsterBattle, [addrs.monsterNFT, "0xc5e0c9993aD915689E4A33A5857E4Cf50e1C6B3D"])
    await battle.deployed()
    console.log("battle upd deployed to: ==>", battle.address)
}

async function upgrade () {
    await c.upgrade("MonsterBattle", addrs.monsterBattle)
}

async function verify () {
    const CONTRACT = 'MonsterBattle'
    const addr = addrs.monsterBattle
    const impl = await upgrades.erc1967.getImplementationAddress(addr)
    console.log(`${CONTRACT} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${CONTRACT} Impl Successfully.`)
}

async function init () {
    const nft = await ethers.getContractAt('MonsterNft', addrs.monsterNFT)
    await nft.setMinterBatch(
        addrs.monsterBattle,
        true
    )
}


async function main () {
    // await deploy()
    // await upgrade()
    await verify()
    // await init()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
