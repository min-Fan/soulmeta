// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../other/random_generator_upgradeable.sol";

interface ISoul3dNft{
    function ownerOf(uint256 tokenId) external view returns (address);
    function totalSupply() external view returns (uint);
}

contract SoulMetaSocialWelfare is DivestorUpgradeable, RandomGeneratorUpgradeable, ERC721HolderUpgradeable{
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;

    struct SContractAddr{
        IERC20MetadataUpgradeable usdt;
        ISoul3dNft a3dNft;
    }

    struct SWelfare{
        uint day;            //领取时间
        uint todayTotal;     //今日发放的总金额
        uint receiveTotal;   //剩余发放的总金额
        uint canClaim;       //合约开放到现在的总发放份额
        uint dayClaim;       //今日发放的份额
        uint userTotal;      //激活的用户总数
        uint validUser;      //有效人数
    }

    struct SUserData{
        uint receiveDay;       //领取的时间
        uint totalAmount;      //领取的总金额
        uint currentShare;     //当前份额
    }

    SContractAddr public contractAddr;
    SWelfare public welfareData;
    mapping(uint => SUserData) public userData;
    uint public percent;    //发放占比

    uint public socialTotal;   //前一天总发放

    uint public nowAmount;

    function initialize(address usdt_, address a3dNft_) public initializer{
        __Divestor_init();
        contractAddr.usdt = IERC20MetadataUpgradeable(usdt_);
        contractAddr.a3dNft = ISoul3dNft(a3dNft_);
        welfareData.day = block.timestamp / 86400;
        percent = 20;
    }

    function setContracts(address usdt_, address a3dNft_) public onlyOwner{
        contractAddr.a3dNft = ISoul3dNft(a3dNft_);
        contractAddr.usdt = IERC20MetadataUpgradeable(usdt_);
    }

    function setPercent(uint percent_) public onlyOwner {
        require(percent_ > 0 && percent_ <= 100, "value range error!");
        percent = percent_;
    }

    function setWelfareData(uint day, uint todayTotal, uint receiveTotal, uint canClaim, uint dayClaim, uint userTotal, uint validUser, uint socialTotal_) public onlyOwner{
        welfareData.day = day;
        welfareData.todayTotal = todayTotal;
        welfareData.receiveTotal = receiveTotal;
        welfareData.canClaim = canClaim;
        welfareData.dayClaim = dayClaim;
        welfareData.userTotal = userTotal;
        welfareData.validUser = validUser;
        socialTotal = socialTotal_;
    }

    function setUserData(uint tokenId, uint day,uint totalAmount, uint currentShare) public onlyOwner{
        userData[tokenId].receiveDay = day;
        userData[tokenId].totalAmount = totalAmount;
        userData[tokenId].currentShare = currentShare;
    }

    function addAmount(uint add_) public onlyOwner{
        nowAmount += add_;
    }

    function setCurrentShare(uint[] calldata tokenIds, uint current) public onlyOwner{
        uint today = block.timestamp / 86400;
        for(uint i = 0; i < tokenIds.length; i++){
            userData[tokenIds[i]].receiveDay = today;
            userData[tokenIds[i]].currentShare = current;
        }
    }

    function _setReceive() private{
        //当天
        uint sameDay = block.timestamp / 86400;
        if(welfareData.day != sameDay){
            //总发放金额
            socialTotal += welfareData.todayTotal;
            //数据不是当天的，需要更新
            uint todayReward = (nowAmount - socialTotal) * percent / 100;     //今日发放额度 = 当前总额度 - 发放总额
            welfareData.day = sameDay;
            welfareData.todayTotal = todayReward;
            welfareData.receiveTotal = todayReward;
            welfareData.canClaim += todayReward / welfareData.userTotal;
            welfareData.dayClaim = todayReward / welfareData.userTotal;
            welfareData.validUser = welfareData.userTotal;
        }
    }


   /*
    *  激活
    **/
    function activation(uint[] memory tokenIds_) public {
        _setReceive();
        uint activeCount;
        for(uint i=0; i < tokenIds_.length; i++){
            if(userData[tokenIds_[i]].receiveDay != 0){
                continue;
            }
            activeCount += 1;
            address player = contractAddr.a3dNft.ownerOf(tokenIds_[i]);
            require(player == _msgSender(), "not owned");

            //时间定为昨天
            userData[tokenIds_[i]].receiveDay = block.timestamp / 86400;
            //用户已经领取的份额
            userData[tokenIds_[i]].currentShare = welfareData.canClaim;
            welfareData.userTotal += 1;
        }
        require(activeCount > 0, "activated");
    }

    /*
     *  领取
     **/
    function userReceive(uint[] memory tokenIds) public {
        _setReceive();
        uint transAmount;
        for(uint i=0; i < tokenIds.length; i++) {
            address owner = contractAddr.a3dNft.ownerOf(tokenIds[i]);
            require(_msgSender() == owner, "not owned");
            if(userData[tokenIds[i]].receiveDay == welfareData.day || userData[tokenIds[i]].receiveDay == 0){
                continue;
            }
            //用户领取的份额 = 当前总份额 - 用户已经领取的份额
            uint amount = welfareData.canClaim - userData[tokenIds[i]].currentShare;
            //把用户已经领取的份额置为当前总份额
            userData[tokenIds[i]].currentShare = welfareData.canClaim;
            userData[tokenIds[i]].receiveDay = welfareData.day;
            userData[tokenIds[i]].totalAmount += amount;
            welfareData.receiveTotal -= welfareData.dayClaim;
            transAmount += amount;
        }
        require(transAmount != 0, "unable to claim");
        contractAddr.usdt.transfer(_msgSender(), transAmount);
    }

}