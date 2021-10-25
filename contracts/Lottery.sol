// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

/**
 * @title Lottery
 * @dev Gabriel
 */
contract Lottery {
    address public manager;
    address[] public players;

    mapping(address => bool) private Addresses;

    constructor() {
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value > 0.01 ether);
        require(contains(msg.sender) == false);
        players.push(msg.sender);
        Addresses[msg.sender] = true;
    }

    function getPlayers() public view returns (address[] memory) {
        return players;
    }

    function pickWinner() public restrictedToManager returns (address) {
        require(players.length > 0);
        uint256 index = randomNumber() % players.length;
        payable(players[index]).transfer(address(this).balance);
        address winner = players[index];
        delete players;
        return winner;
    }

    function randomNumber() private view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.difficulty, block.timestamp, players)
                )
            );
    }

    function contains(address addressToCheck) private view returns (bool) {
        return Addresses[addressToCheck];
    }

    modifier restrictedToManager() {
        require(msg.sender == manager);
        _;
    }
}
