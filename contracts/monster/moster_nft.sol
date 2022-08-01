// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MonsterNft is Ownable, ERC721Enumerable{
    using Strings for uint256;
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    string public baseURI;
    address public superMinter;
    address public market;      // 市场合约地址
    uint public burned;

    struct CardInfo {
        uint cardId;
        uint currentAmount;
        uint burnedAmount;
        uint maxAmount;
    }

    // id => CardInfo
    mapping(uint => CardInfo) public cardInfoes;
    // tokenid => id
    mapping(uint => uint) public cardIdMap;
    // monsterid => tokenid[]
    mapping(uint => uint[]) public mapMonsterId;
    mapping(address => bool) public minters;

    modifier onlyMarket() {
        require(msg.sender == market);
        _;
    }

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {}

    function setMarketRole(address market_) public onlyOwner {
        market = market_;
    }

    function setBaseURI(string calldata uri_) public onlyOwner {
        baseURI = uri_;
    }

    function tokenURI(uint256 tokenId_) override public view returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId_.toString()));
    }

    function setSuperMinter(address newSuperMinter_) public onlyOwner returns (bool) {
        superMinter = newSuperMinter_;
        return true;
    }

    function setMinterBatch(address newMinter_, bool bool_) public onlyOwner returns (bool) {
        minters[newMinter_] = bool_;
        return true;
    }

    function mint (address player_, uint id_) public returns (bool) {
        if (superMinter != _msgSender()) {
            require(minters[_msgSender()], "S: not minter's calling");
        }
        uint tokenId;
        _tokenIdCounter.increment();
        tokenId = _tokenIdCounter.current();
        _mint(player_, tokenId);
        cardIdMap[tokenId] = id_;
        cardInfoes[id_].cardId = id_;
        cardInfoes[id_].maxAmount += 1;
        cardInfoes[id_].currentAmount += 1;
        mapMonsterId[id_].push(tokenId);
        return true;
    }

    // 批量铸造
    function mintMulti(uint id_, uint tokenNums_, address player_) public returns (uint256) {
        if (superMinter != _msgSender()) {
            require(minters[_msgSender()], "S: not minter's calling");
        }
        uint tokenId;
        for (uint i = 0; i < tokenNums_; ++i) {
            _tokenIdCounter.increment();
            tokenId = _tokenIdCounter.current();
            _mint(player_, tokenId);
            cardIdMap[tokenId] = id_;
            cardInfoes[id_].cardId = id_;
            cardInfoes[id_].maxAmount += 1;
            cardInfoes[id_].currentAmount += 1;
            mapMonsterId[id_].push(tokenId);
        }
        return tokenId;
    }

    function burn(uint tokenId_) public returns (bool){
        require(_isApprovedOrOwner(_msgSender(), tokenId_), "F: burner isn't owner");

        burned += 1;

        _burn(tokenId_);
        return true;
    }

    function burnMulti(uint[] calldata tokenIds_) public returns (bool){
        for (uint i = 0; i < tokenIds_.length; ++i) {
            burn(tokenIds_[i]);
        }
        return true;
    }

    // 查询一种类型的 tokenid list
    function getIdList(uint id_) public view returns(uint[] memory) {
        return mapMonsterId[id_];
    }

    // 查询 tokenid => id
    function getTokenId(uint tokenId_) public view returns(uint) {
        return cardIdMap[tokenId_];
    }

    // 删除以卖出的tokenid
    function delIdList(uint id_) public onlyMarket {
        uint len = mapMonsterId[id_].length;
        mapMonsterId[id_][0] = mapMonsterId[id_][len - 1];
        mapMonsterId[id_].pop();
        cardInfoes[id_].burnedAmount += 1;
        cardInfoes[id_].currentAmount -= 1;
    }

}
