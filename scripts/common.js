const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)

async function deployRaw (cName, params = [], doVerify = true) {
    console.log(`Deploying ${cName} on the chainId ${network.config.chainId}`)
    const factory = await ethers.getContractFactory(cName)
    const instance = await factory.deploy(...params)
    await instance.deployed()

    console.log(`${cName} deployed at: `, instance.address)

    if (doVerify) {
        await run('verify:verify', {
            address: instance.address,
            constructorArguments: params.length === 0 ? undefined : params
        })
        console.log(`Verify ${cName} Successfully.`)
    }
    return instance
}

async function deploy (cName, params = [], doVerify = true) {
    console.log(`Deploying ${cName} on the chainId ${network.config.chainId}`)
    const factory = await ethers.getContractFactory(cName)
    const instance = await upgrades.deployProxy(factory, params)
    await instance.deployed()
    console.log(`${cName} deployed at: `, instance.address)
    if (doVerify) await verify(cName, instance.address)
    return instance
}

async function upgrade (cName, cAddr, forceImport = false, doVerify = true) {
    console.log(`Upgrading ${cName} on the chainId ${network.config.chainId}`)
    const factory = await ethers.getContractFactory(cName)
    if (forceImport) await upgrades.forceImport(cAddr, factory)
    const proxy = await upgrades.upgradeProxy(cAddr, factory)
    await proxy.deployed()
    console.log(`${cName} upgraded for: `, proxy.address)
    if (doVerify) await verify(cName, cAddr)
    return proxy
}

async function verifyRaw (cName, cAddr, params = []) {
    await run('verify:verify', {
        address: cAddr,
        constructorArguments: params.length === 0 ? undefined : params
    })
    console.log(`Verify ${cName} Successfully.`)
}

async function verify (cName, cAddr) {
    const impl = await upgrades.erc1967.getImplementationAddress(cAddr)
    console.log(`${cName} Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify ${cName} Impl Successfully.`)
}

module.exports = {
    deployRaw, deploy, upgrade, verify, verifyRaw
}