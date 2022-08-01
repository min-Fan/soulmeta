const { expect } = require('chai')
const { ethers } = require('hardhat')

describe("Testing soul_time_bank", function(){
    let signer, accounts
    let soul, timeBankNft, timeBank, timeBankRate, a3dNft


    beforeEach(async () => {
        signer = await ethers.getSigners()
        accounts = signer.map(item => item.address)

        //soul代币
        let Soul = await ethers.getContractFactory('SoulmetaToken')
        soul = await Soul.deploy()

        //时间银行的nft
        let TimeBankNft = await ethers.getContractFactory('SoulmetaItemBuilder721')
        timeBankNft = await TimeBankNft.deploy('Soul Meta Box Creator', 'SMBC', 'https://soulmeta.io/nft-info/smbc/')

        //时间银行
        let TimeBank = await ethers.getContractFactory('SoulMetaTimeBank')
        timeBank = await TimeBank.deploy()

        //时间银行-利息
        let TimeBankRate = await ethers.getContractFactory('SoulMetaTimeBankRate')
        timeBankRate = await TimeBankRate.deploy()


        //3dNft
        let A3dNft = await ethers.getContractFactory('SoulmetaItemBuilder721')
        a3dNft = await A3dNft.deploy('Soul Meta Box Creator', 'SMBC', 'https://soulmeta.io/nft-info/smbc/')



        //时间银行初始化
        await timeBank.initialize(
            soul.address,
            timeBankNft.address,
            timeBankRate.address,
            a3dNft.address,  //3dNft
        )


        //时间银行-利息初始化
        await timeBankRate.initialize(
            soul.address,
            timeBankNft.address,
            timeBank.address
        )

        //设置权限
        await timeBankNft.setMinterBatch(timeBank.address, true)
        await timeBankNft.setMinterBatch(timeBankRate.address, true)
        await soul.approve(timeBank.address, ethers.utils.parseEther('1000000000'))
        await soul.approve(timeBankRate.address, ethers.utils.parseEther('1000000000'))
        await timeBank.setOperator(timeBankRate.address, true);
        await a3dNft.setSuperMinter(accounts[0]);

        //mint 3个 3dNft
        // await a3dNft.mintMulti([accounts[0], accounts[0], accounts[0]], [1,2,3])
    })

    it('test-deposit', async  function(){
        //往利息合约打soul= 1e
        await soul.transfer(timeBankRate.address, ethers.utils.parseEther('100000000'))

        let user_soul = await soul.balanceOf(accounts[0])
        console.log("用户的soul：", user_soul/ethers.utils.parseEther('1'))

        console.log()
        console.log("存入本金 1w  ===================")
        //存入1w
        await timeBank.deposit(1, ethers.utils.parseEther('10000'))

        //查看存入后的数据
        let user_soul_1 = await soul.balanceOf(accounts[0])
        console.log("用户的soul：", user_soul_1/ethers.utils.parseEther('1'))

        let info = await timeBank.timeBankInfo()
        console.log("需要支付的利息：", info.totalRate/ethers.utils.parseEther('1'), "总本金：", info.totalStakeNum/ethers.utils.parseEther('1'), "总人数：", info.totalStake/1, "剩余本金：", info.curStakeNum/ethers.utils.parseEther('1'), "剩余人数：", info.curStake/1)

        let stake = await timeBank.stakeInfo(1)
        console.log("存入的类型：", stake.mode, "数额：", stake.amount/ethers.utils.parseEther('1'), "上次领取时间：", stake.lastRewardTime/1, "结束时间：", stake.deadline/1)




        console.log()
        console.log("等待10秒后领取利息  ===================")
        function sleep (time) {
            return new Promise((resolve) => setTimeout(resolve, time));
        }
        await sleep(1000)

        let user_nft = await timeBankNft.balanceOf(accounts[0])
        console.log("用户的nft：", user_nft)

        //领取利息
        await timeBankRate.getReward(accounts[0], 1)

        let playerReward = await timeBank.playerRewarded(1)
        console.log("用户已领取的利息：", playerReward/ethers.utils.parseEther('1'))

        let stake_1 = await timeBank.stakeInfo(1)
        console.log("领取利息后，存入的类型：", stake_1.mode, "数额：", stake_1.amount/ethers.utils.parseEther('1'), "上次领取时间：", stake_1.lastRewardTime/1, "结束时间：", stake_1.deadline/1)

        let info_1 = await timeBank.timeBankInfo()
        console.log("需要支付的利息：", info_1.totalRate/ethers.utils.parseEther('1'), "总本金：", info_1.totalStakeNum/ethers.utils.parseEther('1'), "总人数：", info_1.totalStake/1, "剩余本金：", info_1.curStakeNum/ethers.utils.parseEther('1'), "剩余人数：", info_1.curStake/1)





        console.log()
        console.log("存入 mode=3 的本金，测试3dNft ===================")

        //mint一个3dNft
        await a3dNft.mint(accounts[0], 1);

        //存入100
        await timeBank.deposit(3, ethers.utils.parseEther('100'))

        let nft_1 = await timeBank.a3dNftMor(1)
        console.log("3dNft 第一次质押，3dNft是否使用：1:", nft_1/ethers.utils.parseEther('1'))
        let info_2 = await timeBank.timeBankInfo()
        console.log("需要支付的利息：", info_2.totalRate/ethers.utils.parseEther('1'), "总本金：", info_2.totalStakeNum/ethers.utils.parseEther('1'), "总人数：", info_2.totalStake/1, "剩余本金：", info_2.curStakeNum/ethers.utils.parseEther('1'), "剩余人数：", info_2.curStake/1)


        //mint一个3dNft
        await a3dNft.mint(accounts[0], 2);
        //再次传入
        await timeBank.deposit(3, ethers.utils.parseEther('500'))
        let nft_2_1 = await timeBank.a3dNftMor(1)
        let nft_2_2 = await timeBank.a3dNftMor(2)
        console.log("3dNft 第二次质押，3dNft是否使用：1:", nft_2_1/ethers.utils.parseEther('1'), "2:", nft_2_2/ethers.utils.parseEther('1'))
        let info_3 = await timeBank.timeBankInfo()
        console.log("需要支付的利息：", info_3.totalRate/ethers.utils.parseEther('1'), "总本金：", info_3.totalStakeNum/ethers.utils.parseEther('1'), "总人数：", info_3.totalStake/1, "剩余本金：", info_3.curStakeNum/ethers.utils.parseEther('1'), "剩余人数：", info_3.curStake/1)



        await a3dNft.mint(accounts[0], 3);
        await a3dNft.mint(accounts[0], 4);
        await a3dNft.mint(accounts[0], 5);

        await timeBank.deposit(3, ethers.utils.parseEther('501'))
        let nft_3_1 = await timeBank.a3dNftMor(1)
        let nft_3_2 = await timeBank.a3dNftMor(2)
        let nft_3_3 = await timeBank.a3dNftMor(3)
        let nft_3_4 = await timeBank.a3dNftMor(4)
        let nft_3_5 = await timeBank.a3dNftMor(5)
        console.log("3dNft 第三次质押，3dNft是否使用：1:", nft_3_1/ethers.utils.parseEther('1'), "2:", nft_3_2/ethers.utils.parseEther('1'), "3:", nft_3_3/ethers.utils.parseEther('1'), "4:", nft_3_4/ethers.utils.parseEther('1'), "5:", nft_3_5/ethers.utils.parseEther('1'))
        let stake_4 = await timeBank.stakeInfo(4)
        console.log("用3dNft质押后，存入的类型：", stake_4.mode, "数额：", stake_4.amount/ethers.utils.parseEther('1'), "上次领取时间：", stake_4.lastRewardTime/1, "结束时间：", stake_4.deadline/1)
        let info_4 = await timeBank.timeBankInfo()
        console.log("需要支付的利息：", info_4.totalRate/ethers.utils.parseEther('1'), "总本金：", info_4.totalStakeNum/ethers.utils.parseEther('1'), "总人数：", info_4.totalStake/1, "剩余本金：", info_2.curStakeNum/ethers.utils.parseEther('1'), "剩余人数：", info_4.curStake/1)




        console.log()
        console.log("手动设置本金到期 ===================")
        //设置本金到期
        await timeBank.setStakeInfo(4, 3, ethers.utils.parseEther('501'), 1624118400, 1655654400, false)
        //设置721approve
        await timeBankNft.setApprovalForAll(timeBank.address, true)
        //设置本金合约调用利息合约
        await timeBankRate.setOperator(timeBank.address, true);
        //领取本金
        await timeBank.extract(4)
        let stake_5= await timeBank.stakeInfo(4)
        console.log("领取本金后，存入的类型：", stake_5.mode, "数额：", stake_5.amount/ethers.utils.parseEther('1'), "上次领取时间：", stake_5.lastRewardTime/1, "结束时间：", stake_5.deadline/1)

        let playerReward_1 = await timeBank.playerRewarded(4)
        console.log("用户已领取的利息：", playerReward_1/ethers.utils.parseEther('1'))

        let info_5 = await timeBank.timeBankInfo()
        console.log("需要支付的利息：", info_5.totalRate/ethers.utils.parseEther('1'), "总本金：", info_5.totalStakeNum/ethers.utils.parseEther('1'), "总人数：", info_5.totalStake/1, "剩余本金：", info_5.curStakeNum/ethers.utils.parseEther('1'), "剩余人数：", info_5.curStake/1)


        let nft_6 = await timeBank.a3dNftMor(1)
        let nft_7 = await timeBank.a3dNftMor(2)
        let nft_8 = await timeBank.a3dNftMor(3)
        let nft_9 = await timeBank.a3dNftMor(4)
        let nft_10 = await timeBank.a3dNftMor(5)
        console.log("3dNft 取出本金后，3dNft是否使用：1:", nft_6/ethers.utils.parseEther('1'), "2:", nft_7/ethers.utils.parseEther('1'), "3:", nft_8/ethers.utils.parseEther('1'),  "4:", nft_9/ethers.utils.parseEther('1'),  "5:", nft_10/ethers.utils.parseEther('1'))

    })


})