const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)

let usdt, soul, soul1155, soul721, team, store, controller, router, receive

async function deployUsdt(){
    const Usdt = await ethers.getContractFactory('EvilUSDT')
    usdt = await Usdt.deploy()
    await usdt.deployed()

    console.log('EvilUSDT deployed to:', usdt.address)

    await run("verify:verify", {
        address: usdt.address,
    });
    console.log("Verify EvilUSDT Successfully.");
}


async function deploySoul(){
    const Soul = await ethers.getContractFactory('SoulmetaToken')
    soul = await Soul.deploy()
    await soul.deployed()

    console.log('SoulmetaToken deployed to:', soul.address)

    await run("verify:verify", {
        address: soul.address,
    });
    console.log("Verify SoulmetaToken Successfully.");
}

async function deploy1155(){
    const params = ['Soul Meta Box', 'SMB', 'https://soulmeta.io/nft-info/smb/', 'https://soulmeta.io/nft-info/smb/']
    const Soul1155 = await ethers.getContractFactory('SoulmetaItem1155')
    soul1155 = await Soul1155.deploy(...params)
    await soul1155.deployed()

    console.log('SoulmetaItem1155 deployed to:', soul1155.address)

    await run("verify:verify", {
        address: soul1155.address,
        constructorArguments: params
    });
    console.log("Verify SoulmetaItem1155 Successfully.");
}

async function deploy721(){
    const params = [
        "Soul Meta Box Creator",
        "SMBC",
        "https://soulmeta.io/nft-info/smbc/"
    ]
    const Soul721 = await ethers.getContractFactory('SoulmetaItemBuilder721')
    soul721 = await Soul721.deploy(...params)
    await soul721.deployed()

    console.log('SoulmetaItemBuilder721 deployed to:', soul721.address)

    await run("verify:verify", {
        address: soul721.address,
        constructorArguments: params
    });
    console.log("Verify Successfully.");
}

async function deployTeam(){
    const params = ['Soul Meta Community Leader', 'SMCL', 'https://soulmeta.io/nft-info/smcl/']
    const Team = await ethers.getContractFactory('SoulmetaTeamNFT')
    team = await upgrades.deployProxy(Team, params)
    await team.deployed()
    console.log('SoulmetaTeamNFT deployed to: ', team.address)

    const impl = await upgrades.erc1967.getImplementationAddress(team.address)

    console.log(`SoulmetaTeamNFT Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify SoulmetaTeamNFT Impl Successfully.`)
}

async function deployStore(){
    const Store = await ethers.getContractFactory('SoulmetaStore')
    store = await upgrades.deployProxy(Store)
    await store.deployed()

    console.log('SoulmetaStore deployed to:', store.address)

    const impl = await upgrades.erc1967.getImplementationAddress(store.address)

    console.log(`SoulmetaStore Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify SoulmetaStore Impl Successfully.`)
}

async function deployController(){
    const params = [
        [
            addrs.usdt,
            addrs.teamNft,
            ...addrs.storeDist,
            addrs.storeDist[2],
            addrs.storeDist[2]
        ]
    ]

    const SoulController = await ethers.getContractFactory('SoulmetaControllerCube')
    controller = await upgrades.deployProxy(SoulController, params)
    await controller.deployed()

    console.log('SoulmetaControllerCube deployed to:', controller.address)

    const impl = await upgrades.erc1967.getImplementationAddress(controller.address)

    console.log(`SoulmetaControllerCube Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify SoulmetaControllerCube Impl Successfully.`)
}

async function deployReceive(){
    const params = [
        [
            addrs.soul,
            addrs.controller,
            addrs.router
        ]
    ]

    const SoulReceive = await ethers.getContractFactory('SoulmetaTokenReceiveCube')
    receive = await upgrades.deployProxy(SoulReceive, params)
    await receive.deployed()

    console.log('SoulmetaTokenReceiveCube deployed to:', receive.address)

    const impl = await upgrades.erc1967.getImplementationAddress(receive.address)

    console.log(`SoulmetaTokenReceiveCube Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify SoulmetaTokenReceiveCube Impl Successfully.`)

}

async function deployRouter(){
    const params = [
        [
            addrs.usdt,
            addrs.controller,
            addrs.soul,
            addrs.soul721,
            addrs.soul1155,
            addrs.store,
            addrs.soulReceive,
            addrs.sm3d,
            addrs.soulPair,
            addrs.mintMagic721,
            addrs.storeDist[2]
        ]
    ]

    const SoulRouter = await ethers.getContractFactory('SoulMetaRouterCube')
    router = await upgrades.deployProxy(SoulRouter, params)
    await router.deployed()

    console.log('SoulMetaRouterCube deployed to:', router.address)

    const impl = await upgrades.erc1967.getImplementationAddress(router.address)

    console.log(`SoulMetaRouterCube Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify SoulMetaRouterCube Impl Successfully.`)
}





async function init(){
    const usdt = await ethers.getContractAt('EvilUSDT', addrs.usdt)
    await usdt.approve(addrs.controller, ethers.constants.MaxUint256)
    console.log("usdt ok!")

    const soul = await ethers.getContractAt('SoulmetaToken', addrs.soul)
    await soul.approve(addrs.controller, ethers.constants.MaxUint256)
    await soul.approve(addrs.router, ethers.constants.MaxUint256)
    await soul.transfer(addrs.router, ethers.utils.parseEther('10000000'))
    console.log("soul ok!")

    const soul1155 = await ethers.getContractAt('SoulmetaItem1155', addrs.soul1155)
    await soul1155.setMinter(addrs.router, true)
    console.log("1155 ok!")

    const soul721 = await ethers.getContractAt('SoulmetaItemBuilder721', addrs.soul721)
    await soul721.setMinterBatch(addrs.router, true)
    console.log("721 ok!")

    const store = await ethers.getContractAt('SoulmetaStore', addrs.store)
    await store.setApprovalForAll1155(addrs.soul1155, addrs.router)
    await store.setOperator(addrs.router, true)
    console.log("store ok!")

    const team = await ethers.getContractAt('SoulmetaTeamNFT', addrs.teamNft)
    await team.setMeta(addrs.usdt, addrs.controller)
    console.log("team ok!")

    const controller = await ethers.getContractAt('SoulmetaControllerCube', addrs.controller)
    await controller.setOperator(addrs.router, true)
    await controller.setApprovalForAll20(addrs.soul, addrs.router)
    await controller.setApprovalForAll20(addrs.soul, addrs.soulReceive)

    await controller.setContracts([
        addrs.usdt,
        addrs.teamNft,
        ...addrs.storeDist,
        addrs.storeDist[2],
        addrs.storeDist[2]
    ], true, true)

    console.log("controller ok!")

    const soulReceive = await ethers.getContractAt('SoulmetaTokenReceiveCube', addrs.soulReceive)
    await soulReceive.setOperator(addrs.router, true)
    await soulReceive.setContracts([addrs.soul, addrs.controller, addrs.router],true)
    console.log("soulReceive ok!")

    const router = await ethers.getContractAt('SoulMetaRouterCube', addrs.router)

    await router.setContracts([
        addrs.usdt,
        addrs.controller,
        addrs.soul,
        addrs.soul721,
        addrs.soul1155,
        addrs.store,
        addrs.soulReceive,
        addrs.sm3d,
        addrs.soulPair,
        addrs.mintMagic721,
        addrs.storeDist[2]
    ], true, true)
    console.log("router ok!")

}


async function main () {
    // await deployUsdt()
    // await deploySoul()
    // await deploy1155()
    // await deploy721()
    // await deployTeam()
    // await deployStore()
    // await deployController()
    // await deployReceive()
    // await deployRouter()
    await init()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
