const { ethers, upgrades, network } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)

async function deploy3dNft () {
    const params = [
        addrs.soul
    ]
    const S3dNFt = await ethers.getContractFactory('Soulmeta3dnft')
    const s3dNft = await S3dNFt.deploy(...params)
    await s3dNft.deployed()

    console.log('Soulmeta3dnft deployed to:', s3dNft.address)


    await run("verify:verify", {
        address: s3dNft.address,
        constructorArguments: params,
        contract: "contracts/soul/soul_3dnft.sol:Soulmeta3dnft"
    });
    console.log("SoulmetaTimeBank721 Verify Successfully.");
}

async function deploySocialWelfare(){
    const addrs = getEnvAddr(network.config.chainId)

    const params = [
        addrs.usdt,
        addrs.sm3d
    ]
    //
    const SoulMetaSocialWelfare = await ethers.getContractFactory('SoulMetaSocialWelfare')
    const socialWelfare = await upgrades.upgradeProxy(addrs.socialWelfare, SoulMetaSocialWelfare)
    await socialWelfare.deployed()

    console.log('SoulMetaSocialWelfare deployed to:', addrs.socialWelfare)

    const CONTRACT = 'SoulMetaSocialWelfare'
    const addr = addrs.socialWelfare
    const impl = await upgrades.erc1967.getImplementationAddress(addr)
    console.log(`${CONTRACT} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${CONTRACT} Impl Successfully.`)
}




const init = async() => {
    const setSoulToken = await ethers.getContractAt('SoulmetaToken', addrs.soul)
    await setSoulToken.approve(addrs.socialWelfare, ethers.utils.parseEther('1000000000'))
}

async function main () {
    // await deploy3dNft()
    await deploySocialWelfare()
    // await init()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
