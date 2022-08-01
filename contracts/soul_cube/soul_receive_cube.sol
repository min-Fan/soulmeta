// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/IERC20MetadataUpgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../interface/I_soul_token.sol";
import "../interface/I_soul_controller.sol";
import "../interface/I_soul_router.sol";

contract SoulmetaTokenReceiveCube is DivestorUpgradeable{
    bool onCube;
    using SafeERC20Upgradeable for IERC20MetadataUpgradeable;
    ISoulToken      public cSoulToken;
    ISoulController public cSoulController;
    ISoulRouter     public cSoulRouter;
    bool public isOpen;             //是否开启
    uint[7] public rate;

    struct UserData{
        uint total;
        uint amount;
        uint receiveTime;
    }
    mapping(address => UserData) public userReceive;
    mapping(address => bool) public operators;


    function initialize(address[] calldata addrs_) public initializer {
        __Divestor_init();
        setContracts(addrs_, true);
        rate = [8, 7, 6, 5, 4, 3, 2];
    }

    event Receive(address indexed player, uint amount);

    function setContracts(address[] calldata addrs_ , bool isOpen_) public onlyOwner {
        cSoulToken = ISoulToken(addrs_[0]);
        cSoulController = ISoulController(addrs_[1]);
        cSoulRouter = ISoulRouter(addrs_[2]);
        isOpen = isOpen_;
    }

    function setOperator(address operator_, bool status_) public onlyOwner {
        operators[operator_] = status_;
    }

    function setRate(uint index_, uint value_) public onlyOwner{
        rate[index_]= value_;
    }

    function userAdd(address user_,uint amount_) public {
        require(operators[_msgSender()], "unauthorized");
        userReceive[user_].total += amount_;
        userReceive[user_].amount += amount_;
    }

    function getRate() public view returns (uint){
        uint openCount;
        uint time = block.timestamp/3600;

        if(cSoulRouter.payCountRecord(time - 1) == 0){
            //上一小时
            openCount = 12;
        }else{
            uint count = cSoulController.payCount() - cSoulRouter.payCountRecord(time - 1);
            uint frequency = 3600 * count / (3600 + block.timestamp % 3600);
            if(frequency <= 180){
                openCount = 12;
            }else{
                openCount = frequency/15;
            }
            if(frequency >= 795) openCount = 53;
        }
        uint index = (openCount - 12)/6;

        return rate[index];
    }

    function soulReceive() public{
        require(isOpen, "not open");
        require(userReceive[_msgSender()].receiveTime != block.timestamp/3600, "user has received");
        require(userReceive[_msgSender()].amount > 0, "balance is 0");
        uint amount = getRate() * userReceive[_msgSender()].amount / 100;

        userReceive[_msgSender()].receiveTime = block.timestamp/3600;
        userReceive[_msgSender()].amount -= amount;
        cSoulToken.transferFrom(address(cSoulController), _msgSender(), amount);
        emit Receive(_msgSender(), amount);
    }

}