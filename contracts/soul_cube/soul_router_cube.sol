// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../other/random_generator_upgradeable.sol";
import "../interface/I_soul_1155.sol";
import "../interface/I_soul_721.sol";
import "../interface/I_soul_team.sol";
import "../interface/I_soul_token.sol";
import "../interface/I_soul_store.sol";
import "../interface/I_soul_bonus.sol";
import "../interface/I_soul_controller.sol";
import "../interface/I_soul_receive.sol";

contract SoulMetaRouterCube is DivestorUpgradeable, RandomGeneratorUpgradeable {
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;
    using CountersUpgradeable for CountersUpgradeable.Counter;
    IERC20MetadataUpgradeable public cUsdt;
    ISoulController public cSoulController;
    ISoulToken public cSoulToken;
    ISoul721 public cSoul721;
    ISoul1155 public cSoul1155;
    ISoulStore public cSoulStore;
    ISoulReceive public cSoulReceive;
    uint public U_ACC;
    address public a3dNft;
    address public aSoulPair;
    address public aSoulMinter;
    address public aReceiveAddr;        //默认推荐人
    bool public isOpenCast;             //是否开启铸造
    bool public isOpenExtract;          //是否开启抽取

    mapping(address => bool) public operators;
    mapping(uint => uint) public payCountRecord;

    function initialize(address[] calldata addrs_) public initializer {
        __Divestor_init();
        setContracts(addrs_, true, true);

        U_ACC = 10 ** cUsdt.decimals();
    }

    event Cast(address indexed player, address indexed recommender, uint amount, uint poolId);
    event Extract(address indexed player, address indexed recommender, uint indexed tokenId, uint poolId);


    function setContracts(address[] calldata addrs_ , bool isOpenCast_, bool isOpenExtract_) public onlyOwner {
        cUsdt = IERC20MetadataUpgradeable(addrs_[0]);
        cSoulController = ISoulController(addrs_[1]);
        cSoulToken = ISoulToken(addrs_[2]);
        cSoul721 = ISoul721(addrs_[3]);
        cSoul1155 = ISoul1155(addrs_[4]);
        cSoulStore = ISoulStore(addrs_[5]);
        cSoulReceive = ISoulReceive(addrs_[6]);
        a3dNft = addrs_[7];
        aSoulPair = addrs_[8];
        aSoulMinter = addrs_[9];
        aReceiveAddr = addrs_[10];
        isOpenExtract = isOpenExtract_;
        isOpenCast = isOpenCast_;
    }

    function setOperator(address operator_, bool status_) public onlyOwner {
        operators[operator_] = status_;
    }

    function setPayCountRecord(uint count_) public onlyOwner{
        uint time = block.timestamp/3600;
        payCountRecord[time-1] = count_;
    }

    function buildBox(uint8 theme_, uint8 group_, uint soulCount_, uint amount_, address recommender_) public {
        address player = _msgSender();
        require(isOpenCast, "not open");
        require(recommender_ != player, "not own addr");
        require(theme_ == 1 && (group_ == 1 || group_ == 2) && amount_ == 0, "inv param");
        require(soulCount_ <= 20 && soulCount_ % 5 == 0, "soul err");

        uint b1 = cSoulToken.balanceOf(aSoulPair);
        uint b2 = cUsdt.balanceOf(aSoulPair) * 1 ether / U_ACC;
        uint burn;
        uint poolId;
        if(amount_ == 0){
            //一键铸造
            cSoulController.referWalletDeduct(player, 4 * U_ACC);

            if (b1 != 0 && b2 != 0){
                uint uintPrice = (b2 * 1 gwei / b1);  //单价
                if(soulCount_ == 0){
                    burn = 6 gwei * 1 ether / uintPrice;
                }else if(soulCount_ == 5){
                    burn = 10 gwei * 1 ether / uintPrice;
                }else if(soulCount_ == 10){
                    burn = 15 gwei * 1 ether / uintPrice;
                }else if(soulCount_ == 15){
                    burn = 25 gwei * 1 ether / uintPrice;
                }else if(soulCount_ == 20){
                    burn = 50 gwei * 1 ether / uintPrice;
                }
            }else{
                if (soulCount_ == 0) {
                    burn = 1 ether;
                } else if (soulCount_ == 5) {
                    burn = 5 ether;
                } else if (soulCount_ == 10) {
                    burn = 10 ether;
                } else if (soulCount_ == 15) {
                    burn = 15 ether;
                } else if (soulCount_ == 20) {
                    burn = 20 ether;
                }
            }

            //一键铸造的数量
            amount_ = getBuildCount();


            //新池子  10111 - 10115
            poolId = getPoolId(theme_, group_, uint8(soulCount_ /5 + 11));

            cSoulController.divide(player, recommender_, address(0), 1);

        }else{
            //普通铸造
//            uint bCount = ISoul721(a3dNft).balanceOf(_msgSender());
//            require(bCount > 0, "no have 3D nft");

//            cSoulController.referWalletDeduct(player, amount_ * 4 * U_ACC);

//            if (b1 != 0 && b2 != 0){
//                uint uintPrice = (b2 * 1 gwei / b1);  //单价
//                if(soulCount_ == 0){
//                    burn = 6 gwei * 1 ether / uintPrice;
//                }else if(soulCount_ == 5){
//                    burn = 20 gwei * 1 ether / uintPrice;
//                }else if(soulCount_ == 10){
//                    burn = 50 gwei * 1 ether / uintPrice;
//                }else if(soulCount_ == 15){
//                    burn = 60 gwei * 1 ether / uintPrice;
//                }else if(soulCount_ == 20){
//                    burn = 100 gwei * 1 ether / uintPrice;
//                }
//            }else{
//                burn = 1 ether;
//            }
//            uint count = ISoul721(aSoulMinter).balanceOf(_msgSender());
//            if(count > 0)  soulCount_  = 45;
//            poolId = getPoolId(theme_, group_, uint8(soulCount_ / 5 + 1));
//
//            cSoulController.divide(player, recommender_, address(0), amount_);
//
//            amount_ = amount_ * 100;
        }

        cSoulToken.burnFrom(player, burn);

        uint tokenId = cSoulController.incrTokenId();
        cSoul721.mint(player, tokenId);
        cSoul1155.mint(address(cSoulStore), tokenId, amount_);

        cSoulStore.createBox(tokenId, amount_, poolId);
        emit Cast(player, recommender_, amount_, poolId);
    }


    function drawBox(address caller_, uint8 theme_, uint8 group_, uint amount_, address recommender_) public returns (bool){
        address player = operators[_msgSender()] ? caller_ : _msgSender();
        require(isOpenExtract, "not open");
        require(recommender_ != player, "not own addr");
        require(theme_ == 1 && (group_ == 1 || group_ == 2), "inv param");

        amount_ = operators[_msgSender()] ? amount_ : 1;

        cSoulController.referWalletDeduct(player, amount_ * 4 * U_ACC);

        uint s = 4.2 ether;
        uint b1 = cSoulToken.balanceOf(aSoulPair);
        uint b2 = cUsdt.balanceOf(aSoulPair) * 1 ether / U_ACC;
        if(b1 != 0 && b2 != 0 && (b2 * 1 gwei / b1 >= 4.2 gwei)) {
            s = 4.2 gwei * 1 ether / (b2 * 1 gwei / b1);
        }

        cSoulReceive.userAdd(player, s * amount_);

        uint time = block.timestamp / 3600;
        payCountRecord[time] = cSoulController.payCount() + amount_;

        cSoulController.addPayCount(amount_);

//        uint8 soulCount;
//        uint poolId;
//        uint[] memory ids;
//        uint[] memory counts;
//        for (uint8 i = 0; i < 2; i++) {
//            if (i == 0) {
//                soulCount = _getIndex();
//            } else {
//                soulCount = 1;
//            }
//            poolId = getPoolId(theme_, group_, soulCount);
//            (ids, counts) = cSoulStore.extractBoxBatch(poolId, amount_);
//            amount_ -= _extractAll(player, recommender_, ids, counts, poolId);
//            if (amount_ == 0) break;
//        }

        uint count = _distribute(player, theme_, group_, amount_, recommender_);
        require(count == 0, "quantity");
        return true;
    }

    function _distribute(address player, uint8 theme_, uint8 group_, uint amount_, address recommender_) private returns(uint){
        uint8 soulCount;
        uint poolId;
        uint[] memory ids;
        uint[] memory counts;

        uint random = randomCeil(1);   // 20% - 普通， 80% - 一键铸造
        uint targetCount = cSoulController._getTargetCount(amount_);
//        for(uint8 i = 0; i < 4; i++){
        for(uint8 i = 0; i < 3; i++){
            if(random == 5){
                if(i == 0){
                    soulCount = 10;
                }else if(i == 1){
                    soulCount = _getIndex();
                }else if(i == 2){
                    soulCount = 1;
                }else{
                    soulCount = 11;   //新池子，消耗最少soul的池子
                }
            }else{
                if(i == 2){
                    soulCount = 11;   //两次循环后，没开完，先取一键池子中，消耗最少soul的池子
                }else if(i == 3){
                    //直到最后都开完，直接去普通池子中，消耗最少soul都池子
                    soulCount = 1;
                }else{
                    soulCount = _getIndex() + 10;
                }
            }

            poolId = getPoolId(theme_, group_, soulCount);
            (ids, counts) = cSoulStore.extractBoxBatch(poolId, (targetCount != 0 && i == 0 && random == 1) ? targetCount : amount_);
            amount_ -= _extractAll(player, recommender_, ids, counts, poolId);
            if(amount_ == 0) break;
        }
        return amount_;
    }


    function getPoolId(uint8 theme_, uint8 group_, uint8 count) public pure returns (uint){
        return (theme_ * 10000) + (group_ * 100) + count;
    }

    function _getIndex() private returns (uint8){
        //获取1-100的随机数
        uint random = randomCeil(200);
        if (random > 100) {
            return 1;
        } else if (random > 60) {
            return 5;
        } else if (random > 30) {
            return 4;
        } else if (random > 10) {
            return 3;
        } else {
            return 2;
        }
    }

    function _extractAll(address caller_, address recommender_, uint[] memory tokenIds, uint[] memory amounts, uint poolId_) private returns (uint){
        uint rCount;
        for (uint i = 0; i < tokenIds.length; i++) {
            address caster = cSoul721.ownerOf(tokenIds[i]);
            if (caster == address(0)) {
                caster = aReceiveAddr;
            }
            cSoulController.divide(caller_, recommender_, caster, amounts[i]);
            cSoul1155.safeTransferFrom(address(cSoulStore), caller_, tokenIds[i], amounts[i], '');
            rCount += amounts[i];
            emit Extract(caller_, recommender_, tokenIds[i], poolId_);
        }
        return rCount;
    }

    function getBuildCount() public view returns (uint){
        uint openCount;
        uint time = block.timestamp/3600;

        if(payCountRecord[time - 1] == 0){
            //上一小时没人开
            openCount = 12;
        }else{
            uint count = cSoulController.payCount() - payCountRecord[time - 1];
            uint frequency = 3600 * count / (3600 + block.timestamp % 3600);   //  1/2 * count  < t <= count
            if(frequency <= 180){
                openCount = 12;
            }else{
                openCount = frequency/15;
            }
            if(frequency >= 750) openCount = 50;
        }
        return openCount;
    }

}