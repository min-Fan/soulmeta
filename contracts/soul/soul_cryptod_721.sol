// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract CryptoD721V2 is Ownable, ERC721Enumerable {
    using Counters for Counters.Counter;
    using Strings for uint256;

    struct GroupInfo {
        uint groupId;
        uint currentAmount;
        uint burnedAmount;
        uint maxAmount;
    }

    Counters.Counter public _tokenId;
    string public baseURI;
    uint public burned;
    mapping(uint => GroupInfo) public groupInfos;
    mapping(uint => uint) public groupIdMap;
    mapping(address => bool) public minters;

    constructor(string memory name_, string memory symbol_, string memory baseURI_) ERC721(name_, symbol_) {
        baseURI = baseURI_;
    }

    function setMinter(address newMinter_, bool bool_) public onlyOwner returns (bool) {
        minters[newMinter_] = bool_;
        return true;
    }

    function setGroupInfo(uint groupId_, uint maxAmount_) public onlyOwner returns (bool) {
        require(groupInfos[groupId_].currentAmount <= maxAmount_, "max err");
        groupInfos[groupId_] = GroupInfo({
        groupId: groupId_,
        currentAmount: groupInfos[groupId_].currentAmount,
        burnedAmount: groupInfos[groupId_].burnedAmount,
        maxAmount: maxAmount_
        });
        return true;
    }

    function setBaseURI(string calldata uri_) public onlyOwner {
        baseURI = uri_;
    }

    function tokenURI(uint256 tokenId_) override public view returns (string memory) {
        return string(abi.encodePacked(baseURI, groupIdMap[tokenId_].toString(), '/', tokenId_.toString()));
    }

    function mint(address player_, uint groupId_) public returns (uint) {
        require(minters[_msgSender()], "S: not minter's calling");
        require(groupInfos[groupId_].currentAmount + 1 <= groupInfos[groupId_].maxAmount, "no supply");

        _tokenId.increment();
        uint tokenId = _tokenId.current();
        _mint(player_, tokenId);
        groupIdMap[tokenId] = groupId_;

        groupInfos[groupId_].currentAmount += 1;
        return tokenId;
    }

    function mintMulti(address player_, uint groupId_, uint amount_) public returns (uint) {
        require(minters[_msgSender()], "S: not minter's calling");
        require(amount_ > 0 && groupInfos[groupId_].currentAmount + amount_ <= groupInfos[groupId_].maxAmount, "no supply");
        uint tokenId;
        for (uint i = 0; i < amount_; ++i) {
            _tokenId.increment();
            tokenId = _tokenId.current();
            _mint(player_, tokenId);
            groupIdMap[tokenId] = groupId_;
        }
        groupInfos[groupId_].currentAmount += amount_;
        return tokenId;
    }

    function burn(uint tokenId_) public returns (bool){
        require(_isApprovedOrOwner(_msgSender(), tokenId_), "F: burner isn't owner");

        burned += 1;
        groupInfos[groupIdMap[tokenId_]].burnedAmount += 1;

        _burn(tokenId_);
        return true;
    }

    function burnMulti(uint[] calldata tokenIds_) public returns (bool){
        for (uint i = 0; i < tokenIds_.length; ++i) {
            burn(tokenIds_[i]);
        }
        return true;
    }
}
