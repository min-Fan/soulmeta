const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat');

describe('Testing WorldCup', function () {
    let signer, accounts
    let soul, world, random, viewer
    

    beforeEach("deploy", async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Soul = await ethers.getContractFactory("SoulmetaToken");
        soul = await Soul.deploy();
        console.log("soul contract address ==>", soul.address)

        let Random = await ethers.getContractFactory('RandomConsumer')
        random = await Random.deploy("848")
        console.log("random contract address ==>", random.address)

        let World = await ethers.getContractFactory('WorldCup')
        world = await upgrades.deployProxy(World, [soul.address, random.address, "0xc5e0c9993aD915689E4A33A5857E4Cf50e1C6B3D"])
        await world.deployed();
        console.log("world upd deployed to: ==>", world.address)

        let Viewer = await ethers.getContractFactory('WorldCupViewer')
        viewer = await upgrades.deployProxy(Viewer, [world.address, random.address])
        await viewer.deployed();
        console.log("viewer contract address ==>", viewer.address)

        await random.setOwner(world.address)

        // 设置开始时间
        await world.setTime(1657069200, 1659189600)

    })

    it('Viewer', async function () {


        let view = await viewer.getEarningsData(accounts[0])
        console.log("view ==>", view)


    })

})