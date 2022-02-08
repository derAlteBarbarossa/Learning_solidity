// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

contract MultiSigWallet {
    // Type Definitions
    struct Transaction {
        address to;
        uint value;
        bytes data;
        bool executed;
        mapping(address => bool) isConfirmed;
        uint numConfirmations;
        bool exists;
    }

    // State Variables
    address[] public owners;
    uint public numConfirmationRequired;
    mapping(address => bool) public isOwner;

    // As solidity >= 0.7.0 doesn't support nested
    // mappings with arrays
    uint public transactionIndex;
    mapping(uint => Transaction) public transactions;

    // Events
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data);
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);

    // Modifiers
    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier txExists(uint _txIndex) {
        require(transactions[_txIndex].exists, "Transaction doesn't exist");
        _;
    }

    modifier notExecuted(uint _txIndex) {
        require(!transactions[_txIndex].executed, 
            "Already executed the transaction");
        _;
    }

    modifier notConfirmed(uint _txIndex) {
        require(!transactions[_txIndex].isConfirmed[msg.sender], "Transaction doesn't exist");
        _;
    }

    constructor (address[] memory _owners, uint _numConfirmationRequired) public payable {
        uint ownersLength = _owners.length;
        require(ownersLength != 0, "No owners specified");
        require(_numConfirmationRequired > 0, 
            "Required Number of Confirmation should be greater than 0");
        require(_numConfirmationRequired <= ownersLength,
            "Required Number of Confirmation should be less than Number of Owners");
        
        for (uint index = 0; index < ownersLength; index++) {
            require(_owners[index] != address(0), "Owner should not be at address 0!");
            if(isOwner[_owners[index]] != true) {
                owners.push(_owners[index]);
                isOwner[_owners[index]] = true;
            }
        }

        numConfirmationRequired = _numConfirmationRequired;

    }

    fallback() payable external {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function submitTransaction(address _to, uint _value, bytes memory _data)
        public
        onlyOwner
    {
        uint txIndex = transactionIndex++;

        Transaction storage t = transactions[txIndex];

        t.to = _to;
        t.value = _value;
        t.data = _data;
        t.executed = false;
        t.numConfirmations = 0;
        t.exists = true;

        emit SubmitTransaction(msg.sender, txIndex, t.to, t.value, t.data);
    }

    function confirmTransaction(uint _txIndex)
        public
        onlyOwner()
        txExists(_txIndex)
        notExecuted(_txIndex)
        notConfirmed(_txIndex)
    {
        transactions[_txIndex].isConfirmed[msg.sender] = true;
        transactions[_txIndex].numConfirmations++;

        emit ConfirmTransaction(msg.sender, _txIndex);
    }

    function executeTransaction(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];
        require(transaction.numConfirmations >= numConfirmationRequired);

        (bool sent, ) = payable(transaction.to).call{value: transaction.value}(transaction.data);

        transaction.executed = true;

        require(sent, "Sending ETH failed");

        emit ExecuteTransaction(msg.sender, _txIndex);
    }

    function revokeConfirmation(uint _txIndex)
        public
        onlyOwner
        txExists(_txIndex)
        notExecuted(_txIndex)
    {
        Transaction storage transaction = transactions[_txIndex];

        require(transaction.isConfirmed[msg.sender], 
            "Not confirmed yet. Revokation impossible");

        transaction.isConfirmed[msg.sender] = false;
        transaction.numConfirmations--;

        emit RevokeConfirmation(msg.sender, _txIndex);
    }

    function getTransaction(uint _txIndex) 
        public
        view
        returns (address to, uint value, bytes memory data, bool _executed, uint numConfirmations)
    {
        Transaction storage transaction = transactions[_txIndex];

        return (
            transaction.to,
            transaction.value,
            transaction.data,
            transaction.executed,
            transaction.numConfirmations
        );

    }

}
