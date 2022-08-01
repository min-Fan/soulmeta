// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../other/random_generator_upgradeable.sol";
import "../interface/I_soul_token.sol";
import "../interface/I_soul_controller.sol";

contract SoulSetKnight is DivestorUpgradeable, RandomGeneratorUpgradeable, ERC1155HolderUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using CountersUpgradeable for CountersUpgradeable.Counter;

    struct ContractAddr{
        ISoulController soulCore;
        ISoulToken soulToken;
    }

    ContractAddr  public dataAddr;

    //项目结构体
    struct ProductStruct{
        bool isOpen;          //是否开启
        address tokenAddr;    //代币地址
        uint tokenVolume;     //发放数量
        uint fixedAmount;     //固定份数
        uint surplusAmount;   //剩余份数
        uint day;             //日期记录
        uint startTime;       //开始时间
        uint endTime;         //结束时间
    }

    mapping(uint => ProductStruct) public productMap;

    mapping(uint => mapping(address => uint)) public userReceiveDate;

    mapping(address => bool) public userReceiveSoul;

    bool public isOpen;

    event ReceiveProduct(address indexed player, address indexed communityAddr_, uint indexed productId);
    event SetTeamsFrom(address indexed player, address indexed communityAddr_);

    function initialize(address soulCore_, address soulToken_) public initializer {
        __Divestor_init();
        dataAddr = ContractAddr({
        soulCore: ISoulController(soulCore_),
        soulToken: ISoulToken(soulToken_)
        });
    }


    function setContracts(address soulCore_, address soulToken_, bool isOpen_) public onlyOwner {
        dataAddr.soulCore = ISoulController(soulCore_);
        dataAddr.soulToken = ISoulToken(soulToken_);
        isOpen = isOpen_;
    }

    function setProductMap(uint id_, bool isOpen_, address addr_, uint tokenVolume_, uint fixedAmount_, uint surplusAmount_, uint day_, uint startTime_, uint endTime_) public onlyOwner {
        productMap[id_].isOpen = isOpen_;
        productMap[id_].tokenAddr = addr_;
        productMap[id_].tokenVolume = tokenVolume_;
        productMap[id_].fixedAmount = fixedAmount_;
        productMap[id_].surplusAmount = surplusAmount_;
        productMap[id_].day = day_;
        productMap[id_].startTime = startTime_;
        productMap[id_].endTime = endTime_;
    }

    function setUserReceiveSoul(address addr_, bool isReceive_) public onlyOwner{
        userReceiveSoul[addr_] = isReceive_;
    }

    function setUserReceiveDate(uint productId_, address addr_, uint day_) public onlyOwner{
        userReceiveDate[productId_][addr_] = day_;
    }

    /*
     *  用户设置骑士
     **/
    function setTeamsFrom(address communityAddr_) public{
        require(isOpen, "not open");
        require(!userReceiveSoul[_msgSender()] && communityAddr_ != address(0) && communityAddr_ != _msgSender(), "recommender err");
        //判断是否有推荐关系
        address referAddr = dataAddr.soulCore.referrers(_msgSender());
        if(referAddr == address(0)){
            dataAddr.soulCore.setReferrersFrom(_msgSender(), communityAddr_);
            emit SetTeamsFrom(_msgSender(), communityAddr_);
        }
        dataAddr.soulToken.transfer(_msgSender(), 0.01 ether);
        userReceiveSoul[_msgSender()] = true;
    }


    /*
     *  项目领取
     **/
    function receiveProduct(address communityAddr_, uint productId_) public{
        require(isOpen, "not open");
        //查询用户soul
        uint amount = dataAddr.soulToken.balanceOf(_msgSender());
        uint day = block.timestamp/86400;
        uint nowTimestamp = block.timestamp% 86400;

        require(block.timestamp > productMap[productId_].startTime && block.timestamp < productMap[productId_].endTime && nowTimestamp > (productMap[productId_].startTime % 86400), "Not started");

        require(amount >= 1 ether && userReceiveDate[productId_][_msgSender()] != day, "Conditions not met");
        if(communityAddr_ == address(0)){

            if(productMap[productId_].day != day){
                productMap[productId_].day = day;
                productMap[productId_].surplusAmount = productMap[productId_].fixedAmount;
            }

            require(productMap[productId_].isOpen && productMap[productId_].surplusAmount > 0, "Insufficient remaining quantity");

            IERC20Upgradeable(productMap[productId_].tokenAddr).transfer(_msgSender(), productMap[productId_].tokenVolume);
            userReceiveDate[productId_][_msgSender()] = day;
            productMap[productId_].surplusAmount--;

            emit ReceiveProduct(_msgSender(), communityAddr_, productId_);
        }else{
            //针对有推荐关系的用户，没有领取过0.01SOUL通过这个方式得到最初的SOUL

            if(productMap[productId_].day != day){
                productMap[productId_].day = day;
                productMap[productId_].surplusAmount = productMap[productId_].fixedAmount;
            }

            require(productMap[productId_].isOpen && productMap[productId_].surplusAmount > 0, "Insufficient remaining quantity");

            IERC20Upgradeable(productMap[productId_].tokenAddr).transfer(_msgSender(), productMap[productId_].tokenVolume);
            userReceiveDate[productId_][_msgSender()] = day;
            productMap[productId_].surplusAmount--;

            emit ReceiveProduct(_msgSender(), communityAddr_, productId_);

            //判断是否有推荐关系
            address referAddr = dataAddr.soulCore.referrers(_msgSender());
            if(referAddr == address(0)){
                dataAddr.soulCore.setReferrersFrom(_msgSender(), communityAddr_);
            }
        }

    }



}