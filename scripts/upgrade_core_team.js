const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)
let teamNft

async function upgrade () {
    console.log('Deploying TeamNft on the chainId ' + network.config.chainId)
    const TeamNft = await ethers.getContractFactory('SoulmetaTeamNFT')
    // await upgrades.forceImport(addrs.teamNft, TeamNft)
    teamNft = await upgrades.upgradeProxy(addrs.teamNft, TeamNft)
    console.log('TeamNFT upgraded for: ', teamNft.address)
}

async function verify() {
    const teamNftImpl = await upgrades.erc1967.getImplementationAddress(addrs.teamNft)
    console.log('TeamNftImpl deployed to: ', teamNftImpl)
    await run('verify:verify', {
        address: teamNftImpl
    })
    console.log('Verify TeamNftImpl Successfully.')
}


async function main () {
    // await upgrade()
    await verify()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})