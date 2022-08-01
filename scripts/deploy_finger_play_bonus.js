const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)

async function deploy () {
    const CONTRACT = 'SoulmetaFingerPlayBonus'
    console.log(`Deploying ${CONTRACT} on the chainId ${network.config.chainId}`)

    const factory = await ethers.getContractFactory(CONTRACT)
    const params = [
        addrs.soul,
        addrs.fingerPlay,
        addrs.fishNft721
    ]
    const proxy = await upgrades.deployProxy(factory, params)
    await proxy.deployed()
    console.log(`${CONTRACT} deployed to:`, proxy.address)
}

async function upgrade () {
    const CONTRACT = 'SoulmetaFingerPlayBonus'
    const addr = addrs.fingerPlayBonus
    console.log(`Upgrading ${CONTRACT} on the chainId ${network.config.chainId}`)
    const factory = await ethers.getContractFactory(CONTRACT)
    // await upgrades.forceImport(addr, factory)
    const proxy = await upgrades.upgradeProxy(addr, factory)
    await proxy.deployed()
    console.log(`${CONTRACT} upgraded for: `, proxy.address)
    await verify()
}

async function verify () {
    const CONTRACT = 'SoulmetaFingerPlayBonus'
    const addr = addrs.fingerPlayBonus
    const impl = await upgrades.erc1967.getImplementationAddress(addr)
    console.log(`${CONTRACT} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${CONTRACT} Impl Successfully.`)
}

async function init () {
    const bonus = await ethers.getContractAt('SoulmetaFingerPlayBonus', addrs.fingerPlayBonus)
    await bonus.setMeta(
        addrs.soul,
        addrs.fingerPlay,
        addrs.fishNft721,
        true
    )

}


async function main () {
    // await deploy()
    // await upgrade()
    // await verify()
    await init()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
