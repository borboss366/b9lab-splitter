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
    event LogContributed(uint amount, address splitter);
    event LogWithdrawn(uint amount, address beneficiary);

    function Splitter() 
        public {
        owner = msg.sender;
    }

    function setRecipients(address party1, address party2) 
        public {

        // You cannot split to your own account
        if (party1 == msg.sender) revert();
        if (party2 == msg.sender) revert();
        
        splitters[msg.sender].party1 = party1;
        splitters[msg.sender].party2 = party2;
    }

    function clearRecipients()
        public {
        setRecipients(address(0x0), address(0x0));
    }

    function getBalance(address account) 
        public 
        constant
        returns (uint) {
        return splitters[account].balance;
    }


    /*
    Idea taken from here - https://ethereum.stackexchange.com/questions/6756/ways-to-see-if-address-is-empty
    */
    function isAddressSet(address addr)
        public 
        constant
        returns (bool) {
        return addr != address(0x0);
    }

    function isSplitterSet(address splitter) 
        public 
        constant
        returns (bool) {
        return isAddressSet(splitters[splitter].party1) && isAddressSet(splitters[splitter].party2);
    }

    function incBalance(address recp, uint amount) 
        private {
        splitters[recp].balance += amount;
    }

    /*
    function getparty2Part(uint amount) 
        constant
        public  
        returns (uint) {
        return amount / 2;
    }

    function getparty1Part(uint amount) 
        constant
        public  
        returns (uint) {
        return amount - getparty2Part(amount);
    }
    */

    function contribute()
        payable
        hasMoney
        public {
        
        if (isSplitterSet(msg.sender)) {
            uint party1part = msg.value / 2;
            uint party2part = msg.value - party1part;

            incBalance(splitters[msg.sender].party1, party1part);
            incBalance(splitters[msg.sender].party2, party2part);
            LogSplitted(msg.value, msg.sender, splitters[msg.sender].party1, splitters[msg.sender].party2);
        } else {
            // increase the amount of ether on the balance
            splitters[msg.sender].balance += msg.value;
            LogContributed(msg.value, msg.sender);
        }
    }

    modifier hasMoney() {
        require (msg.value > 0);
        _;
    }

    function withdrawRefund() external {
        uint refund = splitters[msg.sender].balance;
        if (refund == 0) revert(); // nothing to send
        splitters[msg.sender].balance = 0;
        require(msg.sender.send(refund)); // revert state if send fails
        LogWithdrawn(refund, msg.sender);
    }

    /*
    As mentioned here, this is the default way to handle this function.
    https://ethereum.stackexchange.com/questions/7570/whats-a-fallback-function-when-using-address-send
    */
    function() public {
        revert();
    }


    // function killContract() 
    //     innerCircle 
    //     public 
    //     returns (bool success) {
    //     uint amount = this.balance;
        
    //     LogDeath(owner, amount);
    //     selfdestruct(msg.sender);
    //     return true;
    // }

    // function financeContract() 
    //     public
    //     payable
    //     hasMoney
    //     returns (bool success)
    // {
    //     if (msg.sender == alice) {
    //         var party2part = msg.value / 2;
    //         var party1part = msg.value - party2part;

    //         party2.transfer(party2part);
    //         party1.transfer(party1part);
            
    //         LogAliceSend(msg.value, party2part, party1part);
    //     } else {
    //         LogContribution(msg.value, msg.sender);
    //     }    

    //     return true;
    // }

    // function () 
    //     payable // it should receive ether
    //     public {
        
    //     // split the amount of ether sent here
    //     if (msg.sender == alice) {
    //         var party2part = msg.value / 2;
    //         var party1part = msg.value - party2part;

    //         party2.transfer(party2part);
    //         party1.transfer(party1part);
            
    //         LogAliceSend(msg.value, party2part, party1part);
    //     } 
    // }
}