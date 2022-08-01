// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../other/divestor_upgradeable.sol";
import "../interface/I_soul_token.sol";
import "../interface/I_soul_finger_play_bonus.sol";

interface ISoul721{
    function balanceOf(address account_) external view returns(uint256);
}

contract SoulmetaFingerPlay is DivestorUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint MAX_ROOM_COUNT; // 最大房间数
    uint[3] BURN_COUNT_WEIGHT; // 销毁 鱼塘 时间银行

    // 用户数据
    struct RoomInfo {
        address addr1;
        address addr2;
        uint amount;
        uint pay;
    }

    address public serverAddr; // 服务器地址
    ISoulToken public soulTokenAddr;
    address public aFishPondBonus; // 质押鱼塘NFT分红池
    address public aTimeBank; // 时间银行

    // 房间号->UserInfo
    mapping(uint => RoomInfo) public roomIdToUserInfo;
    // 玩家在哪个房间中
    mapping(address => uint) public inRoomId;

    bool public isOpen; // 是否开始

    address public aSm3d; // 3dnft

    uint public gasFees; // gas 费用

    struct Currency {
        address token;  // token 代币地址
        uint min;   // 最小金额
        uint extract;   // 抽取入平台数量
    }

    // 支付方式 => Currency
    mapping(uint => Currency) public mapCurrency;

    event EnterRoom(uint indexed roomId, address indexed player, uint indexed enterType, uint amount, uint pay);
    event SettleGame(uint indexed roomId, address indexed winner, uint amount);

    function initialize(address serverAddr_, address soulToken_, address fishPondBonus_, address timeBank_) public initializer {
        __Divestor_init();

        serverAddr = serverAddr_;
        soulTokenAddr = ISoulToken(soulToken_);
        aFishPondBonus = fishPondBonus_;
        aTimeBank = timeBank_;

        BURN_COUNT_WEIGHT = [uint(3), 2, 5];
        MAX_ROOM_COUNT = 20;
    }

    function setMeta(address serverAddr_, address fishPondBonus_, address timeBank_, address aSm3d_, uint gasFress_, bool isOpen_) public onlyOwner {
        serverAddr = serverAddr_;
        gasFees = gasFress_;
        aFishPondBonus = fishPondBonus_;
        aTimeBank = timeBank_;
        aSm3d = aSm3d_;
        isOpen = isOpen_;
    }

    // 设置代币
    function setCurrencys(uint[] memory payIds_, address[] memory tokens_, uint[] memory mins_) public onlyOwner {
        require(payIds_.length == tokens_.length && tokens_.length == mins_.length, "len err");
        for (uint i = 0; i < payIds_.length; i++) {
            mapCurrency[payIds_[i]] = Currency({
                token: tokens_[i],
                min: mins_[i],
                extract: 0
            });
        }
    }

    // 进入房间
    // roomId_ : 进入的房间号  目前只有1-20
    // amount_ : 第一个用户设置的金额(单位：10的18次方)
    // position_ : 1左 2右
    // pay_ : 1 - BNB | 2 - soul | 3 - kaka | 4 - IZI | 5 - usdt | 6 - STI | 7 - FIST | 8 - GMT
    function enterRoom(uint roomId_, uint amount_, uint position_, uint pay_) public payable {
        require(isOpen, "not open");
        require(roomId_ > 0 && roomId_ <= MAX_ROOM_COUNT, "room id error");
        require(inRoomId[_msgSender()] == 0, "in room");
        require(position_ == 1 || position_ == 2, "position err");

        RoomInfo storage info = roomIdToUserInfo[roomId_];
        if (info.amount == 0) {
            info.amount = amount_;
            info.pay = pay_;
        }
        Currency memory currency = mapCurrency[info.pay];
        require(currency.min > 0, "pay err");
        require(amount_ >= currency.min, "amount error");

        if (position_ == 1) {
            require(info.addr1 == address(0), "has player");
            info.addr1 = _msgSender();
        } else {
            require(info.addr2 == address(0), "has player");
            info.addr2 = _msgSender();
        }
        inRoomId[_msgSender()] = roomId_;

        // gas
        if (info.pay == 1) {
            require(msg.value == info.amount + gasFees, "bnb err");
        } else {
            require(msg.value == gasFees, "gas bnb err");
            ISoulToken(currency.token).transferFrom(_msgSender(), address(this), info.amount);
        }
        payable(serverAddr).transfer(gasFees);

        emit EnterRoom(roomId_, _msgSender(), position_, info.amount, info.pay);
    }

    // 结算
    // roomId_ : 要结算的房间号
    // winner_ : 赢的用户地址
    function settleGame(uint roomId_, address winner_) public {
        require(isOpen, "not open");
        require(_msgSender() == serverAddr || _msgSender() == owner(), "no permission");

        RoomInfo storage info = roomIdToUserInfo[roomId_];
        require(info.addr1 != address(0) && info.addr2 != address(0), "settle error, not fill up");
        require(info.addr1 == winner_ || info.addr2 == winner_, "settle error, winner error");

        uint winCount;
        uint totalSoulCount = info.amount * 2;
        uint extractCount;
        if (info.pay == 2) {
            // Soul
            extractCount = totalSoulCount * 5 / 100; // 抽取

            if (aSm3d != address(0)) {
                if (ISoul721(aSm3d).balanceOf(info.addr2) == 0) {
                    extractCount += info.amount * 5 / 100;
                }
                if (ISoul721(aSm3d).balanceOf(info.addr1) == 0) {
                    extractCount += info.amount * 5 / 100;
                }
            }

            uint bonusSoulCount = totalSoulCount * 5 / 100; // 鱼塘
            uint timeBankSoulCount = totalSoulCount * 5 / 100; // 时间银行
            winCount = totalSoulCount - extractCount - bonusSoulCount - timeBankSoulCount;

            ISoulmetaFingerPlayBonus(aFishPondBonus).addBonus(bonusSoulCount);
            soulTokenAddr.transfer(aFishPondBonus, bonusSoulCount);
            soulTokenAddr.transfer(aTimeBank, timeBankSoulCount);
            soulTokenAddr.transfer(winner_, winCount);

        } else {
            extractCount = totalSoulCount * 1 / 10; // 抽取
            winCount = totalSoulCount - extractCount;
            
            mapCurrency[info.pay].extract += extractCount;
            if (info.pay != 1) {
                // 自定义代币
                ISoulToken(mapCurrency[info.pay].token).transfer(winner_, winCount);
            } else {
                // bnb
                payable(winner_).transfer(winCount);
            }
        }


        delete inRoomId[info.addr1];
        delete inRoomId[info.addr2];
        delete roomIdToUserInfo[roomId_];

        emit SettleGame(roomId_, winner_, winCount);
    }

    function extractionKaka(address wallet_, uint pay_) public onlyOwner {
        require(mapCurrency[pay_].extract != 0, "Insufficient balance");
        if (pay_ > 2) {
            ISoulToken(mapCurrency[pay_].token).transfer(wallet_, mapCurrency[pay_].extract);
        } else if (pay_ == 1) {
            payable(wallet_).transfer(mapCurrency[pay_].extract);
        }
        mapCurrency[pay_].extract = 0;
    }
}