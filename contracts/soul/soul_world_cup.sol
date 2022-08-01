// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interface/I_soul_token.sol";
import "../other/divestor_upgradeable.sol";

interface IWorldCupConsumer {
    function setRequestConfirmations(uint16 requestConfirmations_) external;
    function rollDice(string memory roller_) external returns (uint requestId);
    function getRandom(string memory roller_) external view returns (uint[] memory);
}

interface IWorldCupViewer {
    function getTeam() external view returns(uint, uint);
}

contract WorldCup is DivestorUpgradeable {
    // using SafeERC20Upgradeable for IERC20Upgradeable;
    using StringsUpgradeable for uint;

    ISoulToken soulToken;                       // soul token 合约地址
    IWorldCupConsumer random;                   // 随机数消费者合约

    address public randomAddr;                  // 随机数消费在合约地址
    uint public startTime;                      // 开始时间
    uint public endTime;                        // 结束时间
    uint public competitionType;                // 比赛类型
    uint public matchId;                        // 比赛索引
    uint public championIndex;                  // 冠军池周期索引
    uint public walletAmount;                   // 无赢家可取出代币数量

    struct ChampionInfo {
        uint startTime;
        uint endTime;
        // bool status;
        uint competitionType;
        uint matchId;
        uint championIndex;
    }

    struct Match {
        string roller;               // 比赛骰子id
        uint team1;                  // 队伍1
        uint team2;                  // 队伍2
        uint startTim;               // 开始时间
        uint endTim;                 // 结束时间
    }

    // 即时奖金玩家
    struct Instant {
        address player;
        uint initAmount;
        uint amount;
        uint leverageAmount;
        uint team;
        uint matchId;
    }

    struct Champion {
        uint ssoulAmount;
        uint championIndex;
    }

    // 即时奖金池
    struct InstantPool {
        uint total;
        uint team1Amount;
        uint team2Amount;
        uint ssoulAmount;
    }

    // 冠军池总量 - 积分
    struct ChampionPool {
        uint soulAmount;               // soul 总量
        uint ssoulAmount;              // ssoul 积分
    }

    // 玩家收益信息
    struct PlayerEarningInfo {
        uint leverage;                 // 杠杆
        uint instantEarnings;          // 即时收益
        uint principal;                // 参与的本金
        uint principaled;              // 已领回参与的本金
        uint instantEarningsed;        // 已领即时收益
        uint ssoulAmount;              // ssoul 积分
        uint destroySsoul;             // 需销毁的 ssoul
        uint championEarnings;         // 冠军收益
        uint championEarningsed;       // 已领取冠军收益
    }
    // 销毁
    struct BurnTotal {
        uint soulAmount;
        uint ssoulAmount;
    }

    // 场次id => 场次数据
    mapping(uint => Match) public mapMatch;   // 比赛场次
    // 场次id => 即时奖金玩家数据
    //    mapping(uint => mapping(address => Instant)) public mapInstant; // 即时奖金
    // 场次id => 即时奖金总量
    mapping(uint => InstantPool) public mapInstantTotal; // 即时奖金总池
    // 周期id => 当天冠军奖金总量
    mapping(uint => ChampionPool) public mapChampionTotal; // 冠军奖金 soul 总量
    // 周期id => 当天销毁soul ssoul 数量 
    mapping(uint => BurnTotal) public mapBurnTotal; // 销毁总量
    // 玩家信息
    mapping(address => PlayerEarningInfo) public mapPlayerInfo;
    // 玩家参与场次数据
    mapping(address => Instant[]) public mapPlayerRecord;
    // 玩家参与过的冠军赛 id
    mapping(address => Champion[]) public mapPlayerChampion;

    address public banker;

    IWorldCupViewer viewer;    // viewer 合约

    event Open(string indexed roller, uint indexed competitionType, uint indexed matchId);

    function initialize(address soul_, address randomConsumer_) public initializer {
        __Divestor_init();
        soulToken = ISoulToken(soul_);
        randomAddr = randomConsumer_;
        random = IWorldCupConsumer(randomConsumer_);
    }

    function setMeta(uint start_, uint end_, uint16 delay_) public onlyOwner {
        startTime = start_;
        endTime = end_;
        random.setRequestConfirmations(delay_);
    }

    // 测试需
    // function setMatchId(uint championId_, uint matchId_) public onlyOwner {
    //     championIndex = championId_;
    //     matchId = matchId_;
    // }

    function setContract(address banker_, address consumer_, address viewer_) public onlyOwner {
        random = IWorldCupConsumer(consumer_);
        viewer = IWorldCupViewer(viewer_);
        banker = banker_;
    }

    function getWallet() public onlyOwner {
        soulToken.transfer(_msgSender(), walletAmount);
        walletAmount = 0;
    }

    // 开启一场比赛
    function openCompetition() public {
        require(_msgSender() == banker || _msgSender() == owner(), "Opr Err");

        uint nowTimestamp = block.timestamp % 1 days;

        require(block.timestamp > startTime && block.timestamp < endTime && nowTimestamp > (startTime % 1 days), "openCompetition: Not_at_game_time");

        // 生产需
        uint[] memory randomNums;
        if (matchId % 127 >= 1) {
            // 判断当前是否有比赛
            randomNums = random.getRandom(mapMatch[matchId].roller);
            // 判断上一场是否无赢家
            if (randomNums[0] > randomNums[1] && mapInstantTotal[matchId].team1Amount == 0) {
                walletAmount += mapInstantTotal[matchId].team2Amount;
            } else if (randomNums[0] < randomNums[1] && mapInstantTotal[matchId].team2Amount == 0) {
                walletAmount += mapInstantTotal[matchId].team1Amount;
            }
        }

        // 开启一场
        matchId += 1;
        // 开启一天比赛周期
        if (matchId % 127 == 1) {
            championIndex += 1;
        }
        
        // 比赛周期 - 127 场比赛
        if (matchId % 127 <= 64 && matchId % 127 != 0) {
            // 128 进 64 强
            competitionType = 128;
        } else if (matchId % 127 > 64 && matchId % 127 <= 96) {
            // 64 进 32 强
            competitionType = 64;
        } else if (matchId % 127 > 96 && matchId % 127 <= 112) {
            // 32 进 16 强
            competitionType = 32;
        } else if (matchId % 127 > 112 && matchId % 127 <= 120) {
            // 16 进 8 强
            competitionType = 16;
        } else if (matchId % 127 > 120 && matchId % 127 <= 124) {
            // 8 进 4 强
            competitionType = 8;
        } else if (matchId % 127 > 124 && matchId % 127 <= 126) {
            // 半决赛
            competitionType = 4;
        } else if (matchId % 127 == 0) {
            // 决赛
            competitionType = 2;
        }

        uint team1;
        uint team2;
        (team1, team2) = viewer.getTeam();

        // 开启比赛随机数
        string memory roller = string(abi.encodePacked(team1.toString(), "_vs_", team2.toString(), "_", block.timestamp.toString()));
        random.rollDice(roller);

        // 该场比赛
        mapMatch[matchId] = Match({
            roller: roller,
            team1: team1,
            team2: team2,
            startTim: block.timestamp,
            endTim: block.timestamp + 5 minutes
        });

        emit Open(roller, competitionType, matchId);
    }

    /* @param
     * {uint} 投注 soul 数量
     * {uint} 投注 1 队 || 2 队
     */
    // 投注
    function betting(uint amount_, uint team_) public {
        address player = _msgSender();
        // 查询用户soul
        require(amount_ != 0, "betting: Soul_insufficient_balance");
        require(block.timestamp < mapMatch[matchId].endTim - 30 seconds, "betting: END");
        require(team_ == 1 || team_ == 2, "betting: No_team");
        require(getParticipate(player), "betting: Attended");

        // 玩家参与过 结算之前收益
        _setProceeds(player);

        uint leverageNow = mapPlayerInfo[player].leverage == 0 ? 1 : mapPlayerInfo[player].leverage;

        // 转账 - 销毁
        uint burn = amount_ * 5 / 100;
        uint betNums = amount_ * 90 / 100;
        soulToken.burnFrom(player, burn);
        mapBurnTotal[championIndex].soulAmount += burn;
        // 合约池
        soulToken.transferFrom(player, address(this), burn);

        soulToken.transferFrom(player, address(this), betNums);
        // 该场比赛 杠杆 * 数量
        uint leverageAmount = leverageNow * amount_;

        // 当天参加的冠军池积分
        mapChampionTotal[championIndex].ssoulAmount += amount_ * 1000;
        mapInstantTotal[matchId].ssoulAmount += amount_ * 1000;

        // 是否参与本周期冠军积分
        // 当天积分
        uint championlen = mapPlayerChampion[player].length;
        if (championlen != 0 && mapPlayerChampion[player][championlen - 1].championIndex <= championIndex) {
            mapPlayerChampion[player][championlen - 1].ssoulAmount += amount_ * 1000;
        } else {
            mapPlayerChampion[player].push(Champion({
                ssoulAmount: amount_ * 1000,
                championIndex: championIndex
            }));
        }

        // 1 soul - 1000 ssoul
        mapPlayerInfo[player].ssoulAmount += amount_ * 1000;

        uint[7] memory rates = [uint(90), 90, 53, 63, 73, 83, 88];

        uint rate = 0;
        while (rate <= 6) {
            if (competitionType == 2 ** (7 - rate)) break;
            rate++;
        }
        rate = rates[rate];

        if (team_ == 1) {
            mapInstantTotal[matchId].team1Amount += leverageAmount * rate / 100;
        } else {
            mapInstantTotal[matchId].team2Amount += leverageAmount * rate / 100;
        }
        mapPlayerRecord[player].push(Instant({
            player: player,
            initAmount: amount_,
            amount: amount_ * rate / 100,
            leverageAmount: leverageAmount * rate / 100,
            team: team_,
            matchId: matchId
        }));

        // 总量
        mapInstantTotal[matchId].total += amount_ * rate / 100;
        mapChampionTotal[championIndex].soulAmount += amount_ * (90 - rate) / 100;

    }

    // 结算收益
    function _setProceeds(address player) private {
        if (mapPlayerRecord[player].length != 0) {
            uint index = mapPlayerRecord[player][0].matchId;

            uint winner;
            uint[] memory randomNums = random.getRandom(mapMatch[index].roller);
            if (randomNums[0] > randomNums[1]) {
                winner = 1;
            } else {
                winner = 2;
            }

            // 收益
            uint totalBonus;
            // 参赛记录
            if (winner == mapPlayerRecord[player][0].team) {
                // 赢
                uint oldChampion = mapPlayerRecord[player][0].matchId / 127;
                if (oldChampion < (championIndex - 1) && oldChampion != 0) {
                    // 首次投注新周期 重置杠杆
                    mapPlayerInfo[player].leverage = 0;
                } else {
                    mapPlayerInfo[player].leverage += 1;
                }
                // (投注数量 / 赢者池子) * 池子总数量 
                if (winner == 1) {
                    totalBonus = mapPlayerRecord[player][0].leverageAmount * 1 gwei / mapInstantTotal[index].team1Amount * mapInstantTotal[index].total / 1 gwei;
                } else {
                    totalBonus = mapPlayerRecord[player][0].leverageAmount * 1 gwei / mapInstantTotal[index].team2Amount * mapInstantTotal[index].total / 1 gwei;
                }
                // 记录本金
                // mapPlayerInfo[player].principal += mapPlayerRecord[player][0].amount;
                // 记录可领收益
                mapPlayerInfo[player].instantEarnings += totalBonus;
            } else {
                mapPlayerInfo[player].leverage = 0;
                // 输
                // mapPlayerInfo[player].ssoulAmount += mapPlayerRecord[player][0].initAmount * 1000;

            }

            // 删除已结算记录
            mapPlayerRecord[player].pop();
        }

        // uint nowTimestamp = block.timestamp % 1 days;
        // 计算收益 - 冠军赛
        if (matchId == 0) return;
        uint nowChampion = (matchId - 1) / 127 + 1;
        uint len = mapPlayerChampion[player].length;
        for (uint i = 0; i < len;) {
            if (nowChampion > mapPlayerChampion[player][i].championIndex) {
                // 冠军收益 = 当天 ssoul 积分 / 当天冠军池 ssoul 总量 * 当天冠军池 soul 总量
                mapPlayerInfo[player].championEarnings += mapPlayerChampion[player][i].ssoulAmount * 1 gwei / mapChampionTotal[mapPlayerChampion[player][i].championIndex].ssoulAmount * mapChampionTotal[mapPlayerChampion[player][i].championIndex].soulAmount / 1 gwei;
                mapPlayerInfo[player].destroySsoul += mapPlayerChampion[player][i].ssoulAmount;
                // 当天收益结算
                mapPlayerInfo[player].ssoulAmount -= mapPlayerChampion[player][i].ssoulAmount;
                mapPlayerChampion[player][i] = mapPlayerChampion[player][len - 1];
                mapPlayerChampion[player].pop();
                len = mapPlayerChampion[player].length;
            } else {
                i += 1;
            }
        }

    }

    // 领取即时收益
    function getInstantEarnings() public {
        address player = _msgSender();
        // uint nowTimestamp = block.timestamp % 1 days;

        // 结算上一场收益
        _setProceeds(player);

        uint earnings = mapPlayerInfo[player].instantEarnings;
        uint championEarnings = mapPlayerInfo[player].championEarnings;
        // uint principal = mapPlayerInfo[player].principal;

        require(earnings != 0 || championEarnings != 0, "getInstantEarnings: No_bonus");

        // 本金
        // soulToken.transfer(player, principal);
        // 收益
        soulToken.transfer(player, earnings);

        // 已领收益
        mapPlayerInfo[player].instantEarningsed += earnings;
        // mapPlayerInfo[player].principaled += principal;
        mapPlayerInfo[player].instantEarnings = 0;
        // mapPlayerInfo[player].principal = 0;
        if (mapPlayerInfo[player].championEarnings != 0) {
            // 领取冠军收益   
            getChampionEarnings();
        }
    }

    // 领取冠军池收益
    function getChampionEarnings() private {
        // uint nowTimestamp = block.timestamp % 1 days;

        // require(nowTimestamp > (endTime % 1 days), "getChampionEarnings: Collection_has_not_started");

        address player = _msgSender();

        uint earnings = mapPlayerInfo[player].championEarnings;
        uint ssoul = mapPlayerInfo[player].destroySsoul;

        require(earnings != 0, "getChampionEarnings: No_bonus");
        // 销毁凭证
        mapBurnTotal[championIndex].ssoulAmount += ssoul;

        soulToken.transfer(player, earnings);

        // 已领收益
        mapPlayerInfo[player].championEarningsed += earnings;
        mapPlayerInfo[player].championEarnings = 0;

    }

    // 获取是否可以参加该场
    function getParticipate(address player_) public view returns (bool) {
        return mapPlayerRecord[player_].length == 0 || mapPlayerRecord[player_][0].matchId != matchId;
    }

    function getMapPlayerChampion(address player_) public view returns(Champion[] memory) {
        return mapPlayerChampion[player_];
    }

    function getMapPlayerRecord(address player_) public view returns(Instant[] memory) {
        return mapPlayerRecord[player_];
    }

    // 获取销毁总量
    // function getBurnTotal() public view returns (BurnTotal memory) {
    //     BurnTotal memory total;
    //     for (uint i = 1; i <= championIndex; i++) {
    //         total.soulAmount += mapBurnTotal[i].soulAmount;
    //         total.ssoulAmount += mapBurnTotal[i].ssoulAmount;
    //     }
    //     return total;
    // }

    // 获取随机数 某一场比赛
    // function getRandom(uint index_) public view returns(uint[] memory) {
    //     uint[] memory randomNums = random.getRandom(mapMatch[index_].roller);
    //     return randomNums;
    // }

    // 获取比赛信息
    // function getChampionInfo() public view returns(ChampionInfo memory) {
    //     ChampionInfo memory championInfo;
    //     championInfo.startTime = startTime;
    //     championInfo.endTime = endTime;
    //     championInfo.competitionType = competitionType;
    //     championInfo.matchId = matchId;
    //     championInfo.championIndex = championIndex;
    //     return championInfo;
    // }

    // function getEarningsData(address player) public view returns(PlayerEarningInfo memory) {
    //     // 收益
    //     PlayerEarningInfo memory earningInfo;
    //     earningInfo.leverage = mapPlayerInfo[player].leverage;
    //     earningInfo.ssoulAmount = mapPlayerInfo[player].ssoulAmount;
    //     earningInfo.instantEarnings = mapPlayerInfo[player].instantEarnings;
    //     earningInfo.championEarnings = mapPlayerInfo[player].championEarnings;
    //     uint len = mapPlayerChampion[player].length;
    //     if (mapPlayerRecord[player].length != 0) {

    //         uint index = mapPlayerRecord[player][0].matchId;

    //         uint[] memory randomNums = random.getRandom(mapMatch[index].roller);
    //         uint winner;
    //         if (randomNums[0] > randomNums[1]) {
    //             winner = 1;
    //         } else {
    //             winner = 2;
    //         }

    //         uint totalBonus;
    //         // 参赛记录
    //         if (winner == mapPlayerRecord[player][0].team) {
    //             // 赢
    //             uint oldChampion = (mapPlayerRecord[player][0].matchId - mapPlayerRecord[player][0].matchId % 127) * 1 gwei / 127;
    //             if (oldChampion < (championIndex - 1) * 1 gwei && oldChampion != 0) {
    //                 // 首次投注新周期 重置杠杆
    //                 earningInfo.leverage = 0;
    //             } else {
    //                 earningInfo.leverage += 1;
    //             }
    //             // (投注数量 / 赢者池子) * 池子总数量 
    //             if (winner == 1) {
    //                 totalBonus = mapPlayerRecord[player][0].leverageAmount * 1 gwei / mapInstantTotal[index].team1Amount * mapInstantTotal[index].total / 1 gwei;
    //             } else {
    //                 totalBonus = mapPlayerRecord[player][0].leverageAmount * 1 gwei / mapInstantTotal[index].team2Amount * mapInstantTotal[index].total / 1 gwei;
    //             } 
    //             // 可领收益
    //             earningInfo.instantEarnings += totalBonus;
    //         } else {
    //             earningInfo.leverage = 0;
    //             earningInfo.ssoulAmount += mapPlayerRecord[player][0].initAmount * 1000;
    //         }

    //     } 
    //     // uint nowTimestamp = block.timestamp % 1 days;
    //     // 计算收益 - 冠军赛
    //     uint nowChampion = matchId * 1 gwei / 127;
    //     for (uint i = 0; i < len; i++) {
    //         if (nowChampion > mapPlayerChampion[player][i].championIndex * 1 gwei) {
    //             // 冠军收益 = 当天 ssoul 积分 / 当天冠军池 ssoul 总量 * 当天冠军池 soul 总量
    //             earningInfo.championEarnings += earningInfo.ssoulAmount * 1 gwei / mapChampionTotal[mapPlayerChampion[player][i].championIndex].ssoulAmount * mapChampionTotal[mapPlayerChampion[player][i].championIndex].soulAmount / 1 gwei;
    //         }
    //     }

    //     earningInfo.instantEarnings += earningInfo.championEarnings;
    //     earningInfo.instantEarningsed = mapPlayerInfo[player].instantEarningsed + mapPlayerInfo[player].championEarningsed;

    //     return earningInfo;

    // }

}