pragma solidity ^0.4.15;

contract Splitter {
    // the addresses of the users of this contract
    address public alice;
    address public bob;
    address public carol;
    address public owner;

    event LogDeath(address killer, uint amount);
    event LogContribution(uint amount, address sender);
    event LogAliceSend(uint amount, uint bobpart, uint carolpart);

    function Splitter(address _alice, address _bob, address _carol) public {
        owner = msg.sender;
        alice = _alice;
        bob = _bob;
        carol = _carol;
    }

    /*
    Only participating parties can change the state of this contract
    */
    modifier innerCircle () {
        require(msg.sender == owner || msg.sender == alice || msg.sender == bob || msg.sender == carol);
        _;
    }

    modifier hasMunny() {
        require (msg.value > 0);
        _;
    }

    function killContract() 
        innerCircle 
        public 
        returns (bool success) {
        uint amount = this.balance;
        
        LogDeath(owner, amount);
        selfdestruct(msg.sender);
        return true;
    }

    function financeContract() 
        public
        payable
        hasMunny
        returns (bool success)
    {
        if (msg.sender == alice) {
            var bobpart = msg.value / 2;
            var carolpart = msg.value - bobpart;

            bob.transfer(bobpart);
            carol.transfer(carolpart);
            
            LogAliceSend(msg.value, bobpart, carolpart);
        } else {
            LogContribution(msg.value, msg.sender);
        }    

        return true;
    }

    /*
    As mentioned here, this is the default way to handle this function.
    https://ethereum.stackexchange.com/questions/7570/whats-a-fallback-function-when-using-address-send
    */
    function() public {
        revert();
    }

    // function () 
    //     payable // it should receive ether
    //     public {
        
    //     // split the amount of ether sent here
    //     if (msg.sender == alice) {
    //         var bobpart = msg.value / 2;
    //         var carolpart = msg.value - bobpart;

    //         bob.transfer(bobpart);
    //         carol.transfer(carolpart);
            
    //         LogAliceSend(msg.value, bobpart, carolpart);
    //     } 
    // }
}