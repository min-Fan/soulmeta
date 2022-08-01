const { ethers } = require('hardhat')
const c = require('./common.js')
const { getEnvAddr } = require('../env.js')
const addrs = getEnvAddr()

const main = async () => {
    // // await c.deployRaw('EvilUSDT', [],false)
    // // token
    // await c.deployRaw('SoulmetaTokenTron', [], false)
    //
    // //  721
    // await c.deployRaw('SoulmetaItemBuilder721Tron', [
    //     'Soul Meta Box Creator',
    //     'SMBC',
    //     'https://soulmeta.io/nft-info/smbc/'
    // ], false)
    //
    // // 1155
    // await c.deployRaw('SoulmetaItem1155Tron', [
    //     'Soul Meta Box',
    //     'SMB',
    //     'https://soulmeta.io/nft-info/smb/',
    //     'https://soulmeta.io/nft-info/smb/'
    // ], false)
    //
    // // team721
    // await c.deploy('SoulmetaTeamNFTTron', [
    //     'Soul Meta Community Leader',
    //     'SMCL',
    //     'https://soulmeta.io/nft-info/smcl/'
    // ], false)
    //
    // // // store
    // await c.deploy('SoulmetaStoreTron', [], false)
    const controllerParams = [
        addrs.usdt,
        addrs.store,
        addrs.soul1155,
        addrs.soul721,
        addrs.soul,
        addrs.teamNft,
        addrs.soulPair,
        addrs.soulBonus,
        addrs.jackpot,
        addrs.shareHolder,
        addrs.fallbacker,
        addrs.soulAirdrop,
        addrs.mintMagic721,
        addrs.propSeller,
        addrs.sm3d,
        addrs.socialWelfare
    ]
    // // controller
    // await c.deploy('SoulmetaControllerTron', [controllerParams], false)
    // await c.upgrade('SoulmetaControllerCube', addrs.controller, false, false)

    const soul = await ethers.getContractAt('SoulmetaToken', addrs.soul)
    const usdt = await ethers.getContractAt('SoulmetaToken', addrs.usdt)
    const smb = await ethers.getContractAt('SoulmetaItem1155', addrs.soul1155)
    const smbc = await ethers.getContractAt('SoulmetaItemBuilder721', addrs.soul721)
    const teamNft = await ethers.getContractAt('SoulmetaTeamNFT', addrs.teamNft)
    const store = await ethers.getContractAt('SoulmetaStore', addrs.store)
    const controller = await ethers.getContractAt('SoulmetaControllerCube', addrs.controller)

    // await store.setApprovalForAll1155(smb.address, controller.address)
    // await store.setOperator(controller.address, true)
    // await smb.setMinter(controller.address, true)
    // await smbc.setMinterBatch(controller.address, true)
    // await teamNft.setMeta(addrs.usdt, controller.address)
    //
    // await soul.transfer(addrs.controller, ethers.utils.parseEther('100000'))
    // // await usdt.transfer(addrs.controller, ethers.utils.parseUnits('10000', 13))
    // await soul.approve(controller.address, ethers.constants.MaxInt256)
    // await usdt.approve(controller.address, ethers.constants.MaxInt256)

    // ethers.constants.AddressZero

    // await controller.setContracts(controllerParams, true, true, true)
    // let res = await store.operators(addrs.controller)
    // res = await store.owner()
    await controller.buildBox(1, 1, 0, 1, '0x000000C387eF4FF4bC691508f81B5371C947aa9a')


}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
