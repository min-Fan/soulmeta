const { ethers } = require('hardhat')
const { getEnvAddr } = require('../../env.js')
const addrs = getEnvAddr('shasta')

const TronWeb = require('tronweb')
// const tronWeb = new TronWeb({
//     fullHost: 'https://api.trongrid.io',
//     headers: { "TRON-PRO-API-KEY": 'xxxxxx' },
//     privateKey: 'xxxxxxx'
// })
const tronWeb = new TronWeb({
    fullHost: 'https://api.shasta.trongrid.io',
    headers: { 'TRON-PRO-API-KEY': '8667ac66-1947-4a9f-ae76-c17a71848796' },
    privateKey: '9524e5483294800784cf65321656853c9b152134cc91309a92ea70e96904ab6c'
})

const getContractAt = async (cName, cAddr) => {
    const abi = require(`../../abi/${cName}Tron.json`)
    return await tronWeb.contract(abi, cAddr)
}

const initProxy = async () => {

    // const teamNft = await getContractAt('SoulmetaTeamNFT', addrs.teamNft)
    // await teamNft.initialize(
    //     'Soul Meta Community Leader',
    //     'SMCL',
    //     'https://soulmeta.io/nft-info/smcl/'
    // ).send()

    // const store = await getContractAt('SoulmetaStore', addrs.store)
    // await store.initialize().send()
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
    const controller = await getContractAt('SoulmetaController', addrs.controller)
    await controller.initialize(
        controllerParams
    ).send()

}

async function deploy_contract () {
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

    const soul = await getContractAt('SoulmetaToken', addrs.soul)
    const usdt = await getContractAt('SoulmetaToken', addrs.usdt)
    const smb = await getContractAt('SoulmetaItem1155', addrs.soul1155)
    const smbc = await getContractAt('SoulmetaItemBuilder721', addrs.soul721)
    const teamNft = await getContractAt('SoulmetaTeamNFT', addrs.teamNft)
    const store = await getContractAt('SoulmetaStore', addrs.store)
    const controller = await getContractAt('SoulmetaController', addrs.controller)

    // await store.setApprovalForAll1155(smb.address, controller.address).send()
    // await store.setOperator(controller.address, true).send()
    // await smb.setMinter(controller.address, true).send()
    // await smbc.setMinterBatch(controller.address, true).send()
    // await teamNft.setMeta(addrs.usdt, controller.address).send()
    //
    // await soul.approve(controller.address, ethers.constants.MaxInt256).send()
    // await usdt.approve(controller.address, ethers.constants.MaxInt256).send()
    // await soul.transfer(addrs.controller, ethers.utils.parseEther('100000')).send()
    // await usdt.transfer(addrs.controller, ethers.utils.parseUnits('100', 6)).send()

    // await controller.setContracts(controllerParams,true,true,true).send()
    await controller.buildBox(1, 1, 0, 1, ethers.constants.AddressZero).send({
        feeLimit: 1_000_000_000,
        callValue: 0,
        userFeePercentage: 100,
        originEnergyLimit: 10_000_000
    })
    // const res = await store.operators(controller.address).call()
    // console.log(tronWeb.address.fromHex(res))
    // const res = await controller.isOpenCast().call()
    // console.log(res)
    // console.log(res.toString())
    // console.log(tronWeb.address.fromHex(res))

    // console.log(controllerParams)
    // await controller.setContracts(controllerParams,true,true,true).send()
    // try {
    //     await controller.initialize(controllerParams).send()
    // } catch (e) {
    //     console.log('EEEEEr', e)
    // }
    console.log('ddd')
}

const main = async () => {
    // await initProxy()
    await deploy_contract()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
