// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.18;

import "@rmrk-team/evm-contracts/contracts/RMRK/extension/emotable/RMRKEmoteTracker.sol";
// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract EmoteRepository is RMRKEmoteTracker {

    function getEmotesPerAddress(address emoter, address collection, uint256 tokenId, bytes4 emoji) public view returns (uint256) {
        return _emotesPerAddress[emoter][collection][tokenId][emoji];
    }

    function emote(
        address collection,
        uint256 tokenId,
        bytes4 emoji,
        bool state
    ) external override {
        _emote(collection, tokenId, emoji, state);
    }
}
