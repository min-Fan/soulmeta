const { ethers, upgrades, network } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)
async function deploy721 () {

    const params = [
        "Soul Meta Mint Magic",
        "SMMM",
        "https://soulmeta.io/nft-info/smmm/"
    ]

    const Minter721 = await ethers.getContractFactory('SoulmetaMintMagic721')
    const minter721 = await Minter721.deploy(...params)
    await minter721.deployed()

    console.log('minter721 deployed to:', minter721.address)


    await run("verify:verify", {
        address: minter721.address,
        constructorArguments: params,
        // contract: "contracts/soul/mint_magic_721.sol:SoulmetaMintMagic721"
    });
    console.log("Verify Successfully.");
}

async function deployProp () {
    const params = [
        'Soul Meta Prop',
        'SMP',
        'https://soulmeta.io/nft-info/smp/',
        'https://soulmeta.io/nft-info/smp/'
    ]

    const SoulmetaProp1155 = await ethers.getContractFactory('SoulmetaProp1155')
    const prop1155 = await SoulmetaProp1155.deploy(...params)
    await prop1155.deployed()

    console.log('SoulmetaProp1155 deployed to:', prop1155.address)


    await run("verify:verify", {
        address: prop1155.address,
        constructorArguments: params,
        contract: "contracts/soul/prop_item_1155.sol:SoulmetaProp1155"
    });
    console.log("Verify Successfully.");
}


async function deployPropSeller () {
    const addrs = getEnvAddr(network.config.chainId)

    const params = [
        addrs.usdt,
        addrs.controller,
        addrs.soul,
        addrs.prop1155,
        addrs.soulPair,
        '0x9CfE5BEbC1867424241af395F803b62A3ec2e7CB',
    ]
    const SoulmetaPropSeller = await ethers.getContractFactory('SoulmetaPropSeller')
    const seller = await upgrades.deployProxy(SoulmetaPropSeller, params)
    await seller.deployed()

    console.log('SoulmetaPropSeller deployed to:', seller.address)


    const CONTRACT = 'SoulmetaPropSeller'
    const addr = seller.address
    const impl = await upgrades.erc1967.getImplementationAddress(addr)
    console.log(`${CONTRACT} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${CONTRACT} Impl Successfully.`)
}
const init = async () => {
    const prop1155 = await ethers.getContractAt('SoulmetaProp1155', addrs.prop1155)
    await prop1155.setApprovalForAll(addrs.propSeller, true)
}

const main = async () => {
    // await deploy721()
    // await deployProp()
    // await deployPropSeller()
    await init()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
