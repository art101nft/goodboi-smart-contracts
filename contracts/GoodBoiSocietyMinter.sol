// SPDX-License-Identifier: MIT
// GoodBoi Society Reserve Minter
// I copied and modified this contract from NekoCore (nekocore.io) who
// encountered a similar issue where they made the mint price a constant
// in which the value cannot be changed. They wanted to adjust the mint
// price after launch but could not. The workaround is very clever.
// Big props to selkirk.rex for this idea (idk if original, but new to me).
// Here's how it works:
//
// Deploy a new contract alongside the existing one; reference existing one
// Transfer ownership of existing contract to this new contract
// Provide a `mint` function on this contract which accepts 0 ether but leverages
//     the existing contract's `mintDoge` function and pays the mint fee
//     out of this contract funds
// Allow this contract the ability withdraw funds from the existing contract
// Integrate new contract into the old frontend to offer the mint for free
//
// Minters can pay 0 ETH (gas fees) on your new contract,
// which mints against the old contract on their behalf,
// withdraws funds on the old contract into the new to refuel,
// pays from the contract funds,
// then transfers the NFT to the minter.
//
// Pretty sick!


pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/access/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC721/IERC721Receiver.sol";
import "./GoodBoiSociety.sol";

contract GoodBoiSocietyMinter is IERC721Receiver, Ownable {
    GoodBoiSociety public ORIGINAL_CONTRACT;
    bool public MINTABLE = false;
    uint256 public MAX_MINT = 3;

    // constructor
    // ---------------------------------------------------------
    constructor(address gbsAddress) {
        setTargetContract(gbsAddress);
    }

    // modifiers
    // ---------------------------------------------------------
    modifier refuelIfNeeded(uint256 count) {
        if (address(this).balance < (ORIGINAL_CONTRACT.dogePrice() * count)) {
            _refuel();
        }
        _;
    }

    modifier onlyIfMintable(uint256 count) {
        require(MINTABLE, "Contract is not currently mintable.");
        require(count <= MAX_MINT, "Would exceed max per mint.");
        require(ORIGINAL_CONTRACT.totalSupply() + count <= ORIGINAL_CONTRACT.MAX_DOGES(), "Would exceed max supply.");
        require(ORIGINAL_CONTRACT.RAND_PRIME() != 0, "RAND_PRIME not set.");
        require(ORIGINAL_CONTRACT.TIMESTAMP() != 0, "TIMESTAMP not set.");
        _;
    }

    // required overrides
    // ---------------------------------------------------------
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // public functions
    // ---------------------------------------------------------
    function mint(uint256 count)
        external
        payable
        onlyIfMintable(count)
        refuelIfNeeded(count)
    {
        for(uint256 i = 0; i < count; i++) {
            uint256 index = ORIGINAL_CONTRACT.totalSupply() + 1;
            uint256 seq = ORIGINAL_CONTRACT.RAND_PRIME() * index;
            uint256 seqOffset = seq + ORIGINAL_CONTRACT.TIMESTAMP();
            uint256 tokenId = (seqOffset % ORIGINAL_CONTRACT.MAX_DOGES()) + 1; // Prevent tokenId 0
            // Mint a doge and transfer to buyer
            ORIGINAL_CONTRACT.mintDoge{value: ORIGINAL_CONTRACT.dogePrice()}(1);
            ORIGINAL_CONTRACT.safeTransferFrom(
                address(this),
                msg.sender,
                tokenId
            );
        }

        if (ORIGINAL_CONTRACT.totalSupply() == ORIGINAL_CONTRACT.MAX_DOGES()) {
            // flip back contract once max supply is reached
            MINTABLE = false;
        }
    }

    // onlyOwner
    // ---------------------------------------------------------
    function setMintable(bool mintable) external onlyOwner {
        MINTABLE = mintable;
    }

    function setTargetContract(address gbs) public onlyOwner {
        ORIGINAL_CONTRACT = GoodBoiSociety(gbs);
    }

    function reclaimOwnership() external onlyOwner {
        // to avoid out-of-fuel errors, we allow this contract to temporarily be
        // the owner of the target contract.
        //
        // This function allows the owner of THIS contract to reclaim
        // ownership of the ORIGINAL contract
        ORIGINAL_CONTRACT.transferOwnership(_msgSender());
    }

    function withdraw(uint256 amtWei) external onlyOwner {
        // special case for '0' withdraw, transfer full balance
        if (amtWei == 0) {
            amtWei = address(this).balance;
        }
        payable(_msgSender()).transfer(amtWei);
    }

    // internal
    // ---------------------------------------------------------
    function _refuel() internal {
        ORIGINAL_CONTRACT.withdraw();
    }

    // fallbacks (ability to fund this contract)
    // ---------------------------------------------------------
    receive() external payable {}
}
