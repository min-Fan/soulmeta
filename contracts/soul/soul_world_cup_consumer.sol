// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract WorldCupConsumer is VRFConsumerBaseV2, Ownable {

    VRFCoordinatorV2Interface COORDINATOR;

    uint64 s_subscriptionId;

    // bsc test
//    address vrfCoordinator = 0x6A2AAd07396B36Fe02a22b33cf443582f682c82f;
//    bytes32 s_keyHash = 0xd4bb89654db74673a187bd804519e65e3f71a52bc55f11da7601a13dcf505314;
    bytes32 public s_keyHash;

    uint32 callbackGasLimit = 100000;
    uint16 public requestConfirmations = 100;
    uint32 numWords = 2;
    address public roller;
    uint[] private _roll_in_progress = [0];

    mapping(uint => string) public s_rollers;
    mapping(string => uint[]) public s_results;

    event DiceRolled(uint indexed requestId, string indexed roller);
    event DiceLanded(uint indexed requestId, uint[] indexed result);

    constructor(address vrfCoordinator_, bytes32 keyHash_, uint64 subscriptionId_) VRFConsumerBaseV2(vrfCoordinator_) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator_);
        s_keyHash = keyHash_;
        s_subscriptionId = subscriptionId_;
    }

    function setMeta(address roller_, bytes32 keyHash_, uint64 subscriptionId_) public onlyOwner {
        roller = roller_;
        s_keyHash = keyHash_;
        s_subscriptionId = subscriptionId_;
        // worldCup = WorldCup(useRandom_);
    }

    function setRequestConfirmations(uint16 requestConfirmations_) public {
        require(_msgSender() == owner() || _msgSender() == roller, "err opr");
        requestConfirmations = requestConfirmations_;
    }

    function rollDice(string memory roller_) public returns (uint requestId) {
        require(_msgSender() == owner() || _msgSender() == roller, "err opr");
        // 骰子已掷出
        require(s_results[roller_].length == 0, "rollDice: Already rolled");

        // 比赛开始
        // 发出掷出骰子请求
        requestId = COORDINATOR.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numWords
        );

        s_rollers[requestId] = roller_;
        s_results[roller_] = _roll_in_progress;

        emit DiceRolled(requestId, roller_);
    }

    function fulfillRandomWords(uint requestId_, uint[] memory randomWords_) internal override {
        // 比赛结束
        s_results[s_rollers[requestId_]] = randomWords_;

        emit DiceLanded(requestId_, randomWords_);
    }

    function getRandom(string memory roller_) public view returns (uint[] memory) {
        // 无该次骰子
        require(s_results[roller_].length != 0, "getRandom: Dice not rolled");

        // 骰子滚动中
        require(s_results[roller_].length == numWords, "getRandom: Roll in progress");

        // 骰子随机数
        return s_results[roller_];
    }

}