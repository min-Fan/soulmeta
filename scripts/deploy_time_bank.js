const { ethers, upgrades, network } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)

async function deploy721 () {
    // const TimeBank721 = await ethers.getContractFactory('SoulmetaTimeBank721')
    // const timeBank721 = await TimeBank721.deploy()
    // await timeBank721.deployed()
    //
    // console.log('SoulmetaTimeBank721 deployed to:', timeBank721.address)


    await run("verify:verify", {
        address: "0x4D31a0BE0600D32D79879B62A18F5554123ec6B3",
        // constructorArguments: params,
        // contract: "contracts/soul/mint_magic_721.sol:SoulmetaMintMagic721"
    });
    console.log("SoulmetaTimeBank721 Verify Successfully.");
}

async function deployTimeBank(){
    const addrs = getEnvAddr(network.config.chainId)

    const params = [
        addrs.soul,
        addrs.timeBankNft,
        addrs.timeBankRate,
        addrs.sm3d   //这个合约为3dNft，现用特殊铸造nft合约代替测试
    ]

    const SoulMetaTimeBank = await ethers.getContractFactory('SoulMetaTimeBank')
    const timeBank = await upgrades.deployProxy(SoulMetaTimeBank, params)
    await timeBank.deployed()

    console.log('SoulMetaTimeBank deployed to:', timeBank.address)

    const CONTRACT = 'SoulMetaTimeBank'
    const addr = timeBank.address
    const impl = await upgrades.erc1967.getImplementationAddress(addr)
    console.log(`${CONTRACT} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${CONTRACT} Impl Successfully.`)
}


async function deployTimeBankRate(){
    const addrs = getEnvAddr(network.config.chainId)

    const params = [
        addrs.soul,
        addrs.timeBankNft,
        addrs.timeBank
    ]

    const SoulMetaTimeBankRate = await ethers.getContractFactory('SoulMetaTimeBankRate')
    const timeBankRate = await upgrades.deployProxy(SoulMetaTimeBankRate, params)
    await timeBankRate.deployed()

    console.log('SoulMetaTimeBankRate deployed to:', timeBankRate.address)

    const CONTRACT = 'SoulMetaTimeBankRate'
    const addr = timeBankRate.address
    const impl = await upgrades.erc1967.getImplementationAddress(addr)
    console.log(`${CONTRACT} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${CONTRACT} Impl Successfully.`)
}

const init = async() => {
    const setTimeBankNft = await ethers.getContractAt('SoulmetaItemBuilder721', addrs.timeBankNft)
    await setTimeBankNft.setMinterBatch(addrs.timeBank, true)
    // await setTimeBankNft.setMinterBatch(addrs.timeBankRate, true)

    // const setSoulToken = await ethers.getContractAt('SoulmetaToken', addrs.soul)
    // await setSoulToken.approve(addrs.timeBank, ethers.utils.parseEther('1000000000'))
    // await setSoulToken.approve(addrs.timeBankRate, ethers.utils.parseEther('1000000000'))

    const setTimeBank = await ethers.getContractAt('SoulMetaTimeBank', addrs.timeBank)
    await setTimeBank.setOperator(addrs.timeBankRate, true)
    await setTimeBank.setContracts(addrs.soul, addrs.timeBankNft, addrs.timeBankRate, addrs.sm3d)

    const setTimeBankRate = await ethers.getContractAt('SoulMetaTimeBankRate', addrs.timeBankRate)
    await setTimeBankRate.setOperator(addrs.timeBank, true)

}

async function main () {
    // await deploy721()
    // await deployTimeBank()
    // await deployTimeBankRate()
    await init()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
