const { ethers, upgrades } = require('hardhat')

async function main () {
    const factory = await ethers.getContractFactory('SoulMetaRouter')
    // await upgrades.forceImport('0x62fC544C734D6717550fD0aF5904b2D95f9658FC', factory)
    const proxy = await upgrades.upgradeProxy('0x62fC544C734D6717550fD0aF5904b2D95f9658FC', factory)
    await proxy.deployed()
    console.log('upgraded')
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
