const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')

async function main () {
    const addrs = getEnvAddr(network.config.chainId)
    console.log('Deploying V2 on the chainId ' + network.config.chainId)

    const params = [
        'Soul pair LP',
        'LP'
    ]
    const Pair = await ethers.getContractFactory('MockPair')
    const pair = await upgrades.deployProxy(Pair, params)
    await pair.deployed()
    console.log('MockPair deployed to: ', pair.address)

    const impl = await upgrades.erc1967.getImplementationAddress(pair.address)
    console.log('MockPairImpl deployed to: ', impl)
    await run('verify:verify', {
        address: impl
    })
    console.log('Verify MockPair Successfully.')

}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
