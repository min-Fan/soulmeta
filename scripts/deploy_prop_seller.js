const { ethers, upgrades, network } = require('hardhat')
const { getEnvAddr } = require('../env.js')
const addrs = getEnvAddr(network.config.chainId)

async function deploy1155 () {

    const params = [
        'Soul Meta Prop',
        'SMP',
        'https://soulmeta.io/nft-info/smp/'
    ]

    const Minter721 = await ethers.getContractFactory('SoulmetaItemBuilder721')
    const minter721 = await Minter721.deploy(...params)
    await minter721.deployed()

    console.log('minter721 deployed to:', minter721.address)


    await run('verify:verify', {
        address: minter721.address,
        constructorArguments: params
        // contract: "contracts/soul/mint_magic_721.sol:SoulmetaMintMagic721"
    })
    console.log('Verify Successfully.')
}

async function deployPropSeller () {

    const params = [
        addrs.usdt,
        addrs.controller,
        addrs.soul,
        addrs.prop1155,
        addrs.soulPair,
        '0x9CfE5BEbC1867424241af395F803b62A3ec2e7CB'
    ]
    const SoulmetaPropSeller = await ethers.getContractFactory('SoulmetaPropSeller')
    const seller = await upgrades.deployProxy(SoulmetaPropSeller, params)
    await seller.deployed()

    console.log('SoulmetaPropSeller deployed to:', seller.address)
    await verify(seller.address)

}

const verify = async (addr = addrs.propSeller) => {
    const CONTRACT = 'SoulmetaPropSeller'
    const impl = await upgrades.erc1967.getImplementationAddress(addr)
    console.log(`${CONTRACT} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${CONTRACT} Impl Successfully.`)
}

const upgrade = async () => {
    const CONTRACT = 'SoulmetaPropSeller'
    const factory = await ethers.getContractFactory(CONTRACT)
    // await upgrades.forceImport("0x58C6701AB45E4AD39e38Cc4fC87fd22B224E2b71", factory)
    const instance = await upgrades.upgradeProxy(addrs.propSeller, factory)
    await instance.deployed()
    console.log(`${CONTRACT} upgraded`)

    await verify()
}


const init = async () => {
    const prop1155 = await ethers.getContractAt('SoulmetaProp1155', addrs.prop1155)
    await prop1155.setMinter(addrs.propSeller, true)
}

const setContract = async () => {
    const seller = await ethers.getContractAt('SoulmetaPropSeller', addrs.propSeller)
    const params = [
        addrs.controller,
        addrs.soul,
        addrs.prop1155,
        addrs.soulPair,
        addrs.storeDist[2],
        addrs.timeBankRate,
        addrs.router
    ]
    // console.log(params)
    await seller.setContracts(...params)
}

const initPropsType = async () => {
    const seller = await ethers.getContractAt('SoulmetaPropSeller', addrs.propSeller)
    const p = [
        // {
        //     tokenId: 1,
        //     times: 100,
        //     price: 35
        // },
        // {
        //     tokenId: 2,
        //     times: 10,
        //     price: 5
        // },
        // {
        //     tokenId: 3,
        //     times: 50,
        //     price: 20
        // },
        {
            tokenId: 4,
            times: 200,
            price: 65
        },
        {
            tokenId: 5,
            times: 500,
            price: 140
        },
        {
            tokenId: 6,
            times: 1000,
            price: 260
        }
    ]
    for (let item of p) {
        await seller.setPropEffect(item.tokenId, item.times, item.price)
    }
}

const main = async () => {
    // await deploy721()

    // await upgrade()
    await setContract()
    // await initPropsType()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
