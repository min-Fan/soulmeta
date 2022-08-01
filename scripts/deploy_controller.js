const { ethers, upgrades, network, run } = require('hardhat')
const c = require('./common.js')
const { getEnvAddr } = require('../env.js')
const addrs = getEnvAddr()

async function deployController () {
    const params = [
        [
            addrs.usdt,
            addrs.store,
            addrs.soul1155,
            addrs.soul721,
            addrs.soul,
            addrs.teamNft,
            addrs.soulPair,
            addrs.soulBonus,
            ...addrs.storeDist,
            addrs.soulAirdrop,
            addrs.mintMagic721,
            addrs.propSeller,
            addrs.sm3d,
            addrs.socialWelfare
        ]
    ]

    const SoulController = await ethers.getContractFactory('SoulmetaController')
    const controller = await upgrades.deployProxy(SoulController, params)
    await controller.deployed()

    console.log('SoulmetaController deployed to:', controller.address)

    const impl = await upgrades.erc1967.getImplementationAddress(controller.address)

    console.log(`SoulmetaController Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify SoulmetaController Impl Successfully.`)
}

async function upgradeController () {
    const factory = await ethers.getContractFactory('SoulmetaController')
    // await upgrades.forceImport('0x58C6701AB45E4AD39e38Cc4fC87fd22B224E2b71', factory)
    const proxy = await upgrades.upgradeProxy('0x66ba18034acA4EEBa0aB6166c19aBfB692Ba10C9', factory)
    await proxy.deployed()
    console.log('upgraded soulController')
}

async function deployRouter () {
    const params = [
        [
            addrs.usdt,
            addrs.controller,
            addrs.soul,
            addrs.soul721,
            addrs.soul1155,
            addrs.store,
            addrs.sm3d,
            addrs.soulPair,
            addrs.mintMagic721,
            addrs.storeDist[2]
        ]
    ]

    const SoulRouter = await ethers.getContractFactory('SoulMetaRouter')
    const router = await upgrades.deployProxy(SoulRouter, params)
    await router.deployed()

    console.log('SoulMetaRouter deployed to:', router.address)

    const impl = await upgrades.erc1967.getImplementationAddress(router.address)

    console.log(`SoulMetaRouter Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify SoulMetaRouter Impl Successfully.`)
}


async function upgradeSeller () {
    const factory = await ethers.getContractFactory('SoulmetaPropSeller')
    // await upgrades.forceImport('0x58C6701AB45E4AD39e38Cc4fC87fd22B224E2b71', factory)
    const proxy = await upgrades.upgradeProxy('0x58C6701AB45E4AD39e38Cc4fC87fd22B224E2b71', factory)
    await proxy.deployed()
    console.log('upgraded SoulmetaPropSeller')
}

async function init () {
    // const smb = await ethers.getContractAt('SoulmetaItem1155', addrs.soul1155)
    // await smb.setMinter(addrs.router, true)
    // console.log(9)
    //
    //
    // const smbc = await ethers.getContractAt('SoulmetaItemBuilder721', addrs.soul721)
    // await smbc.setMinterBatch(addrs.router, true)
    // console.log(6)
    //
    // const store = await ethers.getContractAt('SoulmetaStore', addrs.store)
    // await store.setApprovalForAll1155(smb.address, addrs.router)
    // await store.setOperator(addrs.router, true)
    //
    // console.log(5)
    // const soul = await ethers.getContractAt('SoulmetaToken', addrs.soul)
    // await soul.approve(addrs.router, ethers.constants.MaxUint256)

    const controller = await ethers.getContractAt('SoulmetaController', addrs.controller)
    // await controller.setOperator(addrs.router, true)
    await controller.setApprovalForAll20(addrs.soul, addrs.router)
    console.log(1)

    const router = await ethers.getContractAt('SoulMetaRouter', addrs.router)
    await router.setOperator(addrs.propSeller, true)
    console.log(999)

    const seller = await ethers.getContractAt('SoulmetaPropSeller', addrs.propSeller)
    await seller.setContracts(addrs.controller, addrs.soul, addrs.prop1155, addrs.soulPair, addrs.storeDist[2], addrs.timeBank, addrs.router)
}


async function main () {
    // const controller = await ethers.getContractAt('SoulmetaController', addrs.controller)
    // await controller
    // await deployController()
    // await upgradeController()
    // await deployRouter()
    // await upgradeSeller()
    // await init()

    // await c.upgrade('SoulmetaController', addrs.controller)
    await c.upgrade('SoulMetaRouter', addrs.router)
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
