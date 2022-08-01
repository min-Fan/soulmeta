const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)

async function deploy () {
    const CONTRACT = 'SoulmetaShareholder'
    console.log(`Deploying ${CONTRACT} on the chainId ${network.config.chainId}`)

    const factory = await ethers.getContractFactory(CONTRACT)
    const params = [
        [addrs.usdt, ...addrs.shareDist]
    ]
    const proxy = await upgrades.deployProxy(factory, params)
    await proxy.deployed()
    console.log(`${CONTRACT} deployed to:`, proxy.address)
}

async function upgrade () {
    const CONTRACT = 'SoulmetaShareholder'
    const addr = addrs.shareholder
    console.log(`Upgrading ${CONTRACT} on the chainId ${network.config.chainId}`)
    const factory = await ethers.getContractFactory(CONTRACT)
    // await upgrades.forceImport(addr, factory)
    const proxy = await upgrades.upgradeProxy(addr, factory)
    await proxy.deployed()
    console.log(`${CONTRACT} upgraded for: `, proxy.address)
    await verify()
    return proxy
}

async function verify () {
    const CONTRACT = 'SoulmetaShareholder'
    const addr = addrs.shareholder
    const impl = await upgrades.erc1967.getImplementationAddress(addr)
    console.log(`${CONTRACT} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${CONTRACT} Impl Successfully.`)
}


async function main () {
    // await deploy()
    // const contract =  await upgrade()
    // await contract.setContracts([addrs.usdt, ...addrs.shareDist])
    await verify()
    console.log("done")
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
