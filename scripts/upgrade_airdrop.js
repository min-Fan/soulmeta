const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)

async function upgrade () {
    const CONTRACT = 'SoulSetKnight'
    const addr = addrs.soulAirdrop
    console.log(`Deploying ${CONTRACT} on the chainId ${network.config.chainId}`)
    const factory = await ethers.getContractFactory(CONTRACT)
    // await upgrades.forceImport(addr, factory)
    const proxy = await upgrades.upgradeProxy(addr, factory)
    await proxy.deployed()
    console.log(`${CONTRACT} upgraded for: `, proxy.address)
}

async function verify() {
    const CONTRACT = 'SoulSetKnight'
    const addr = addrs.soulAirdrop
    const impl = await upgrades.erc1967.getImplementationAddress(addr)
    console.log(`${CONTRACT} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${CONTRACT} Impl Successfully.`)
}


async function main () {
    await upgrade()
    await verify()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})