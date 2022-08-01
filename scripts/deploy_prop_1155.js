const { ethers, upgrades, network } = require('hardhat')
const { getEnvAddr } = require('../env.js')

async function main () {
    const addrs = getEnvAddr(network.config.chainId)
    // console.log(addrs)

    const params = [
        "PROP AMOUNT",
        "PROP",
        "https://soulmeta.io/nft-info/smb/",
        "https://soulmeta.io/nft-info/smb/"
    ]

    const Prop1155 = await ethers.getContractFactory('PropItem1155')
    const prop1155 = await Prop1155.deploy(...params)
    await prop1155.deployed()

    console.log('store deployed to:', prop1155.address)


    await run("verify:verify", {
        address: prop1155.address,
        constructorArguments: params,
        contract: "contracts/soul/prop_item_1155.sol:PropItem1155"
    });
    console.log("Verify Successfully.");
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})
