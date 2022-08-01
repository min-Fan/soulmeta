// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../other/random_generator_upgradeable.sol";
import "../interface/I_soul_token.sol";
import "../interface/I_soul_controller.sol";
import "../interface/I_soul_721.sol";


contract SoulmetaSellerProp is DivestorUpgradeable, RandomGeneratorUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;
    using SafeERC20Upgradeable for ISoulToken;
    struct ExternalAddrStruct {
        IERC20MetadataUpgradeable usdt;
        ISoulController soulController;
        ISoulToken soulToken;
        ISoul721  prop721;
        address soulPair;
        address receiver;
    }
    ExternalAddrStruct public externalAddr;

    CountersUpgradeable.Counter public DRAW_MAGIC_ID;
    uint public U_ACC;
    uint public propCount;

    mapping(uint => uint) public usageTimes;

    function initialize(address usdt_, address soulController_, address soulToken_, address prop721_, address soulPair_, address receiver_) public initializer {
        __Divestor_init();
        externalAddr = ExternalAddrStruct({
        usdt : IERC20MetadataUpgradeable(usdt_),
        soulController : ISoulController(soulController_),
        soulToken : ISoulToken(soulToken_),
        prop721 : ISoul721(prop721_),
        soulPair : soulPair_,
        receiver : receiver_
        });
        U_ACC = 10 ** externalAddr.usdt.decimals();
        propCount = 600;
    }

    function setContracts(address soulController_, address soulToken_, address prop721_, address soulPair_, address receiver_, uint propCount_) public onlyOwner {
        externalAddr.soulController = ISoulController(soulController_);
        externalAddr.soulToken = ISoulToken(soulToken_);
        externalAddr.prop721 = ISoul721(prop721_);
        externalAddr.soulPair = soulPair_;
        externalAddr.receiver = receiver_;
        propCount = propCount_;
    }

    function setPropTimes(uint tokenId_, uint amount_) public onlyOwner{
        usageTimes[tokenId_] = amount_;
    }


    /*
     *  给用户铸造道具
     **/
    function castProp(address user_, uint amount_) public onlyOwner {
        //tokenId
        DRAW_MAGIC_ID.increment();
        uint tokenId = DRAW_MAGIC_ID.current();
        usageTimes[tokenId] = amount_;
        externalAddr.prop721.mint(user_, tokenId);
    }

    /*
     *  购买道具
     **/
    function buyProp(address recommender_) public returns(bool){
        require(recommender_ != address(0) && recommender_ != _msgSender(),"invalid param");
        require(DRAW_MAGIC_ID.current() < propCount , "limit exceeded");
        //查询用户是否拥有
        uint count = externalAddr.prop721.balanceOf(_msgSender());
        for(uint i=0; i < count; i++){
            uint hasTokenId = externalAddr.prop721.tokenOfOwnerByIndex(_msgSender(), i);
            require(usageTimes[hasTokenId] == 0, "you already have usable props");
        }

        uint soulCount;
        uint b1 = externalAddr.soulToken.balanceOf(externalAddr.soulPair);
        uint b2 = externalAddr.usdt.balanceOf(externalAddr.soulPair) * 1 ether / U_ACC;
        if(b1 != 0 && b2 != 0){
            uint uintPrice = (b2 * 1 gwei / b1);
            soulCount = 200 gwei * 1 ether / uintPrice;
        }else{
            soulCount = 25 ether;
        }
        address receiver = externalAddr.soulController.teams(_msgSender());
        if(receiver != address(0)){
            externalAddr.soulToken.transferFrom(_msgSender(), receiver, 5 * soulCount / 100);
        }else{
            externalAddr.soulToken.transferFrom(_msgSender(),externalAddr.receiver, 5 * soulCount / 100);
        }
        externalAddr.soulToken.transferFrom(_msgSender(), address(this), 5 * soulCount / 100);
        externalAddr.soulToken.transferFrom(_msgSender(), recommender_, 2 * soulCount / 10);
        externalAddr.soulToken.burnFrom(_msgSender(), 7 * soulCount / 10);

        //发放道具
        DRAW_MAGIC_ID.increment();
        uint tokenId = DRAW_MAGIC_ID.current();
        usageTimes[tokenId] = 1000;
        externalAddr.prop721.mint(_msgSender(), tokenId);
        return true;
    }


    /*
     *  批量开启
     **/
    function propBatchBox(uint8 theme_, uint8 group_, uint amount_, address recommender_) public returns (bool){
        require(amount_ <= 1000 && amount_%100 == 0, "Unauthorized");
        uint hasCount;
        uint openCount = amount_;
        //查询用户是否拥有
        uint count = externalAddr.prop721.balanceOf(_msgSender());
        for(uint i=0; i < count; i++){
            uint tokenId = externalAddr.prop721.tokenOfOwnerByIndex(_msgSender(), i);
            if(usageTimes[tokenId] > 0 ){
                hasCount += usageTimes[tokenId];
                if(usageTimes[tokenId] >= openCount){
                    //减去所需数量
                    usageTimes[tokenId] -= openCount;
                }else{
                    //减少所有份额
                    openCount -= usageTimes[tokenId];
                    usageTimes[tokenId] = 0;
                }
                if(hasCount >= amount_) break;
            }
        }

        require(hasCount >= amount_,"insufficient quantity");
        return externalAddr.soulController.drawBox(_msgSender(), theme_, group_, amount_, recommender_);
    }


}