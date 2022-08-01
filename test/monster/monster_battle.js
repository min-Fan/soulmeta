const { expect } = require('chai')
const { ethers, upgrades } = require('hardhat')

describe('Testing Monster', function () {
    let signer, accounts
    let soul, monsterNft, monsterMarket, monsterBattle

    beforeEach("deploy", async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)
        
        // let Soul = await ethers.getContractFactory("SoulmetaToken")
        // soul = await Soul.deploy();
        // console.log("soul address ==>", soul.address)

        let MonsterNft = await ethers.getContractFactory('MonsterNft')
        monsterNft = await MonsterNft.deploy("Monster NFT", "MONSTER")
        // console.log("monsterNft address ==>", monsterNft.address)

        let MonsterBattle = await ethers.getContractFactory('MonsterBattle')
        monsterBattle = await upgrades.deployProxy(MonsterBattle, [monsterNft.address, "0xc5e0c9993aD915689E4A33A5857E4Cf50e1C6B3D"])
        // console.log("monsterBattle address ==>", monsterBattle.address)

        await monsterNft.setMinterBatch(monsterBattle.address, true)
        await monsterBattle.setAmount(1, ethers.utils.parseEther("0.1"))
    })

    it("monster game", async () => {
        await monsterBattle.ranMonster(3);
        let mons = await monsterBattle.getRanMonsters(accounts[0]);
        await monsterBattle.setAmount(mons[0], ethers.utils.parseEther("0.1"))
        let price = await monsterBattle.getBattlePrice(mons[0], false);
        console.log("price ==>", price)

        let gasPrice = await signer[0].getGasPrice()
        let nonce = await signer[0].getTransactionCount()
        let options = {
            gasLimit: 1000000,
            gasPrice,
            nonce,
            value: price
        }
        let battleTx = await monsterBattle.battle([0,1,2], mons[0], false, options)
        await battleTx.wait()
        // console.log("battleTx ==>", battleTx)
    })

    it('random monster', async () => {
        await monsterBattle.ranMonster(6);
        let mons = await monsterBattle.getRanMonsters(accounts[0]);
        console.log("monsters ==>", mons)
    })

})