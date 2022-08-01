// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../other/random_generator_upgradeable.sol";
import "../interface/I_soul_token.sol";
import "../interface/I_soul_time_bank_rate.sol";

interface ISoul721{
    function mint(address player_) external returns (uint);
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address account_) external view returns(uint256);
    function tokenOfOwnerByIndex(address account_, uint index_) external view returns(uint256);
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
}

contract SoulMetaTimeBank is DivestorUpgradeable, RandomGeneratorUpgradeable, ERC721HolderUpgradeable{
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;

    ISoulToken public soulToken;
    ISoul721 public timeBankNft;
    ISoulTimeBankRate public timeBankRate;
    address public a3dNft;

    //银行总数据
    struct  TimeBankData{
        uint totalRate;         //当前总利息
        uint totalStakeNum;     //总质押量
        uint curStakeNum;       //当前质押量
        uint totalStake;        //总质押人数
        uint curStake;          //当前质押人数
    }

    //nft存储数据
    struct StakeData{
        uint tokenId;
        uint8 mode;
        uint amount;
        uint lastRewardTime;
        uint deadline;
        bool isFinished;
    }

    //年化
    struct Annualized{
        uint period;
        uint rate;
    }

    TimeBankData public timeBankInfo;                       //总数据
    mapping(uint => StakeData) public stakeInfo;            //nft存储的数据
    mapping(uint8 => Annualized) public annualizedInfo;     //年化
    mapping(uint => uint) public a3dNftMor;                 //3dNft是否使用
    mapping(uint => uint) public playerRewarded;           //tokenId => 提现的利息
    mapping(address => bool) public operators;

    uint constant ACC = 1 ether;
    uint constant ONE_YEAR = 365 days;
    bool isOpen;


    modifier onlyOpen {
        require(isOpen, "Not open");
        _;
    }

    event Deposit(address indexed player, uint mode, uint amount);
    event Extract(address indexed player, uint mode, uint amount);

    function initialize(address soulToken_, address timeBankNft_, address timeBankRate_, address a3dNft_) public initializer{
        __Divestor_init();
        soulToken = ISoulToken(soulToken_);
        timeBankNft = ISoul721(timeBankNft_);
        timeBankRate = ISoulTimeBankRate(timeBankRate_);
        a3dNft = a3dNft_;

        annualizedInfo[1] = Annualized({
            period: 90 days,
            rate: ACC * 20 / 100 / ONE_YEAR
        });

        annualizedInfo[2] = Annualized({
            period: 180 days,
            rate: ACC * 40 / 100 / ONE_YEAR
        });

        annualizedInfo[3] = Annualized({
           period: ONE_YEAR,
           rate: ACC * 60 / 100 / ONE_YEAR
        });
        isOpen = true;
    }

    function setIsOpen(bool b_) public onlyOwner {
        isOpen = b_;
    }

    function setContracts(address soulToken_, address timeBankNft_, address timeBankRate_, address a3dNft_) public onlyOwner{
        soulToken = ISoulToken(soulToken_);
        timeBankNft = ISoul721(timeBankNft_);
        timeBankRate = ISoulTimeBankRate(timeBankRate_);
        a3dNft = a3dNft_;
    }

    function setAnnualizedInfo(uint8 index_, uint period_, uint yearPercent_) public onlyOwner{
        annualizedInfo[index_] = Annualized({
            period: period_,
            rate: ACC * yearPercent_ / 100 / ONE_YEAR
        });
    }

    function setOperator(address operator_, bool status_) public onlyOwner {
        operators[operator_] = status_;
    }

    function deposit(uint8 mode_, uint amount_) public onlyOpen returns (uint){
        require(amount_ >= 10 * ACC, "More token needed");
        Annualized memory bankData = annualizedInfo[mode_];
        require(bankData.period > 0, "Invalid type");

        if(mode_ == 3){
            //需要解锁3dNft
            uint a3dNftCount = ISoul721(a3dNft).balanceOf(_msgSender());
            require(a3dNftCount > 0, "no have 3D nft");

            uint totalAmount = amount_;

            for(uint i=0; i < a3dNftCount; i++){
                uint a3DTokenId = ISoul721(a3dNft).tokenOfOwnerByIndex(_msgSender(), i);
                uint quota = a3dNftMor[a3DTokenId];
                if(quota == 500 * ACC) continue;

                if((500 * ACC - quota) > totalAmount){
                    //当前tokenId额度充足
                    a3dNftMor[a3DTokenId] += totalAmount;
                    totalAmount = 0;
                    break;
                }else{
                    totalAmount -= (500 * ACC - quota);
                    a3dNftMor[a3DTokenId] = 500 * ACC;
                    continue;
                }
            }
            require(totalAmount == 0, "deposit 3D nft amount err");
        }

        //计算利息剩余的soul是否满足被领取
        uint interAmount = soulToken.balanceOf(address(timeBankRate));
        //总利息
        uint reward = bankData.period * bankData.rate * amount_ / ACC;
        require(interAmount > timeBankInfo.totalRate && reward <= (interAmount - timeBankInfo.totalRate), "fixed deposit pause");

        soulToken.transferFrom(_msgSender(), address(this), amount_);

        uint tokenId = timeBankNft.mint(_msgSender());

        stakeInfo[tokenId] = StakeData({
            tokenId: tokenId,
            mode: mode_,
            amount: amount_,
            lastRewardTime: block.timestamp,
            deadline: block.timestamp + bankData.period,
            isFinished: false
        });

        timeBankInfo.totalRate += reward;        //可领取的总利息
        timeBankInfo.totalStake += 1;            //当前总质押人数
        timeBankInfo.totalStakeNum += amount_;   //当前总质押量
        timeBankInfo.curStake += 1;              //当前质押人数
        timeBankInfo.curStakeNum += amount_;     //当前质押量

        emit Deposit(_msgSender(), mode_, amount_);

        return tokenId;
    }

    function extract(uint tokenId_) public onlyOpen returns (bool){
        StakeData memory userStake = stakeInfo[tokenId_];
        require(!userStake.isFinished, "stake finished");
        require(block.timestamp > userStake.deadline, "deadline out reached");

        if(userStake.lastRewardTime < userStake.deadline){
            //还有利息没有领取
            timeBankRate.getReward(_msgSender(), tokenId_);
        }

        require(stakeInfo[tokenId_].lastRewardTime <= userStake.deadline, "error reward time");

        if(stakeInfo[tokenId_].mode == 3){
            uint a3dNftCount = ISoul721(a3dNft).balanceOf(_msgSender());
            require(a3dNftCount > 0, "no have 3D nft");

            uint totalAmount = userStake.amount;

            for(uint i=0; i < a3dNftCount; i++){
                uint a3DTokenId = ISoul721(a3dNft).tokenOfOwnerByIndex(_msgSender(), i);
                uint quota = a3dNftMor[a3DTokenId];    //当前有的额度

                if(quota == 0) continue;  //未使用的3dNft

                if(quota >= totalAmount){
                    a3dNftMor[a3DTokenId] -= totalAmount;
                    totalAmount = 0;
                    break;
                }else{
                    totalAmount -= quota;
                    a3dNftMor[a3DTokenId] = 0;
                    continue;
                }
            }

            require(totalAmount == 0, "extract 3D nft amount err");
        }



        timeBankNft.safeTransferFrom(_msgSender(), address(this), tokenId_);
        soulToken.transfer(_msgSender(), userStake.amount);
        stakeInfo[tokenId_].isFinished = true;

        timeBankInfo.curStake -= 1;
        timeBankInfo.curStakeNum -= userStake.amount;

        emit Extract(_msgSender(), tokenId_, userStake.amount);

        return true;
    }

    function setLastRewardTime(uint tokenId_, uint lastRewardTime_) public returns (bool){
        require(operators[_msgSender()], "unauthorized");
        stakeInfo[tokenId_].lastRewardTime = lastRewardTime_;
        return true;
    }

    function decrTotalRate(uint amount_) public {
        require(operators[_msgSender()], "unauthorized");
        timeBankInfo.totalRate -= amount_;
    }

    function incrPlayerRewarded(uint tokenId, uint amount_) public {
        require(operators[_msgSender()], "unauthorized");
        playerRewarded[tokenId] += amount_;
    }


    function setStakeInfo(uint tokenId_, uint8 mode_, uint amount_, uint lastRewardTime_, uint deadline_, bool isFinished_) public onlyOwner{
        stakeInfo[tokenId_].mode = mode_;
        stakeInfo[tokenId_].amount = amount_;
        stakeInfo[tokenId_].lastRewardTime = lastRewardTime_;
        stakeInfo[tokenId_].deadline = deadline_;
        stakeInfo[tokenId_].isFinished = isFinished_;
    }


}