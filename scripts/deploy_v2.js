const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)
let store, controller, oldData

const controllerContracts = [
    addrs.usdt,
    addrs.store,
    addrs.soul1155,
    addrs.soul721,
    addrs.soul,
    addrs.teamNft,
    addrs.soulPair,
    addrs.soulBonus,
    ...addrs.storeDist, // index 8
    addrs.soulAirdrop,
    addrs.mintMagic721,
    addrs.propSeller,
    addrs.sm3d,
    addrs.socialWelfare
]

async function deploy () {
    console.log('Deploying V2 on the chainId ' + network.config.chainId)

    const Store = await ethers.getContractFactory('SoulmetaStore')
    store = await upgrades.deployProxy(Store)
    await store.deployed()
    console.log('Store deployed to: ', store.address)

    const params = [
        []
    ]
    const Controller = await ethers.getContractFactory('SoulmetaController')
    controller = await upgrades.deployProxy(Controller, params)
    await controller.deployed()
    console.log('Controller deployed to: ', controller.address)
}

async function upgradeStore () {
    console.log('Upgrade Store on the chainId ' + network.config.chainId)
    const Store = await ethers.getContractFactory('SoulmetaStore')
    // await upgrades.forceImport(addrs.store, Store)
    store = await upgrades.upgradeProxy(addrs.store, Store)
    console.log('Store upgraded for: ', addrs.store)
    await store.deployed()
    await verify()
}

async function upgradeController () {
    console.log('Upgrade Controller on the chainId ' + network.config.chainId)
    const Controller = await ethers.getContractFactory('SoulmetaController')
    // await upgrades.forceImport(addrs.controller, Controller)
    controller = await upgrades.upgradeProxy(addrs.controller, Controller)
    console.log('Controller upgraded for: ', controller.address)
    await controller.deployed()
    await verify()
}

async function getDeployed () {
    // oldData = await ethers.getContractAt('SoulCore', addrs.caste)
    store = await ethers.getContractAt('SoulmetaStore', addrs.store)
    controller = await ethers.getContractAt('SoulmetaController', addrs.controller)
}

async function verify () {
    // const storeImpl = await upgrades.erc1967.getImplementationAddress(addrs.store)
    // console.log('StoreImpl deployed to: ', storeImpl)
    // await run('verify:verify', {
    //     address: storeImpl
    // })
    // console.log('Verify Store Successfully.')

    const controllerImpl = await upgrades.erc1967.getImplementationAddress(controller.address)
    console.log('ControllerImpl deployed to: ', controllerImpl)
    await run('verify:verify', {
        address: controllerImpl
    })
    console.log('Verify Controller Successfully.')
}

async function init () {
    const smb = await ethers.getContractAt('SoulmetaItem1155', addrs.soul1155)
    const smbc = await ethers.getContractAt('SoulmetaItemBuilder721', addrs.soul721)
    const teamNft = await ethers.getContractAt('SoulmetaTeamNFT', addrs.teamNft)
    const airdrop = await ethers.getContractAt('SoulSetKnight', addrs.soulAirdrop)
    const oldData = await ethers.getContractAt('SoulCore', addrs.caste)

    await store.setApprovalForAll1155(smb.address, controller.address)
    await store.setOperator(controller.address, true)
    await smb.setMinter(controller.address, true)
    await smbc.setMinterBatch(controller.address, true)
    await teamNft.setMeta(addrs.usdt, controller.address)
    await airdrop.setContracts(controller.address, addrs.soul, true)
    const current = await oldData._tokenId()
    await controller.setBoxCounter(current)


    console.log('V2 Init done.')
    // 还要转入soul
    // 还要设置tokenId
}

async function migrateUser () {
    let players = require('../mig_3st_pure.json')
    players = [...new Set(players)]
    console.log('address count: ', players.length)
    const owner = (await ethers.getSigners())[0].address
    let nonce = await ethers.provider.getTransactionCount(owner)
    console.log('nonce: ', nonce)

    const teamList = []
    const referList = []
    const castWalletList = []
    const referWalletList = []
    // 0~975
    for (let i = 900; i < 975; i++) {
        const player = players[i]
        console.log('getting: ', player, ' ', i)
        const team = await oldData.teams(player)
        if (team !== ethers.constants.AddressZero) {
            teamList.push({ player, team })
        }
        const referrer = await oldData.referrers(player)
        if (referrer !== ethers.constants.AddressZero) {
            referList.push({ player, referrer })
        }
        const castAmount = await oldData.wallet(player)
        if (castAmount.gt(0)) {
            castWalletList.push({ player, amount: castAmount })
        }
        const referAmount = await oldData.referrersWallet(player)
        if (referAmount.gt(0)) {
            referWalletList.push({ player, amount: referAmount })
        }
    }
    console.log('map got')


    {
        const addrs = []
        const teams = []
        teamList.forEach(item => {
            addrs.push(item.player)
            teams.push(item.team)
        })
        await controller.setOldData(addrs, teams, [], 1, { nonce })
        nonce++
    }
    {
        const addrs = []
        const referrers = []
        referList.forEach(item => {
            addrs.push(item.player)
            referrers.push(item.referrer)
        })
        await controller.setOldData(addrs, referrers, [], 2, { nonce })
        nonce++
    }
    {
        const addrs = []
        const amounts = []
        castWalletList.forEach(item => {
            addrs.push(item.player)
            amounts.push(item.amount)
        })
        await controller.setOldData(addrs, [], amounts, 3, { nonce })
        nonce++
    }
    {
        const addrs = []
        const amounts = []
        referWalletList.forEach(item => {
            addrs.push(item.player)
            amounts.push(item.amount)
        })
        await controller.setOldData(addrs, [], amounts, 4, { nonce })
        nonce++
    }
    console.log('map migrated')
}

async function migrateStats () {
    const stats = await oldData.totalAmount()
    await controller.setStats([
        stats.Recommender,
        stats.Community,
        stats.Platform,
        stats.Jackpot,
        stats.ShareHolder,
        stats.ReceiveAddr
    ], addrs.store)
    console.log('Stats： ')
    console.log(stats)
}

async function migratePoolAll () {

    const migratePool = async (gender, count) => {
        const oldMap = {
            '0': 0,
            '5': 1,
            '10': 5,
            '15': 10,
            '20': 20
        }
        const oldCount = oldMap[count]
        const oldPool = await oldData.viewPool(gender, oldCount)
        const poolId = 10000 + (gender * 100) + Number.parseInt(count / 5) + 1
        if (oldPool.length === 0) {
            console.log(`pool ${gender}/${count} empty`)
            console.log(`from old ${gender}_${oldCount} to new ${poolId} `)
            return
        }
        const ids = []
        const amounts = []
        oldPool.forEach(item => {
            ids.push(item.tokenId)
            amounts.push(item.count)
        })
        for (let i = 0; i < ids.length / 100; i++) {
            console.log(`doing ${i * 100} to ${(i + 1) * 100}`)
            await store.createBoxBatch(ids.slice(i * 100, (i + 1) * 100), amounts.slice(i * 100, (i + 1) * 100), poolId, {
                gasLimit: 10000000,
                gasPrice: ethers.utils.parseUnits('5.1', 'gwei')
            })
        }

        console.log(`pool ${gender}/${count}  Send length ${ids.length}`)
        console.log(`from old ${gender}_${oldCount} to new ${poolId} `)
        console.log(`*-*-*-*------------------------------*-*-*-* `)
    }

    console.log('Pool： ')
    await migratePool(1, 0)
    await migratePool(2, 0)
    await migratePool(1, 5)
    await migratePool(2, 5)
    await migratePool(1, 10)
    await migratePool(2, 10)
    await migratePool(1, 15)
    await migratePool(2, 15)
    await migratePool(1, 20)
    await migratePool(2, 20)
}

async function migrateAssets () {
    const oldData = await ethers.getContractAt('SoulCore', addrs.caste)
    const smb = await ethers.getContractAt('SoulmetaItem1155', addrs.soul1155)
    const usdt = await ethers.getContractAt('IERC20', addrs.usdt)
    const soul = await ethers.getContractAt('IERC20', addrs.soul)
    const owner = (await ethers.getSigners())[0].address

    await oldData.setApprovalForAll1155(smb.address, owner)

    const idCount = await oldData._tokenId()
    const ids = []
    for (let i = 0; i < idCount; i++) {
        ids.push(i + 1)
    }
    const ad = new Array(ids.length).fill(oldData.address)
    const amounts = await smb.balanceOfBatch(ad, ids)
    for (let i = 1; i < ids.length / 100; i++) {
        console.log(`doing ${i * 100} to ${(i + 1) * 100}`)
        // console.log(oldData.address, store.address)
        await smb.safeBatchTransferFrom(oldData.address, store.address, ids.slice(i * 100, (i + 1) * 100), amounts.slice(i * 100, (i + 1) * 100), '0x00', {
            gasLimit: 10000000,
            gasPrice: ethers.utils.parseUnits('5.05', 'gwei'),
        })
    }

    const usdtBalance = await usdt.balanceOf(oldData.address)
    await oldData.divest(usdt.address, controller.address, usdtBalance)
    const soulBalance = await soul.balanceOf(oldData.address)
    await oldData.divest(soul.address, controller.address, soulBalance)
    console.log('Assets migrated')
}

async function setContracts () {
    const controller = await ethers.getContractAt('SoulmetaController', addrs.controller)
    await controller.setContracts(controllerContracts, true, true, true)
    console.log('set contracts done')
}

async function main () {
    // await deploy()
    await getDeployed()
    // await upgradeStore()
    // await upgradeController()
    await verify()
    // await init()

    // migrate
    // await migrateStats()
    // await migrateUser()
    // await migratePoolAll()
    // await migrateAssets()

    // control
    // await setContracts()
    // await verify()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
