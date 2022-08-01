// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SoulmetaItemBuilder721 is Ownable, ERC721Enumerable{
    using Strings for uint256;

    string public baseURI;
    function setBaseURI(string calldata uri_) public onlyOwner {
        baseURI = uri_;
    }
    function tokenURI(uint256 tokenId_) override public view returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId_.toString()));
    }

    mapping(address => bool) public minters;
    address public superMinter;

    function setSuperMinter(address newSuperMinter_) public onlyOwner returns (bool) {
        superMinter = newSuperMinter_;
        return true;
    }

    function setMinterBatch(address newMinter_, bool bool_) public onlyOwner returns (bool) {
        minters[newMinter_] = bool_;
        return true;
    }

    constructor(string memory name_, string memory symbol_, string memory baseURI_) ERC721(name_, symbol_) {
        baseURI = baseURI_;
    }

    function mint (address player_, uint tokenId_) public returns (bool) {
        if (superMinter != _msgSender()) {
            require(minters[_msgSender()], "S: not minter's calling");
        }
        _mint(player_, tokenId_);

        return true;
    }

    function mintMulti(address player_, uint[] calldata tokenIds_) public returns (uint256) {
        if (superMinter != _msgSender()) {
            require(minters[_msgSender()], "S: not minter's calling");
        }
        uint tokenId;
        for (uint i = 0; i < tokenIds_.length; ++i) {
            tokenId = tokenIds_[i];
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
