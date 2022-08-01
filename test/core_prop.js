// import U_ from "../../../fontProject/nakafish-web/nakafish-web/assets/index.e7bf353f";

const { expect } = require('chai')
const { ethers } = require('hardhat')

describe("Testing CoreProp", function(){
    let signer, accounts
    let usdt, U_ACC
    let smb, smbc, soul, team
    let store, controller
    let lp, bonus

    let platform = '0xDA30a414fe4B57cB9270BA25D1CD612aCEE4B189'
    let jackpot = '0xa1bFf9029857392CB964b5B66336db47321c6369'
    let shareHolder = '0x1C8E5F9d141522E5112eB95ceBdbfE098BA55cd4'
    let receiveAddr = '0x9CfE5BEbC1867424241af395F803b62A3ec2e7CB'

    let prop, prop1155

    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        let Smb = await ethers.getContractFactory('SoulmetaItem1155')
        smb = await Smb.deploy('Soul Meta Box', 'SMB', 'https://soulmeta.io/nft-info/smb/', 'https://soulmeta.io/nft-info/smb/')

        let Smbc = await ethers.getContractFactory('SoulmetaItemBuilder721')
        smbc = await Smbc.deploy('Soul Meta Box Creator', 'SMBC', 'https://soulmeta.io/nft-info/smbc/')

        let Soul = await ethers.getContractFactory('SoulmetaToken')
        soul = await Soul.deploy()

        let Team = await ethers.getContractFactory('SoulmetaTeamNFT')
        team = await Team.deploy()
        await team.initialize('Soul Meta Community Leader', 'SMCL', 'https://soulmeta.io/nft-info/smcl/')

        let Store = await ethers.getContractFactory('SoulmetaStore')
        store = await Store.deploy()

        let Controller = await ethers.getContractFactory('SoulmetaController')
        controller = await Controller.deploy()

        let Usdt = await ethers.getContractFactory('EvilUSDT')
        usdt = await Usdt.deploy()

        let Lp = await ethers.getContractFactory('MockPair')
        lp = await upgrades.deployProxy(Lp, ['Soul LP', 'LP'], {initializer: 'initialize'})

        let Bonus = await ethers.getContractFactory('SoulmetaBonus')
        bonus = await Bonus.deploy()
        await bonus.initialize(usdt.address, smb.address, soul.address, lp.address, controller.address)

        //道具1155
        let Prop1155 = await ethers.getContractFactory('SoulmetaProp1155')
        prop1155 = await Prop1155.deploy('Soul Meta Prop', 'Prop', 'https://soulmeta.io/nft-info/smb/', 'https://soulmeta.io/nft-info/smb/')

        let Prop = await ethers.getContractFactory('SoulmetaPropSeller')
        prop = await Prop.deploy()


        //铸造权限道具
        let Minter721 = await ethers.getContractFactory('SoulmetaMintMagic721')
        magic721 = await Minter721.deploy('Soul Meta Minter', 'Minter', 'https://soulmeta.io/nft-info/smb/')


        let Dnft = await ethers.getContractFactory('SoulmetaMintMagic721')
        dnft = await Dnft.deploy('Soul Meta Minter', 'Minter', 'https://soulmeta.io/nft-info/smb/')

        await controller.initialize([
            usdt.address,
            store.address,
            smb.address,
            smbc.address,
            soul.address,
            team.address,
            accounts[9],
            bonus.address,
            jackpot,
            shareHolder,
            receiveAddr,
            accounts[1],    // soulTransferAddr
            magic721.address,
            prop.address,
            dnft.address
        ])

        await prop.initialize(
            usdt.address,
            controller.address,
            soul.address,
            prop1155.address,
            accounts[9],
            jackpot
        )

        await store.initialize()
        await store.setApprovalForAll1155(smb.address, controller.address)
        await store.setOperator(controller.address, true)
        const b = await soul.balanceOf(accounts[0])
        const b2 = await usdt.balanceOf(accounts[0])
        await soul.transfer(accounts[9], ethers.utils.parseEther('100'))
        await usdt.transfer(accounts[9], ethers.utils.parseEther('590'))

        await smb.setMinter(controller.address, true)
        await smbc.setMinterBatch(controller.address, true)

        await prop1155.setApprovalForAll(prop.address, true)
        await prop1155.setMinter(prop.address, true)

        // await minter1155.setApprovalForAll(controller.address, true)
        await magic721.setMinterBatch(accounts[0], true)
        await dnft.setMinterBatch(accounts[0], true)

        U_ACC = Number.parseInt(await usdt.decimals())
    })


    // it("create - prop", async function(){
    //     //给当前合约minter600个道具
    //     await prop.castProp(1, 600)
    //     let amount = await prop1155.balanceOf(prop.address, 1)
    //     console.log(amount)
    // })
    //
    // it("buy - prop", async function(){
    //     await prop.castProp(1, 600)
    //     let amount = await prop1155.balanceOf(prop.address, 1)
    //     console.log(amount)
    //
    //     await soul.approve(prop.address, ethers.constants.MaxUint256)
    //     await prop1155.setApprovalForAll(prop.address, true)
    //     await prop.buyProp()
    //     let amount1 = await prop1155.balanceOf(accounts[0], 1)
    //     console.log(amount1)
    //
    //     let amount2 = await prop1155.balanceOf(prop.address, 1)
    //     console.log(amount2)
    //     // await prop.buyProp()
    // })

    it("batch - prop - box", async function(){
        //给当前合约铸造600个道具
        // await prop.castProp(1, 600)
        // let amount = await prop1155.balanceOf(prop.address, 1)
        // console.log("道具数量：", amount)


        // await soul.approve(prop.address, ethers.constants.MaxUint256)
        // await prop1155.setApprovalForAll(prop.address, true)

        //购买道具
        // await prop.buyProp(prop.address)
        // let amount1 = await prop1155.balanceOf(accounts[0], 1)
        // console.log("购买道具后，自己拥有的数量：", amount1)

    //     //购买后，剩余的道具
    //     let amount2 = await prop1155.balanceOf(prop.address, 1)
    //     console.log("合约剩余的道具数量：",amount2)
    //
    //
    //     let usdt_a_0_1 = await usdt.balanceOf(accounts[0])
    //     let soul_a_0_1 = await soul.balanceOf(accounts[0])
    //
    //     console.log("用户的usdt：", usdt_a_0_1 / 10**U_ACC, "用户的soul：", soul_a_0_1 / 10**U_ACC)
    //
        //先铸造
        //增加铸造道具 = 3dnft
        await dnft.mint(accounts[0])
        await usdt.approve(controller.address, ethers.constants.MaxUint256)
        await soul.approve(controller.address, ethers.constants.MaxUint256)
        await controller.buildBox(1, 1, 0, 1, accounts[1])

        //消耗u和soul
        let usdt_a_0_2 = await usdt.balanceOf(accounts[0])
        let soul_a_0_2 = await soul.balanceOf(accounts[0])
        console.log("铸造的usdt：", usdt_a_0_2 / 10**U_ACC, "铸造的soul：", soul_a_0_2 / 10**U_ACC)


        await controller.buildBox(1, 1, 0, 1, accounts[1])
        await controller.buildBox(1, 1, 5, 1, accounts[1])
        await controller.buildBox(1, 1, 10, 1, accounts[1])
        await controller.buildBox(1, 1, 15, 1, accounts[1])
        await controller.buildBox(1, 1, 20, 1, accounts[1])


        //增加铸造道具
        await magic721.mint(accounts[0])
        //有铸造道具铸造盒子
        await controller.buildBox(1, 1, 0, 1, accounts[1])

        //开启
        await soul.transfer(controller.address, ethers.utils.parseEther('100000'))
        await usdt.approve(prop.address, ethers.constants.MaxUint256)
        await soul.approve(prop.address, ethers.constants.MaxUint256)

        let pools_10101 = await store.poolSizes(10101)
        let pools_10102 = await store.poolSizes(10102)
        let pools_10103 = await store.poolSizes(10103)
        let pools_10104 = await store.poolSizes(10104)
        let pools_10105 = await store.poolSizes(10105)
        let pools_10110 = await store.poolSizes(10110)
        console.log("池子列表的数量：", pools_10101, pools_10102, pools_10103, pools_10104, pools_10105, pools_10110)

        let count = await controller._getTargetCount(100)
        console.log("指定池子应该出的数量：", count);

        // let recommender = accounts[1]
        // await prop.propBatchBox(1, 1, 100, recommender)
        //
        await controller.drawBox(accounts[0], 1, 1, 1 , accounts[1])


        let pools_2_10101 = await store.poolSizes(10101)
        let pools_2_10102 = await store.poolSizes(10102)
        let pools_2_10103 = await store.poolSizes(10103)
        let pools_2_10104 = await store.poolSizes(10104)
        let pools_2_10105 = await store.poolSizes(10105)
        let pools_2_10110 = await store.poolSizes(10110)
        console.log("剩余池子的数量：", pools_2_10101, pools_2_10102, pools_2_10103, pools_2_10104, pools_2_10105, pools_2_10110)

        // let count_1 = await controller._getTargetCount(100)
        // console.log("指定池子应该出的数量：", count_1);
    //
    //     await prop.propBatchBox(1, 1, 100, recommender)
    //
    //
    //     let pools_3_10101 = await store.poolSizes(10101)
    //     let pools_3_10102 = await store.poolSizes(10102)
    //     let pools_3_10103 = await store.poolSizes(10103)
    //     let pools_3_10104 = await store.poolSizes(10104)
    //     let pools_3_10105 = await store.poolSizes(10105)
    //     let pools_3_10110 = await store.poolSizes(10110)
    //     console.log("剩余池子的数量：", pools_3_10101, pools_3_10102, pools_3_10103, pools_3_10104, pools_3_10105, pools_3_10110)
    })

})