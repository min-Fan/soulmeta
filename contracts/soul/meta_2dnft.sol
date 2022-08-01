// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../other/divestor.sol";

contract Soulmeta2dnft is Divestor, ERC721Enumerable {
    using Strings for uint;
    using Counters for Counters.Counter;
    Counters.Counter public _tokenId;

    mapping(address => bool) public minters;
    string public baseURI;

    constructor () ERC721("Soul Meta 2D NFT", "SM2D") {
        baseURI = "https://soulmeta.io/nft-info/sm2d/";
    }

    function setBaseURI(string calldata uri_) public onlyOwner {
        baseURI = uri_;
    }

    function tokenURI(uint tokenId_) override public view returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId_.toString()));
    }

    function setMinter(address newMinter_, bool bool_) public onlyOwner returns (bool) {
        minters[newMinter_] = bool_;
        return true;
    }

    // 查询用户的 nft 列表
    function getTokenIdList(address addr_) public view returns (uint[] memory) {
        // 获取某个地址下的所有TokenID
        uint index = balanceOf(addr_);
        uint[] memory tokenIds = new uint[](index);

        for (uint i = 0; i < index; ++i) {
            tokenIds[i] = tokenOfOwnerByIndex(addr_, i);
        }
        return tokenIds;
    }

    function mint(address player_) public returns (uint) {
        require(minters[_msgSender()], "S: not minter's calling");
        _tokenId.increment();
        uint tokenId = _tokenId.current();
        _mint(player_, tokenId);

        return tokenId;
    }

    function mintMulti(address player_, uint amount_) public returns (uint) {
        require(minters[_msgSender()], "S: not minter's calling");
        uint tokenId;
        for (uint i = 0; i < amount_; ++i) {
            _tokenId.increment();
            tokenId = _tokenId.current();
            _mint(player_, tokenId);
        }
        return tokenId;
    }

    uint public burned;

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
}
