const { ethers, upgrades, network } = require('hardhat')
const { getEnvAddr } = require('../env.js')

async function main () {
    const addrs = getEnvAddr(network.config.chainId)
    // console.log(addrs)

    const params = [
        addrs.usdt,
        addrs.controller,
        addrs.soul,
        addrs.prop1155,
        addrs.soulPair,
        addrs.soulBonus
    ]
    const Prop = await ethers.getContractFactory('SoulmetaPropSeller')
    const prop = await upgrades.deployProxy(Prop, params)
    await prop.deployed()

    console.log('PropCore deployed to:', prop.address)
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
