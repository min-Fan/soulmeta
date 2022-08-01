// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../other/divestor_upgradeable.sol";
import "./soul_world_cup_consumer.sol";

interface IWorldCup {
    // 销毁
    struct BurnTotal {
        uint soulAmount;
        uint ssoulAmount;
    }
    struct Match {
        string roller;               // 比赛骰子id
        uint team1;                  // 队伍1
        uint team2;                  // 队伍2
        uint startTim;               // 开始时间
        uint endTim;                 // 结束时间
    }
    struct ChampionInfo {
        uint startTime;
        uint endTime;
        uint competitionType;
        uint matchId;
        uint championIndex;
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
    struct Champion {
        uint ssoulAmount;
        uint championIndex;
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
    // 即时奖金池
    struct InstantPool {
        uint total;
        uint team1Amount;
        uint team2Amount;
        uint ssoulAmount;
    }
    // 冠军池总量 - 积分
    struct ChampionPool {
        uint soulAmount;
        uint ssoulAmount;
    }
    function mapBurnTotal(uint index_) external view returns(BurnTotal memory);
    function championIndex() external view returns(uint);
    function mapMatch(uint index_) external view returns(Match memory);
    function startTime() external view returns(uint);
    function endTime() external view returns(uint);
    function competitionType() external view returns(uint);
    function matchId() external view returns(uint);
    function mapPlayerInfo(address player_) external view returns(PlayerEarningInfo memory);
    function mapPlayerChampion(address player_, uint index_) external view returns(Champion memory);
    function getMapPlayerChampion(address player_) external view returns(Champion[] memory);
    function mapPlayerRecord(address player_, uint index_) external view returns(Instant memory);
    function getMapPlayerRecord(address player_) external view returns (Instant[] memory);
    function mapInstantTotal(uint index_) external view returns(InstantPool memory);
    function mapChampionTotal(uint index_) external view returns(ChampionPool memory);
}

contract WorldCupViewer is DivestorUpgradeable {
    
    IWorldCup worldCup;                  // 世界杯合约
    WorldCupConsumer random;               // 随机数消费者合约

    function initialize(address worldCup_, address randomConsumer_) public initializer {
        __Ownable_init_unchained();
        worldCup = IWorldCup(worldCup_);
        random = WorldCupConsumer(randomConsumer_);
    }

    function getBurnTotal() public view returns (IWorldCup.BurnTotal memory) {
        IWorldCup.BurnTotal memory total;
        for (uint i = 1; i <= worldCup.championIndex(); i++) {
            total.soulAmount += worldCup.mapBurnTotal(i).soulAmount;
            total.ssoulAmount += worldCup.mapBurnTotal(i).ssoulAmount;
        }
        return total;
    }

    // 获取随机数 某一场比赛
    function getRandom(uint index_) public view returns(uint[] memory) {
        uint[] memory randomNums = random.getRandom(worldCup.mapMatch(index_).roller);
        return randomNums;
    }

    function getWiner(uint matchId_) public view returns(uint) {
        uint[] memory randomNums;
        uint winer;
        // 获取比赛结果
        randomNums = random.getRandom(worldCup.mapMatch(matchId_).roller);
        // 输赢
        if (randomNums[0] > randomNums[1]) {
            winer = worldCup.mapMatch(matchId_).team1;
        } else {
            winer = worldCup.mapMatch(matchId_).team2;
        }
        return winer;
    }

    function getTeam() public view returns(uint, uint) {
        uint team1;
        uint team2;
        uint matchId = worldCup.matchId() + 1;
        uint championIndex = worldCup.championIndex() == 0 ? 1 : worldCup.championIndex();
        if (matchId % 127 <= 64 && matchId % 127 != 0) {
            team1 = matchId % 127 * 2 - 1;
            team2 = matchId % 127 * 2;
        } else if (matchId % 127 == 0) {
            team1 = getWiner(matchId - 2);
            team2 = getWiner(matchId - 1);
        } else {
            uint match1 = (matchId % 127 * 2 - 129) + (championIndex - 1) * 127;
            uint match2 = (matchId % 127 * 2 - 128) + (championIndex - 1) * 127;
            team1 = getWiner(match1);
            team2 = getWiner(match2);
        }
        return (team1, team2);
    }

    // 获取比赛信息
    function getChampionInfo() public view returns(IWorldCup.ChampionInfo memory) {
        IWorldCup.ChampionInfo memory championInfo;
        championInfo.startTime = worldCup.startTime();
        championInfo.endTime = worldCup.endTime();
        championInfo.competitionType = worldCup.competitionType();
        championInfo.matchId = worldCup.matchId();
        championInfo.championIndex = worldCup.championIndex();
        return championInfo;
    }

    function getEarningsData(address player) public view returns(IWorldCup.PlayerEarningInfo memory) {
        // 收益
        IWorldCup.PlayerEarningInfo memory earningInfo;
        earningInfo.leverage = worldCup.mapPlayerInfo(player).leverage;
        earningInfo.ssoulAmount = worldCup.mapPlayerInfo(player).ssoulAmount;
        earningInfo.instantEarnings = worldCup.mapPlayerInfo(player).instantEarnings;
        earningInfo.championEarnings = worldCup.mapPlayerInfo(player).championEarnings;
        if (worldCup.getMapPlayerRecord(player).length != 0) {
            
            IWorldCup.Instant memory record = worldCup.mapPlayerRecord(player, 0);
             uint index = record.matchId;

            uint[] memory randomNums = random.getRandom(worldCup.mapMatch(index).roller);
            uint winner;
            if (randomNums[0] > randomNums[1]) {
                winner = 1;
            } else {
                winner = 2;
            }

            uint totalBonus;
            // 参赛记录
            if (winner == record.team) {
                // 赢
                uint oldChampion = record.matchId / 127;
                if (oldChampion < (worldCup.championIndex() - 1) && oldChampion != 0) {
                    // 首次投注新周期 重置杠杆
                    earningInfo.leverage = 0;
                } else {
                    earningInfo.leverage += 1;
                }
                // (投注数量 / 赢者池子) * 池子总数量 
                if (winner == 1) {
                    totalBonus = record.leverageAmount * 1 gwei / worldCup.mapInstantTotal(index).team1Amount * worldCup.mapInstantTotal(index).total / 1 gwei;
                } else {
                    totalBonus = record.leverageAmount * 1 gwei / worldCup.mapInstantTotal(index).team2Amount * worldCup.mapInstantTotal(index).total / 1 gwei;
                } 
                // 可领收益
                earningInfo.instantEarnings += totalBonus;
            } else {
                earningInfo.leverage = 0;
                // earningInfo.ssoulAmount += record.initAmount * 1000;
            }

        } 
        // uint nowTimestamp = block.timestamp % 1 days;
        // 计算收益 - 冠军赛
        uint matchId = worldCup.matchId();
        if (matchId == 0) return earningInfo;
        uint nowChampion = (matchId - 1) / 127 + 1;
        IWorldCup.Champion[] memory championRecord = worldCup.getMapPlayerChampion(player);
        for (uint i = 0; i < championRecord.length; i++) {
            if (nowChampion > championRecord[i].championIndex) {
                // 冠军收益 = 当天 ssoul 积分 / 当天冠军池 ssoul 总量 * 当天冠军池 soul 总量
                earningInfo.championEarnings += championRecord[i].ssoulAmount * 1 gwei / worldCup.mapChampionTotal(championRecord[i].championIndex).ssoulAmount * worldCup.mapChampionTotal(championRecord[i].championIndex).soulAmount / 1 gwei;
                earningInfo.ssoulAmount -= championRecord[i].ssoulAmount;
            }
        }

        earningInfo.instantEarnings += earningInfo.championEarnings;
        earningInfo.instantEarningsed = worldCup.mapPlayerInfo(player).instantEarningsed + worldCup.mapPlayerInfo(player).championEarningsed;

        return earningInfo;

    }
    
}