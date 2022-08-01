const { ethers, upgrades, network, run } = require("hardhat");
const { getEnvAddr } = require('../env.js')

async function main () {
    let M2dnft = await ethers.getContractFactory("Soulmeta2dnft")
    let m2dnft = await M2dnft.deploy()
    await m2dnft.deployed()
    console.log("Soulmeta2dnft deployed to:", m2dnft.address);

    await run("verify:verify", {
        address: m2dnft.address
    });
    console.log("Verify Soulmeta3dnft Successfully.");




    const params = [
        "0xeC51016cF557D897109650eF88f34BD2d7D6F4bE",
        [
            "0xc5e0c9993aD915689E4A33A5857E4Cf50e1C6B3D",
            "0xc5e0c9993aD915689E4A33A5857E4Cf50e1C6B3D",
            "0xc5e0c9993aD915689E4A33A5857E4Cf50e1C6B3D"
        ]
    ]

    const Sm3d = await ethers.getContractFactory('Soulmeta2dnftSale')
    let sm3d = await upgrades.deployProxy(Sm3d, params)
    await sm3d.deployed()

    console.log('Soulmeta2dnftSale deployed to:', sm3d.address)

    const impl = await upgrades.erc1967.getImplementationAddress(sm3d.address)

    console.log(`Soulmeta2dnftSale Impl deployed to: ${impl}`)
    await run('verify:verify', {
        address: impl
    })
    console.log(`Verify Soulmeta2dnftSale Impl Successfully.`)

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
