const { ethers, upgrades, network, run } = require('hardhat')
const c = require('./common.js')
const { getEnvAddr } = require('../env.js')
const addrs = getEnvAddr()

//先发布receive合约
async function deployReceive () {
    const params = [
        [
            addrs.soul,
            addrs.controller,
            addrs.router
        ]
    ]

    const SoulReceive = await ethers.getContractFactory('SoulmetaTokenReceive')
    let receive = await upgrades.deployProxy(SoulReceive, params)
    await receive.deployed()

    console.log('SoulmetaTokenReceive deployed to:', receive.address)

    const impl = await upgrades.erc1967.getImplementationAddress(receive.address)

    console.log(`SoulmetaTokenReceive Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify SoulmetaTokenReceive Impl Successfully.`)

}

//升级router
async function upgradeRouter () {
    const factory = await ethers.getContractFactory('SoulMetaRouter')
    // await upgrades.forceImport('0x58C6701AB45E4AD39e38Cc4fC87fd22B224E2b71', factory)
    const proxy = await upgrades.upgradeProxy(addrs.router, factory)
    await proxy.deployed()
    console.log('upgraded SoulMetaRouter')
}


async function init () {
    //授权receive操作controller是的代币权限
    const controller = await ethers.getContractAt('SoulmetaController', addrs.controller)
    await controller.setApprovalForAll20(addrs.soul, addrs.soulTokenReceive)
    console.log('controller is ok')

    //修改router使用的合约接口，增加receive
    const router = await ethers.getContractAt('SoulMetaRouter', addrs.router)
    await router.setContracts([
        addrs.usdt,
        addrs.controller,
        addrs.soul,
        addrs.soul721,
        addrs.soul1155,
        addrs.store,
        addrs.sm3d,
        addrs.soulPair,
        addrs.mintMagic721,
        addrs.storeDist[2],
        addrs.soulTokenReceive
    ], true, true)
    console.log('router is ok')

    const receive = await ethers.getContractAt('SoulmetaTokenReceive', addrs.soulTokenReceive)
    await receive.setOperator(addrs.router, true)
    console.log('receive is ok')
}


async function main () {
    // await c.deploy('SoulmetaTokenReceive', [
    //     [
    //         addrs.soul,
    //         addrs.controller,
    //         addrs.router
    //     ]
    // ])
    // await deployReceive()
    // await c.upgrade('SoulMetaRouter', addrs.router)
    // await init

    await c.upgrade('SoulmetaTokenReceive', addrs.soulTokenReceive)
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
