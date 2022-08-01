// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../other/ERC1155Enumerable.sol";

contract SoulmetaItem1155 is Ownable, ERC1155Enumerable {
    using Address for address;
    using Strings for uint256;

    mapping(address => bool) public minters;

    function setMinter(address newMinter_, bool bool_) public onlyOwner {
        minters[newMinter_] = bool_;
    }

    string private _name;
    string private _symbol;
    uint private _totalSupply;

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    struct ItemInfo {
        uint tokenId;
        uint currentAmount;
        uint burnedAmount;
    }

    mapping(uint => ItemInfo) public itemInfoes;
    string public myBaseURI;

    constructor(string memory name_, string memory symbol_, string memory myBaseURI_, string memory URI_) ERC1155(URI_) {
        _name = name_;
        _symbol = symbol_;
        myBaseURI = myBaseURI_;
    }

    function setMyBaseURI(string memory uri_) public onlyOwner {
        myBaseURI = uri_;
    }

    function mint(address to_, uint tokenId_, uint amount_) public returns (bool) {
        require(minters[_msgSender()], "S: not minter's calling");
        require(amount_ > 0, "S: missing amount");
        require(tokenId_ != 0, "S: wrong tokenId");
        itemInfoes[tokenId_].tokenId = tokenId_;

        itemInfoes[tokenId_].currentAmount += amount_;
        _totalSupply += amount_;

        _mint(to_, tokenId_, amount_, "");

        return true;
    }


    function mintBatch(address to_, uint256[] memory ids_, uint256[] memory amounts_) public returns (bool) {
        require(ids_.length == amounts_.length, "S: ids and amounts length mismatch");

        require(minters[_msgSender()], "S: not minter's calling");
        for (uint i = 0; i < ids_.length; i++) {
            require(amounts_[i] > 0, "S: missing amount");
            require(ids_[i] != 0, "S: wrong tokenId");
            itemInfoes[ids_[i]].tokenId = ids_[i];

            itemInfoes[ids_[i]].currentAmount += amounts_[i];
            _totalSupply += amounts_[i];
        }

        _mintBatch(to_, ids_, amounts_, "");

        return true;
    }


    uint public burned;

    function burn(address account, uint256 id, uint256 value) public override {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "S: caller is not owner nor approved"
        );

        itemInfoes[id].burnedAmount += value;
        burned += value;
        _burn(account, id, value);
    }

    function burnBatch(address account, uint256[] memory ids, uint256[] memory values) public override {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "S: caller is not owner nor approved"
        );

        for (uint i = 0; i < ids.length; i++) {
            itemInfoes[ids[i]].burnedAmount += values[i];
            burned += values[i];
        }
        _burnBatch(account, ids, values);
    }

    function tokenURI(uint256 tokenId_) public view returns (string memory) {
        require(itemInfoes[tokenId_].tokenId != 0, "S: URI query for nonexistent token");

        string memory URI = tokenId_.toString();
        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0
        ? string(abi.encodePacked(baseURI, URI))
        : URI;
    }

    function _baseURI() internal view returns (string memory) {
        return myBaseURI;
    }

    function mintMulti(address[] memory accounts, uint256[] memory ids, uint256[] memory values) public onlyOwner returns (bool) {
        require(ids.length == values.length && ids.length == accounts.length, "S: length err");
        for (uint i = 0; i < accounts.length; i++) {
            mint(accounts[i], ids[i], values[i]);
        }

        return true;
    }

    function mintToBurnBatch(uint256[] memory ids, uint256[] memory values) public onlyOwner returns (bool) {
        require(ids.length == values.length, "S: length err");
        require(minters[_msgSender()], "S: not minter");
        mintBatch(_msgSender(), ids, values);
        burnBatch(_msgSender(), ids, values);
        return true;
    }
}
