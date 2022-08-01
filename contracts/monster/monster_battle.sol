// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
// import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "../other/divestor_upgradeable.sol";
import "../other/random_generator_upgradeable.sol";
import "./moster_nft.sol";

contract MonsterBattle is DivestorUpgradeable, RandomGeneratorUpgradeable {
    // using SafeERC20Upgradeable for IERC20Upgradeable;

    struct Attr {
        uint health;            // 生命值
        uint harm;              // 伤害
        uint odds;              // 触发几率
    }   

    // struct MonsterAttr {
    //     uint health;            // 生命值
    //     uint harm;              // 伤害
    // }

    // struct PlayerAttr {
    //     uint health;            // 生命值
    //     uint harm;              // 伤害
    // }

    // struct SummonedAttr {
    //     uint odds;              // 触发几率
    //     uint harm;              // 伤害
    // }

    // struct Monster { 
    //     uint amount;            // 数量
    //     uint bounty;            // 赏金
    // }

    MonsterNft public monster;                   // monster nft 合约地址
    Attr public monsterAttr;                     // 怪兽属性
    Attr public playerAttr;                      // 玩家属性
    Attr public summonedAttr;                    // 召唤兽属性

    address public timeBank;                     // 世界银行合约 地址
    uint public initBounty;                      // 初始赏金
    // uint public price;                           // 挑战价格
    uint public summonedPrice;                   // 召唤兽价格

    // 怪兽 (monsterId_ => Monster)
    mapping(uint => uint[]) public mapAmount;
    // 玩家 ==> 随机到的怪兽id
    mapping(address => uint[]) public mapMonsters;

    event Battle(uint[] indexed playGame, uint indexed monsterId, uint indexed winer, bool isSummoned);

    function initialize(address monster_, address timeBank_) public initializer {
        __Ownable_init_unchained();
        monster = MonsterNft(monster_);
        timeBank = timeBank_;
        initBounty = 0.1 ether;
        // price = 0.01 ether;
        summonedPrice = 0.01 ether;
        monsterAttr = Attr({
            health: 110,
            harm: 10,
            odds: 0
        });
        playerAttr = Attr({
            health: 100,
            harm: 10,
            odds: 0
        });
        summonedAttr = Attr({
            health: 0,
            odds: 50,
            harm: 5
        });
    }

    function setMeta(address timeBank_) public onlyOwner {
        timeBank = timeBank_;
    }

    function setAmount(uint[] memory monsterId_, uint[] memory amount_) public onlyOwner {
        require(monsterId_.length == amount_.length, 'len err');
        for (uint i = 0; i < monsterId_.length; i++) {
            // 第 i 只该怪兽赏金
            for (uint256 j = 0; j < amount_[i]; j++) {
                mapAmount[monsterId_[i]].push(initBounty);
            }
        }
    }

    function setAttr(Attr calldata monster_, Attr calldata player_, Attr calldata summoned_) public onlyOwner {
        monsterAttr = monster_;
        playerAttr = player_;
        summonedAttr = summoned_;
    }

    function getRanMonsters(address player_) public view returns(uint[] memory) {
        return mapMonsters[player_];
    }

    // 随机怪兽
    function ranMonster(uint nums_) public {
        address player = _msgSender();
        uint[] memory monsters = new uint[](nums_);
        for (uint i = 0; i < monsters.length; i++) {
            uint ran = (randomCeil(10) * 10 - 10) + randomCeil(10);
            monsters[i] = ran;
        }
        mapMonsters[player] = monsters;
    }

    /* @params
     * {uint[]} 玩家出拳
     * {uint} 怪兽id
     * {bool} 是否有召唤兽
     */
    function battle(uint[] memory playGame_, uint monsterId_, uint idx_, bool isSummoned_) public payable returns(uint) {
        address player = _msgSender();
        require(mapMonsters[player].length != 0, 'none monsters');

        bool isChallenges;
        for (uint i = 0; i < mapMonsters[player].length; i++) {
            if (mapMonsters[player][i] == monsterId_) {
                isChallenges = true;
                break;
            } else {
                isChallenges = false;
            }
        }
        require(isChallenges, 'no challenges');

        // 挑战价格
        uint totalPrice = getBattlePrice(monsterId_, idx_, isSummoned_);
        require(msg.value == totalPrice, "battle: Price_error");
        require(playGame_.length != 0, "battle: No punches thrown");
        require(mapAmount[monsterId_].length != 0 && mapAmount[monsterId_][idx_] != 0, "battle: amount or bounty err");

        uint[9] memory monsterBattle = monsterGame();

        // 生命值
        uint playerH = playerAttr.health;
        uint monsterH = monsterAttr.health;
        
        uint monsterHarm = monsterAttr.harm;
        // 索引
        uint playerIdx = 0;
        uint monsterIdx = 0;
        while (playerH > 0 && monsterH > 0) {
            // 玩家伤害
            uint playerHarm = playerAttr.harm;
            // 召唤兽
            if (isSummoned_) {
                // 0 - 100 随机数
                uint ran = (randomCeil(10) * 10 - 10) + randomCeil(10);
                playerHarm = ran > summonedAttr.odds ? playerAttr.harm + summonedAttr.harm : playerAttr.harm;
            }
            // 0 -> 石头 | 1 -> 剪刀 | 2 -> 布 
            if (playGame_[playerIdx] == 0) {
                playerH -= monsterBattle[monsterIdx] == 0 ? 0 : monsterBattle[monsterIdx] == 1 ? 0 : playerH >= monsterHarm ? monsterHarm : playerH;
                if (monsterBattle[monsterIdx] == 1) monsterH -= monsterH >= playerHarm ? playerHarm : monsterH;
            } else if (playGame_[playerIdx] == 1) {
                playerH -= monsterBattle[monsterIdx] == 1 ? 0 : monsterBattle[monsterIdx] == 2 ? 0 : playerH >= monsterHarm ? monsterHarm : playerH;
                if (monsterBattle[monsterIdx] == 2) monsterH -= monsterH >= playerHarm ? playerHarm : monsterH;
            } else if (playGame_[playerIdx] == 2) {
                playerH -= monsterBattle[monsterIdx] == 2 ? 0 : monsterBattle[monsterIdx] == 0 ? 0 : playerH >= monsterHarm ? monsterHarm : playerH;
                if (monsterBattle[monsterIdx] == 0) monsterH -= monsterH >= playerHarm ? playerHarm : monsterH;
            }
            playerIdx++;
            monsterIdx++;
            if (playerIdx == playGame_.length) playerIdx = 0;
            if (monsterIdx == monsterBattle.length) monsterIdx = 0;
        }
        // 1 -> 玩家赢 | 2 -> 怪兽赢
        uint winer = playerH == 0 ? 2 : 1;

        // if (winer == 1) {
        //     // 铸造nft 转账 
        //     monster.mint(player, monsterId_);
        //     delete mapAmount[monsterId_][idx_];
        // } else {
        //     uint amount = totalPrice * 5 / 10;
        //     mapAmount[monsterId_][idx_] += amount;
        //     payable(timeBank).transfer(amount);
        // }

        // emit Battle(playGame_, monsterId_, winer, isSummoned_);
        return winer;
    }

    // 获取挑战价格
    function getBattlePrice(uint monsterId_, uint idx, bool isSummoned_) public view returns(uint) {
        // 挑战价格
        return isSummoned_ ? mapAmount[monsterId_][idx] * 1 / 10 + summonedPrice : mapAmount[monsterId_][idx] * 1 / 10;
    }

    // 怪兽出拳
    function monsterGame() public returns(uint[9] memory) {
        // 基础出拳
        uint[9] memory arr = [uint(0), 1, 2, 0, 1, 2, 0, 1, 2];

        for (uint i = 0; i < arr.length; i++) {
            uint idx = randomCeil(9) - 1;
            uint val = arr[idx];
            arr[idx] = arr[arr.length - 1];
            arr[arr.length - 1] = val;
        }

        return arr;
    }

}