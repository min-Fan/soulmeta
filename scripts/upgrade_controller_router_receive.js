const { ethers, upgrades, network, run } = require('hardhat')
const { getEnvAddr } = require('../env.js')

const addrs = getEnvAddr(network.config.chainId)
let controller, router, receive

async function upgrade () {
    const Controller = await ethers.getContractFactory('SoulmetaController')
    // await upgrades.forceImport(addrs.controller, Controller)
    controller = await upgrades.upgradeProxy(addrs.controller, Controller)
    console.log('controller upgraded for: ', controller.address)


    const Router = await ethers.getContractFactory('SoulMetaRouter')
    router = await upgrades.upgradeProxy(addrs.router, Router)
    console.log('router upgraded for: ', router.address)

    const Receive = await ethers.getContractFactory('SoulmetaTokenReceive')
    receive = await upgrades.upgradeProxy(addrs.soulTokenReceive, Receive)
    console.log('receive upgraded for: ', receive.address)

}

async function verify() {
    const controller = await upgrades.erc1967.getImplementationAddress(addrs.controller)
    console.log('controller deployed to: ', controller)
    await run('verify:verify', {
        address: controller
    })
    console.log('Verify controller Successfully.')


    const router = await upgrades.erc1967.getImplementationAddress(addrs.router)
    console.log('router deployed to: ', router)
    await run('verify:verify', {
        address: router
    })
    console.log('Verify router Successfully.')



    const receive = await upgrades.erc1967.getImplementationAddress(addrs.soulTokenReceive)
    console.log('receive deployed to: ', controller)
    await run('verify:verify', {
        address: receive
    })
    console.log('Verify receive Successfully.')


}


async function main () {
    // await upgrade()
    await verify()
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})