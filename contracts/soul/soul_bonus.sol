// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../other/divestor_upgradeable.sol";
import "../interface/I_soul_1155.sol";
import "../interface/I_soul_token.sol";
import "../interface/I_soul_controller.sol";

contract SoulmetaBonus is DivestorUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    uint POSITIVE; // 好评
    uint NEGATIVE; // 差评

    uint INPUT_TYPE_SOUL; // 投入soul
    uint INPUT_TYPE_NFT;  // 投入nft
    uint INPUT_TYPE_LP;   // 质押lp

    uint DAY; // 天

    // 分红权重
    uint[3] weightBonus;

    struct AddrCollection {
        IERC20Upgradeable usdtAddr;
        IERC20Upgradeable lpAddr;
        ISoulToken soulTokenAddr;
        ISoul1155 soul1155Addr;
        address soulControllerAddr;
        IERC20Upgradeable oldLpAddr;
    }

    // 评价数
    struct Appraise {
        uint positive;
        uint negative;
    }

    // 用户数据
    struct UserInfo {
        uint soul;
        uint nft;
        uint lp;

        uint accumulate; // 累计可领 >= cumulative
        uint cumulative; // 累计已领

        uint firstDay; // 第一天参与
        uint lastSettleDay; // 上一次结算日

        uint oldLp;
        bool isChangeLp;
    }

    // 每日数据
    struct DayTokenTotal {
        uint soul;
        uint nft;
        uint lp;
    }

    AddrCollection public addr;

    // tokenId -> 好评差评
    mapping(uint => Appraise) public appraise;
    // 每日 -> 用户 -> 销毁soul、销毁NFT、质押lp
    mapping(uint => mapping(address => DayTokenTotal)) public dayToDayToken;
    // 每日总量
    mapping(uint => DayTokenTotal) public totalDayToken;
    // 每日池子进账
    mapping(uint => uint) public bonusPool;
    // 用户总量数据
    mapping(address => UserInfo) public userInfos;
    // 开关
    bool public isOpen;
    // 上一次结算日
    uint public lastSettleDay;

    // 是否改变了lp地址
    IERC20Upgradeable public oldLpAddr;
    bool public isChangeLpAddr;

    event Input(address indexed player, uint indexed day, uint indexed inputType, uint amount);
    event ReceiveBonus(address indexed player, uint count);


     function initialize(address usdtAddr_, address soul1155_, address soulToken_, address lpAddr_, address soulController_, address newLpAddr_) public initializer {
         __Divestor_init();
         addr = AddrCollection({
         usdtAddr : IERC20Upgradeable(usdtAddr_),
         soul1155Addr : ISoul1155(soul1155_),
         soulTokenAddr : ISoulToken(soulToken_),
         lpAddr : IERC20Upgradeable(lpAddr_),
         soulControllerAddr : soulController_,
         oldLpAddr : IERC20Upgradeable(newLpAddr_)
         });

         weightBonus = [uint(30), 30, 40];
         POSITIVE = 1;
         // 好评
         NEGATIVE = 2;
         // 差评

         INPUT_TYPE_SOUL = 1;
         // 投入soul
         INPUT_TYPE_NFT = 2;
         // 投入nft
         INPUT_TYPE_LP = 3;
         // 质押lp

         DAY = 1 days;
         // 天
     }

    function setMeta(address usdtAddr_, address soul1155_, address soulToken_, address lpAddr_, address soulController_, address newLpAddr_, bool isOpen_) public onlyOwner {
        addr = AddrCollection({
        usdtAddr : IERC20Upgradeable(usdtAddr_),
        soul1155Addr : ISoul1155(soul1155_),
        soulTokenAddr : ISoulToken(soulToken_),
        lpAddr : IERC20Upgradeable(lpAddr_),
        soulControllerAddr : soulController_,
        oldLpAddr: IERC20Upgradeable(lpAddr_)
        });
//        oldLpAddr = IERC20Upgradeable(newLpAddr_);
        isOpen = isOpen_;
    }

    // 代币进入记录
    function addBonus(uint time_, uint add_) public {
        require(_msgSender() == addr.soulControllerAddr || _msgSender() == owner(), "owner err");
        require(add_ > 0, "inv param");
        if (time_ > block.timestamp) {
            bonusPool[time_ / DAY] += add_;
        } else {
            bonusPool[block.timestamp / DAY] += add_;
        }
    }

    // 获取当前天
    function _getSameDay() private returns (uint) {
        uint tempQuotient = block.timestamp / DAY;

        UserInfo storage userInfo = userInfos[_msgSender()];
        if (userInfo.firstDay == 0) {
            userInfo.firstDay = tempQuotient;
        }

        uint from = 19135;
        uint day = 19141;
        uint changeLpDay = 19153;

        if (lastSettleDay != tempQuotient) {

            if (tempQuotient >= day) {
                for (uint i = lastSettleDay + 1; i <= tempQuotient; i++) {
                    totalDayToken[i].soul += totalDayToken[i - 1].soul;
                    totalDayToken[i].nft += totalDayToken[i - 1].nft;
                    totalDayToken[i].lp += totalDayToken[i - 1].lp;
                }
            }

            if (tempQuotient >= changeLpDay && !isChangeLpAddr) {
                isChangeLpAddr = true;
                IERC20Upgradeable temp = addr.lpAddr;
                addr.lpAddr = IERC20Upgradeable(oldLpAddr);
                oldLpAddr = IERC20Upgradeable(temp);
                totalDayToken[tempQuotient].lp = 0;
            }

            lastSettleDay = tempQuotient;
        }

        if (tempQuotient != userInfo.lastSettleDay) {// 不是当天

            if (tempQuotient >= day) {
                if (userInfo.lastSettleDay >= day) {// tempQuotient > day
                    for (uint i = userInfo.lastSettleDay + 1; i <= tempQuotient; i++) {
                        dayToDayToken[i][_msgSender()].soul += dayToDayToken[i - 1][_msgSender()].soul;
                        dayToDayToken[i][_msgSender()].nft += dayToDayToken[i - 1][_msgSender()].nft;
                        dayToDayToken[i][_msgSender()].lp += dayToDayToken[i - 1][_msgSender()].lp;
                    }
                } else if (userInfo.lastSettleDay < day) {// tempQuotient >= day
                    for (uint i = from; i <= day - 1; i++) {
                        dayToDayToken[day][_msgSender()].soul += dayToDayToken[i][_msgSender()].soul;
                        dayToDayToken[day][_msgSender()].nft += dayToDayToken[i][_msgSender()].nft;
                    }
                    dayToDayToken[day][_msgSender()].lp += userInfos[_msgSender()].lp;

                    if (tempQuotient > day) {
                        for (uint i = day + 1; i <= tempQuotient; i++) {
                            dayToDayToken[i][_msgSender()].soul += dayToDayToken[i - 1][_msgSender()].soul;
                            dayToDayToken[i][_msgSender()].nft += dayToDayToken[i - 1][_msgSender()].nft;
                            dayToDayToken[i][_msgSender()].lp += dayToDayToken[i - 1][_msgSender()].lp;
                        }
                    }
                }
            }

            if (tempQuotient >= changeLpDay && !userInfo.isChangeLp) {
                userInfo.isChangeLp = true;

                for (uint i = changeLpDay; i <= tempQuotient; i++) {
                    dayToDayToken[i][_msgSender()].lp = 0;
                }

                userInfo.oldLp = userInfo.lp;
                userInfo.lp = 0;
            }

            _settleDay(userInfo.lastSettleDay, tempQuotient);
            // 结算
            userInfo.lastSettleDay = tempQuotient;
        }

        return tempQuotient;
    }

//    function fixData() public onlyOwner returns (bool) {
//        uint bigDay = 19141;
//        address[5] memory specialAddresses = [0xF2A8b59bD99AaE42ABea48D84a7d969846807541, 0x6Eb183BDf8cA3ed0df74183628c2fA705859F530, 0xF87c0ff7748B08d0f94852eD4F0242b2047C5B36, 0x97215EC37b651651872772290672D594417fb23B, 0x16278301EA50584e11a12b8E5CA95d022cb1a09e];
//
//        for (uint i = 0; i < specialAddresses.length; i++) {
//            address myAddr = specialAddresses[i];
//            dayToDayToken[bigDay][myAddr].lp = userInfos[myAddr].lp;
//        }
//        totalDayToken[bigDay].lp = addr.lpAddr.balanceOf(address(this));
//        return true;
//    }


    // 结算
    function _settleDay(uint fromDay_, uint toDay_) private {
        uint notGet = _searchUserBonus(_msgSender(), fromDay_, toDay_);
        userInfos[_msgSender()].accumulate += notGet;
    }

    // 用户查询分红
    function _searchUserBonus(address player_, uint fromDay_, uint toDay_) view private returns (uint) {
        uint total;

        UserInfo storage userInfo = userInfos[player_];
        if (fromDay_ < userInfo.firstDay) {
            fromDay_ = userInfo.firstDay;
        }

        for (uint i = fromDay_; i < toDay_; i++) {
            uint bonus = bonusPool[i];

            if (bonus <= 0) {
                continue;
            }

            DayTokenTotal storage dayToken = dayToDayToken[i][player_];
            DayTokenTotal storage totalToken = totalDayToken[i];

            if (totalToken.nft > 0) {
                total += dayToken.nft * (bonus * weightBonus[0] / 100) / totalToken.nft;
            }

            if (totalToken.soul > 0) {
                total += dayToken.soul * (bonus * weightBonus[1] / 100) / totalToken.soul;
            }

            if (totalToken.lp > 0) {
                total += dayToken.lp * (bonus * weightBonus[2] / 100) / totalToken.lp;
            }
        }

        return total;
    }

//    // 投入soul
//    function inputSoulApi(uint soulCount_) public {
//        require(isOpen, "not open");
//        require(soulCount_ > 0, "inv param");
//
//        uint sameDay = _getSameDay();
//        DayTokenTotal storage dayToken = dayToDayToken[sameDay][_msgSender()];
//
//        dayToken.soul += soulCount_;
//        totalDayToken[sameDay].soul += soulCount_;
//
//        // 用户总量
//        userInfos[_msgSender()].soul += soulCount_;
//
//        addr.soulTokenAddr.burnFrom(_msgSender(), soulCount_);
//        emit Input(_msgSender(), sameDay, INPUT_TYPE_SOUL, soulCount_);
//    }
//
//    // 投入NFT(好评/差评)
//    // type == 1 好评 type == 2 差评
//    function inputNftApi(uint8 type_, uint[] memory tokenIds) public {
//        require(isOpen, "not open");
//        require(type_ == POSITIVE || type_ == NEGATIVE, "type err");
//
//        for (uint i = 0; i < tokenIds.length; i ++) {
//            if (type_ == POSITIVE) {
//                appraise[tokenIds[i]].positive ++;
//            } else {
//                appraise[tokenIds[i]].negative ++;
//            }
//        }
//
//        uint sameDay = _getSameDay();
//        DayTokenTotal storage dayToken = dayToDayToken[sameDay][_msgSender()];
//        dayToken.nft += tokenIds.length;
//        totalDayToken[sameDay].nft += tokenIds.length;
//
//        // 用户总量
//        userInfos[_msgSender()].nft += tokenIds.length;
//
//        for (uint i = 0; i < tokenIds.length; i ++) {
//            addr.soul1155Addr.burn(_msgSender(), tokenIds[i], 1);
//        }
//        emit Input(_msgSender(), sameDay, INPUT_TYPE_NFT, tokenIds.length);
//    }
//
//    // 质押lp
//    function inputTokenApi(uint amount_) public {
//        require(isOpen, "not open");
//        require(amount_ > 0, "amount err");
//
//        uint sameDay = _getSameDay();
//        DayTokenTotal storage dayToken = dayToDayToken[sameDay][_msgSender()];
//        dayToken.lp += amount_;
//        totalDayToken[sameDay].lp += amount_;
//
//        // 用户总量
//        userInfos[_msgSender()].lp += amount_;
//
//        addr.lpAddr.safeTransferFrom(_msgSender(), address(this), amount_);
//        emit Input(_msgSender(), sameDay, INPUT_TYPE_LP, amount_);
//    }
//
//    // 取回lp
//    function receiveTokenApi() public {
//        require(isOpen, "not open");
//        uint sameDay = _getSameDay();
//
//        UserInfo storage userInfo = userInfos[_msgSender()];
//        uint lp = userInfos[_msgSender()].lp;
//
//        require(lp > 0, "not lp");
//
//        userInfo.lp -= lp;
//        dayToDayToken[sameDay][_msgSender()].lp -= lp;
//        totalDayToken[sameDay].lp -= lp;
//        addr.lpAddr.safeTransfer(_msgSender(), lp);
//    }

    // 领取分红
    function getUserBonusApi() public {
        require(isOpen, "not open");

        _getSameDay();

        UserInfo storage userInfo = userInfos[_msgSender()];
        uint accumulate = userInfo.accumulate - userInfo.cumulative;

        require(accumulate > 0, "not coin err");

        userInfo.cumulative = userInfo.accumulate;
        addr.usdtAddr.safeTransfer(_msgSender(), accumulate);
        emit ReceiveBonus(_msgSender(), accumulate);
    }

    // 领取旧LP质押
    function receiveOldLp() public {
        require(isOpen, "not open");

        _getSameDay();

        require(isChangeLpAddr, "not open change");

        UserInfo storage userInfo = userInfos[_msgSender()];
        uint oldLp = userInfo.oldLp;

        require(oldLp > 0, "not lp");

        userInfo.oldLp = 0;
        oldLpAddr.safeTransfer(_msgSender(), oldLp);
    }

    // 查询数据
    function searchUserBonusApi(address player_) view public returns (UserInfo memory, DayTokenTotal memory, uint, uint) {
        return userInfos[player_].lastSettleDay >= 19141 ? _todayHasSettle(player_) : _todayHasNoSettle(player_);
    }

    function _todayHasNoSettle(address player_) view private returns (UserInfo memory, DayTokenTotal memory, uint, uint) {
        UserInfo memory userInfo = userInfos[player_];
        uint lastSettleDay_ = userInfo.lastSettleDay;
        uint tempQuotient = block.timestamp / DAY;

        uint from = 19135;
        uint day = 19141;

        uint count = tempQuotient - from + 1; // 数组大小

        uint notGet; // 分红

        DayTokenTotal[] memory total = new DayTokenTotal[](count);
        DayTokenTotal[] memory one = new DayTokenTotal[](count);

        if (userInfo.firstDay != 0) {
            if (lastSettleDay_ < userInfo.firstDay) {
                lastSettleDay_ = userInfo.firstDay;
            }   

            // 栈太深
            (total, one) = _getSettleData(player_, count, from, day, lastSettleDay_);

            for (uint i = 0; i < count - 1; i++) {
                uint bonus = bonusPool[i+from];

                if (bonus <= 0) {
                    continue;
                }

                if (total[i].nft > 0) {
                    notGet += one[i].nft * (bonus * weightBonus[0] / 100) / total[i].nft;
                }

                if (total[i].soul > 0) {
                    notGet += one[i].soul * (bonus * weightBonus[1] / 100) / total[i].soul;
                }

                if (total[i].lp > 0) {
                    notGet += one[i].lp * (bonus * weightBonus[2] / 100) / total[i].lp;
                }
            }
        }

        DayTokenTotal memory pastDay1 = one[tempQuotient - 1 - from];

        UserInfo memory returnUserinfo = UserInfo(
            pastDay1.soul,
            pastDay1.nft,
            pastDay1.lp,
            userInfo.accumulate - userInfo.cumulative + notGet,
            userInfo.cumulative,
            0,
            0,
            0,
            false
        );

        return (returnUserinfo, total[tempQuotient - 1 - from], bonusPool[tempQuotient - 1], userInfo.lp);
    }

    function _todayHasSettle(address player_) view private returns (UserInfo memory, DayTokenTotal memory, uint, uint) {
        UserInfo memory userinfo = userInfos[player_];
        uint lastSettleDay_ = userinfo.lastSettleDay;
        uint tempQuotient = block.timestamp / DAY;

        uint count = tempQuotient - lastSettleDay_ + 1;

        uint notGet; // 分红

        DayTokenTotal[] memory total = new DayTokenTotal[](count);
        DayTokenTotal[] memory one = new DayTokenTotal[](count);

        for (uint i = 0; i < count; i++) {
            total[i] = totalDayToken[lastSettleDay_ + i];
            one[i] = dayToDayToken[lastSettleDay_ + i][player_];
        }

        for (uint i = 1; i < count; i++) {
            one[i] = one[i-1];
        }

        for (uint i = 0; i < count - 1; i++) {
            uint bonus = bonusPool[i+lastSettleDay_];

            if (bonus <= 0) {
                continue;
            }

            if (total[i].nft > 0) {
                notGet += one[i].nft * (bonus * weightBonus[0] / 100) / total[i].nft;
            }

            if (total[i].soul > 0) {
                notGet += one[i].soul * (bonus * weightBonus[1] / 100) / total[i].soul;
            }

            if (total[i].lp > 0) {
                notGet += one[i].lp * (bonus * weightBonus[2] / 100) / total[i].lp;
            }
        }

        DayTokenTotal memory pastDay = dayToDayToken[tempQuotient - 1][player_];

        UserInfo memory returnUserinfo = UserInfo(
            pastDay.soul,
            pastDay.nft,
            pastDay.lp,
            userinfo.accumulate - userinfo.cumulative + notGet,
            userinfo.cumulative,
            0,
            0,
            0,
            false
        );

        return (returnUserinfo, totalDayToken[tempQuotient - 1], bonusPool[tempQuotient - 1], userinfo.lp);
    }

    function _getSettleData(address player_, uint count, uint firstDay, uint day, uint lastSettleDay_) view private returns(DayTokenTotal[] memory, DayTokenTotal[] memory) {
        DayTokenTotal[] memory total = new DayTokenTotal[](count);
        DayTokenTotal[] memory one = new DayTokenTotal[](count);
        for (uint i = 0; i < count; i++) {
            total[i] = totalDayToken[firstDay + i];
            one[i] = dayToDayToken[firstDay + i][player_];
        }

        if (lastSettleDay_ >= day) {
            for (uint i = lastSettleDay_ - firstDay + 1; i < count; i++) {
                one[i] = one[i-1];
            }
        } else if (lastSettleDay_ < day) {
            for (uint i = 0; i < day - firstDay; i++) {
                one[day-firstDay].soul += one[i].soul;
                one[day-firstDay].nft += one[i].nft;
                one[day-firstDay].lp += one[i].lp;
            }
            for (uint i = day - firstDay; i < count; i++) {
                one[i] = one[day-firstDay];
            }
        }

        return (total, one);
    }

    // function setUserData(address player, uint soul, uint nft, uint lp, uint accumulate, uint cumulative, uint firstDay, uint lastSettleDay, uint oldLp, bool isChangeLp) public {
    //     UserInfo storage userInfo = userInfos[player];
    //     userInfo.soul = soul;
    //     userInfo.nft = nft;
    //     userInfo.lp = lp;
    //     userInfo.accumulate = accumulate;
    //     userInfo.cumulative = cumulative;
    //     userInfo.firstDay = firstDay;
    //     userInfo.lastSettleDay = lastSettleDay;
    //     userInfo.oldLp = oldLp;
    //     userInfo.isChangeLp = isChangeLp;
    // }

    // function setUserDayData(uint day, address player, uint soul, uint nft, uint lp) public {
    //     dayToDayToken[day][player].soul = soul;
    //     dayToDayToken[day][player].nft = nft;
    //     dayToDayToken[day][player].lp = lp;
    // }

    // function setTotalDayData(uint day, uint soul, uint nft, uint lp) public {
    //     totalDayToken[day].soul = soul;
    //     totalDayToken[day].nft = nft;
    //     totalDayToken[day].lp = lp;
    // }
}