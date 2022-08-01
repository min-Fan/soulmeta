const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)

async function deploy () {
    const CONTRACT = 'SoulmetaDividendPool'
    console.log(`Deploying ${CONTRACT} on the chainId ${network.config.chainId}`)

    const factory = await ethers.getContractFactory(CONTRACT)
    const params = [
        addrs.usdt,
        addrs.fishNft721,
        "0xbBAA0201E3c854Cd48d068de9BC72f3Bb7D26954",
    ]
    const proxy = await upgrades.deployProxy(factory, params)
    await proxy.deployed()
    console.log(`${CONTRACT} deployed to:`, proxy.address)
}

async function upgrade () {
    const CONTRACT = 'SoulmetaDividendPool'
    const addr = addrs.shareDist[0]
    console.log(`Upgrading ${CONTRACT} on the chainId ${network.config.chainId}`)
    const factory = await ethers.getContractFactory(CONTRACT)
    // await upgrades.forceImport(addr, factory)
    const proxy = await upgrades.upgradeProxy(addr, factory)
    await proxy.deployed()
    console.log(`${CONTRACT} upgraded for: `, proxy.address)
    await verify()
}

async function verify () {
    const CONTRACT = 'SoulmetaDividendPool'
    const addr = addrs.shareDist[0]
    const impl = await upgrades.erc1967.getImplementationAddress(addr)
    console.log(`${CONTRACT} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${CONTRACT} Impl Successfully.`)
}

async function init () {
    const bonus = await ethers.getContractAt('SoulmetaDividendPool', addrs.shareDist[0])
    await bonus.setMeta(
        addrs.usdt,
        addrs.fishNft721,
        "0xbBAA0201E3c854Cd48d068de9BC72f3Bb7D26954",
        true
    )

}


async function main () {
    // await deploy()
    await upgrade()
    // await verify()
    // await init()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
