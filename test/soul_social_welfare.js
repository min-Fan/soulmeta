const { expect } = require('chai')
const { ethers } = require('hardhat')

describe("Testing SoulMetaSocialWelfare", function(){
    let signer, accounts
    let soul, a3dNft, social


    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        //soul代币
        let Soul = await ethers.getContractFactory('SoulmetaToken')
        soul = await Soul.deploy()

        //3dNft
        let A3dNft = await ethers.getContractFactory('Soulmeta3dnft')
        a3dNft = await A3dNft.deploy(soul.address)

        //social
        let Social = await ethers.getContractFactory('SoulMetaSocialWelfare')
        social = await Social.deploy()


        //social初始化
        await social.initialize(
            soul.address,
            a3dNft.address
        )

        //设置权限
        await soul.approve(social.address, ethers.utils.parseEther('1000000000'))

    })

    it('test-social', async  function() {
        //给社会福利合约转账100
        await soul.transfer(social.address, ethers.utils.parseEther('100'))

        let socialCount = await soul.balanceOf(social.address)
        console.log("福利合约soul：", socialCount/ethers.utils.parseEther('1'))

        //给当前账户铸造4个3dNft
        await a3dNft.mint()
        await a3dNft.mint()
        await a3dNft.mint()
        await a3dNft.mint()
        await a3dNft.mint()
        let nftCount = await a3dNft.getTokenIdList(accounts[0])
        console.log("拥有的3dNft数量：", nftCount)



        console.log()
        console.log("激活测试 ===================")
        //激活 id = 1 的3dNft
        await social.activation([1])
        //查看数据
        let socialData_1 = await social.welfareData()
        console.log("社会福利数据，当前：", socialData_1.day/1, "发放总额：", socialData_1.todayTotal/ethers.utils.parseEther('1'), "剩余发放额：", socialData_1.receiveTotal/ethers.utils.parseEther('1'), "发放总份额：", socialData_1.canClaim/ethers.utils.parseEther('1'), "今日个人份额：", socialData_1.dayClaim/ethers.utils.parseEther('1'), "用户总数：",socialData_1.userTotal/1, "有效用户：",socialData_1.validUser/1)
        let userData_1 = await social.userData(1)
        console.log("个人数据，上次领取时间：", userData_1.receiveDay/1, "已领取总额：", userData_1.totalAmount/ethers.utils.parseEther('1'), "当前份额：", userData_1.currentShare/ethers.utils.parseEther('1'))
        let socialCount_1 = await soul.balanceOf(social.address)
        console.log("福利合约soul：", socialCount_1/ethers.utils.parseEther('1'))

        console.log()
        console.log("可领取时间往前修改一天，模拟第二天领取 ===================")
        let day = socialData_1.day - 1;
        // await social.setWelfareData(day, ethers.utils.parseEther('20'), ethers.utils.parseEther('20'), ethers.utils.parseEther('20'), ethers.utils.parseEther('20'))
        await social.setUserData(1, day, ethers.utils.parseEther('0'), ethers.utils.parseEther('0'))
        let socialData_2 = await social.welfareData()
        console.log("社会福利数据，当前：", socialData_2.day/1, "发放总额：", socialData_2.todayTotal/ethers.utils.parseEther('1'), "剩余发放额：", socialData_2.receiveTotal/ethers.utils.parseEther('1'), "发放总份额：", socialData_2.canClaim/ethers.utils.parseEther('1'), "今日个人份额：", socialData_2.dayClaim/ethers.utils.parseEther('1'), "用户总数：",socialData_2.userTotal/1, "有效用户：",socialData_2.validUser/1)
        let userData_2 = await social.userData(1)
        console.log("个人数据，上次领取时间：", userData_2.receiveDay/1, "已领取总额：", userData_2.totalAmount/ethers.utils.parseEther('1'), "当前份额：", userData_2.currentShare/ethers.utils.parseEther('1'))
        let socialCount_2 = await soul.balanceOf(social.address)
        console.log("福利合约soul：", socialCount_2/ethers.utils.parseEther('1'))


        console.log()
        console.log("进行领取 ===================")
        await social.userReceive([1])
        let socialData_3 = await social.welfareData()
        console.log("社会福利数据，当前：", socialData_3.day/1, "发放总额：", socialData_3.todayTotal/ethers.utils.parseEther('1'), "剩余发放额：", socialData_3.receiveTotal/ethers.utils.parseEther('1'), "发放总份额：", socialData_3.canClaim/ethers.utils.parseEther('1'), "今日个人份额：", socialData_3.dayClaim/ethers.utils.parseEther('1'), "用户总数：",socialData_3.userTotal/1, "有效用户：",socialData_3.validUser/1)
        let userData_3 = await social.userData(1)
        console.log("个人数据，上次领取时间：", userData_3.receiveDay/1, "已领取总额：", userData_3.totalAmount/ethers.utils.parseEther('1'), "当前份额：", userData_3.currentShare/ethers.utils.parseEther('1'))
        let socialCount_3 = await soul.balanceOf(social.address)
        console.log("福利合约soul：", socialCount_3/ethers.utils.parseEther('1'))

        console.log()
        console.log("可领取时间往前修改一天,同时soul+200，模拟第三天领取 ===================")
        await soul.transfer(social.address, ethers.utils.parseEther('200'))
        //激活2、3、4
        await social.activation([2,3,4])
        let day_2 = socialData_1.day - 2;
        //修改汇总数据。在领取或者激活的时候会重新计算
        await social.setWelfareData(day_2, ethers.utils.parseEther('20'), ethers.utils.parseEther('0'), ethers.utils.parseEther('20'), ethers.utils.parseEther('20'))
        //激活5，重置汇总数据
        await social.activation([5])
        await social.setUserData(1, day_2, ethers.utils.parseEther('0'),ethers.utils.parseEther('0'))
        let socialData_4 = await social.welfareData()
        console.log("社会福利数据，当前：", socialData_4.day/1, "发放总额：", socialData_4.todayTotal/ethers.utils.parseEther('1'), "剩余发放额：", socialData_4.receiveTotal/ethers.utils.parseEther('1'), "发放总份额：", socialData_4.canClaim/ethers.utils.parseEther('1'), "今日个人份额：", socialData_4.dayClaim/ethers.utils.parseEther('1'), "用户总数：",socialData_4.userTotal/1, "有效用户：",socialData_4.validUser/1)
        let userData_4 = await social.userData(1)
        console.log("个人数据，上次领取时间：", userData_4.receiveDay/1, "已领取总额：", userData_4.totalAmount/ethers.utils.parseEther('1'), "当前份额：", userData_4.currentShare/ethers.utils.parseEther('1'))
        let socialCount_4 = await soul.balanceOf(social.address)
        console.log("福利合约soul：", socialCount_4/ethers.utils.parseEther('1'))


        console.log()
        console.log("进行领取 ===================")
        await social.userReceive([1])
        let socialData_5 = await social.welfareData()
        console.log("社会福利数据，当前：", socialData_5.day/1, "发放总额：", socialData_5.todayTotal/ethers.utils.parseEther('1'), "剩余发放额：", socialData_5.receiveTotal/ethers.utils.parseEther('1'), "发放总份额：", socialData_5.canClaim/ethers.utils.parseEther('1'), "今日个人份额：", socialData_5.dayClaim/ethers.utils.parseEther('1'), "用户总数：",socialData_5.userTotal/1, "有效用户：",socialData_5.validUser/1)
        let userData_5 = await social.userData(1)
        console.log("个人数据，上次领取时间：", userData_5.receiveDay/1, "已领取总额：", userData_5.totalAmount/ethers.utils.parseEther('1'), "当前份额：", userData_5.currentShare/ethers.utils.parseEther('1'))
        let socialCount_5 = await soul.balanceOf(social.address)
        console.log("福利合约soul：", socialCount_5/ethers.utils.parseEther('1'))


    })

})