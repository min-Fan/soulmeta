const { ethers, upgrades, network, run } = require('hardhat')
const c = require('./common.js')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)

async function deploy () {
    let random = await c.deploy("WorldCupConsumer", [
        "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f",
        "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",
        848
    ])
    // const factory = await ethers.getContractFactory("WorldCupConsumer")
    // const instance = await upgrades.deployProxy(factory, [
    //     "0x6A2AAd07396B36Fe02a22b33cf443582f682c82f",
    //     "0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314",
    //     848
    // ])
    await instance.deployed()
    let world = await c.deploy("WorldCup", [
        addrs.soul,
        random.address
    ])
    await c.deploy("WorldCupViewer", [
        world.address,
        random.address
    ])
    
}

async function upgrade () {
    const CONTRACT = 'WorldCup'
    const addr = addrs.worldCup
    await c.upgrade(CONTRACT, addr);
}

async function verify () {
    const CONTRACT = 'WorldCup'
    const addr = addrs.worldCup
    const impl = await upgrades.erc1967.getImplementationAddress(addr)
    console.log(`${CONTRACT} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${CONTRACT} Impl Successfully.`)
}

async function init () {
    const worldCup = await ethers.getContractAt('WorldCup', addrs.worldCup)
    await worldCup.setCurrencys(
        "0xc5e0c9993aD915689E4A33A5857E4Cf50e1C6B3D",
        addrs.randomConsumer,
        addrs.worldViewer
    )

}


async function main () {
    await deploy()
    // await upgrade()
    // await verify()
    // await init()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
