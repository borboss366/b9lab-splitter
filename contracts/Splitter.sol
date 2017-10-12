pragma solidity ^0.4.15;

/*
There are four types of parties.
1. Owner of the contract. Can kill and terminate the contract
2. Splitter address - can set up the two parties for receiving splitter money.
3. party1
4. party2 - they are receipients of the split

If the ether is sent to contract and the party1 and party2 are specified, that the value is split and distributed between party1 and party2,
otherwise it is just stored on the balance of the sender.
*/
contract Splitter {
    // Owner of this contract
    address public owner;

    // the splitters, who decided to participate in splitting
    mapping (address => SplitterUsers) splitters;

    /*
    The structure to set up splits for the splitters
    */
    struct SplitterUsers {
        address party1;
        address party2;
        uint balance;
    }

    event LogSplitted(uint amount, address splitter, address party1, address party2);
    event LogWithdrawn(uint amount, address beneficiary);

    function Splitter() 
        public {
        owner = msg.sender;
    }

    function setRecipients(address party1, address party2) 
        public {
        splitters[msg.sender].party1 = party1;
        splitters[msg.sender].party2 = party2;
    }

    function clearRecipients()
        public {
        setRecipients(msg.sender, msg.sender);
    }

    function getBalance(address account) 
        public 
        constant
        returns (uint) {
        return splitters[account].balance;
    }

    function getParty1(address account)
        public
        constant
        returns (address) {
        return splitters[account].party1;
    }

    function getParty2(address account)
        public
        constant
        returns (address) {
        return splitters[account].party2;
    }

    function incBalance(address recp, uint amount) 
        private {
        splitters[recp].balance += amount;
    }

    function contribute()
        payable
        hasMoney
        public {

        // check that the addresses are not null, if they are null, than set them to the msg.sender value
        if (splitters[msg.sender].party1 == address(0x0)) { splitters[msg.sender].party1 = msg.sender; }
        if (splitters[msg.sender].party2 == address(0x0)) { splitters[msg.sender].party2 = msg.sender; }

        // safe distribution in two parts
        uint party1part = msg.value / 2;
        uint party2part = msg.value - party1part;
        incBalance(splitters[msg.sender].party1, party1part);
        incBalance(splitters[msg.sender].party2, party2part);
        LogSplitted(msg.value, msg.sender, splitters[msg.sender].party1, splitters[msg.sender].party2);
    }

    modifier hasMoney() {
        require (msg.value > 0);
        _;
    }

    function withdrawRefund() external {
        uint refund = splitters[msg.sender].balance;
        if (refund == 0) revert(); // nothing to send
        splitters[msg.sender].balance = 0;
        msg.sender.transfer(refund);
        LogWithdrawn(refund, msg.sender);
    }

    /*
    As mentioned here, this is the default way to handle this function.
    https://ethereum.stackexchange.com/questions/7570/whats-a-fallback-function-when-using-address-send
    */
    function() public {
        revert();
    }
}