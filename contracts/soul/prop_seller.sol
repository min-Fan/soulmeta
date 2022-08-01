// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../other/random_generator_upgradeable.sol";
import "../interface/I_soul_token.sol";
import "../interface/I_soul_controller.sol";
import "../interface/I_prop_1155.sol";
import "../interface/I_soul_team.sol";    //正式需删除此行


contract SoulmetaPropSeller is DivestorUpgradeable, RandomGeneratorUpgradeable, ERC1155HolderUpgradeable {
    using SafeERC20Upgradeable for ISoulToken;
    uint public DRAW_MAGIC_ID;    //道具的tokenId
    uint public U_ACC;


    struct ExternalAddrStruct {
        ISoulToken usdt;
        ISoulController soulController;
        ISoulToken soulToken;
        IProp1155 prop1155;
        address soulPair;
        address receiver;
    }

    ExternalAddrStruct public externalAddr;

    address public timeBank;

    struct PropPrice{
        uint tokenId;
        uint times;      //单个道具开启盲盒个数
        uint prices;     //定价
    }

    mapping(uint => PropPrice) public propEffect;

    ISoulTeam public soulTeam;    //正式需删除此行

    address public soulRouter;

    function initialize(address usdt_, address soulController_, address soulToken_, address prop1155_, address soulPair_, address receiver_) public initializer {
        __Divestor_init();
        externalAddr = ExternalAddrStruct({
        usdt : ISoulToken(usdt_),
        soulController : ISoulController(soulController_),
        soulToken : ISoulToken(soulToken_),
        prop1155 : IProp1155(prop1155_),
        soulPair : soulPair_,
        receiver : receiver_
        });
        U_ACC = 10 ** externalAddr.usdt.decimals();
        DRAW_MAGIC_ID = 1;
    }

    function setContracts(address soulController_, address soulToken_, address prop1155_, address soulPair_, address receiver_, address timeBank_, address soulRouter_) public onlyOwner {
        externalAddr.soulController = ISoulController(soulController_);
        externalAddr.soulToken = ISoulToken(soulToken_);
        externalAddr.prop1155 = IProp1155(prop1155_);
        externalAddr.soulPair = soulPair_;
        externalAddr.receiver = receiver_;
        timeBank = timeBank_;
        soulRouter = soulRouter_;
    }

    /*
     *  设置道具的ID
     **/
//    function setDrawMagicId(uint drawMagicId_) public onlyOwner {
//        DRAW_MAGIC_ID = drawMagicId_;
//    }

    function setPropEffect(uint tokenId_, uint times_, uint prices_) public onlyOwner{
        propEffect[tokenId_].tokenId = tokenId_;
        propEffect[tokenId_].times = times_;
        propEffect[tokenId_].prices = prices_;
    }

    /*
     *  购买道具
     *  propId: 1 - 100， 2 - 10， 3 - 50， 4 - 200， 5 - 500，6 - 1000
     **/
    function buyProp(address recommender_, uint propId_) public returns (bool){
//        revert();
        require(recommender_ != address(0) && recommender_ != _msgSender() && propEffect[propId_].tokenId != 0, "invalid param");
        //查询用户是否拥有
        //        uint count = externalAddr.prop1155.balanceOf(_msgSender(), DRAW_MAGIC_ID);
        //        require(count == 0, "Already owned");

        uint soulCount;
        uint b1 = externalAddr.soulToken.balanceOf(externalAddr.soulPair);
        uint b2 = externalAddr.usdt.balanceOf(externalAddr.soulPair) * 1 ether / U_ACC;
        if (b1 != 0 && b2 != 0) {
            uint uintPrice = (b2 * 1 gwei / b1);
            soulCount =  propEffect[propId_].prices * 1 gwei * 1 ether / uintPrice;
        } else {
            soulCount = 5 ether;
        }

        address receiver = externalAddr.soulController.teams(_msgSender());
        if (receiver != address(0)) {
            externalAddr.soulToken.transferFrom(_msgSender(), receiver, 10 * soulCount / 100);
        } else {
            externalAddr.soulToken.transferFrom(_msgSender(), externalAddr.receiver, 10 * soulCount / 100);
        }


        externalAddr.soulToken.transferFrom(_msgSender(), address(this), 10 * soulCount / 100);
        externalAddr.soulToken.transferFrom(_msgSender(), recommender_, 20 * soulCount / 100);
        externalAddr.soulToken.transferFrom(_msgSender(), timeBank, 35 * soulCount / 100);
        externalAddr.soulToken.burnFrom(_msgSender(), 25 * soulCount / 100);

        //发放道具
        externalAddr.prop1155.safeTransferFrom(address(this), _msgSender(), propId_, 1, '');

        return true;
    }


    /*
     *  批量开启
     **/
    function propBatchBox(uint8 theme_, uint8 group_, uint propId_, address recommender_) public returns (bool){
        uint count = externalAddr.prop1155.balanceOf(_msgSender(), propId_);
        require(count > 0, "Unauthorized");
        externalAddr.prop1155.burn(_msgSender(), propId_, 1);
        return ISoulController(soulRouter).drawBox(_msgSender(), theme_, group_, propEffect[propId_].times, recommender_);
    }


}