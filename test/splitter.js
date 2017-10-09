var Splitter = artifacts.require("./Splitter.sol");

contract("Splitter", function(accounts) {
    var aliceAcc = accounts[0]; var aliceBalance;
    var bobAcc = accounts[1]; var bobBalance;
    var carolAcc = accounts[2]; var carolBalance;
    var owner = accounts[3]; var ownerBalance;
    var someOtherGuy = accounts[4];

    var contract; var contractBalance;

    beforeEach(function() {
        return Splitter.new(aliceAcc, bobAcc, carolAcc, { from: owner } )
        .then(function(instance) {
            contract = instance;
            return web3.eth.getBalance(aliceAcc)
        })
        .then(function(balance){
            aliceBalance = balance;
            return web3.eth.getBalance(bobAcc)
        })
        .then(function(balance) {
            bobBalance = balance;
            return web3.eth.getBalance(carolAcc);
        })
        .then(function(balance) {
            carolBalance = balance;
            return web3.eth.getBalance(owner);
        })
        .then(function(balance) {
            ownerBalance = balance;
            return web3.eth.getBalance(contract.address);
        }).then(function(balance) {
            contractBalance = balance;
        });
    })

    it("should withdraw the needed amount of money", function() {
        return checkWithdrawal(aliceAcc);
    })


    it("should add munny from for bob and carol", function() {
        var contrib = 10;
        var bobNewBalance;
        var carolNewBalance;
        return contract.financeContract({ from: aliceAcc, value: contrib})
        .then(function(txn){
            return web3.eth.getBalance(carolAcc);
        })
        .then(function(_carolNewBalance){
            carolNewBalance = _carolNewBalance;
            return web3.eth.getBalance(bobAcc);
        })
        .then(function(_bobNewBalance) {
            bobNewBalance = _bobNewBalance;
            assert.strictEqual(carolNewBalance.toString(10), carolBalance.add(contrib / 2).toString(10), "Carol balance raised by the half of alice contribution");
            assert.strictEqual(bobNewBalance.toString(10), bobBalance.add(contrib / 2).toString(10), "Bob balance raised by the half of alice contribution");
        })
    })

    it("should not add munny from for bob and carol", function() {
        var contrib = 10;
        var bobNewBalance;
        var carolNewBalance;
        return contract.financeContract({ from: owner, value: contrib})
        .then(function(txn){
            return web3.eth.getBalance(carolAcc);
        })
        .then(function(_carolNewBalance){
            carolNewBalance = _carolNewBalance;
            return web3.eth.getBalance(bobAcc);
        })
        .then(function(_bobNewBalance) {
            bobNewBalance = _bobNewBalance;
            assert.strictEqual(carolNewBalance.toString(10), carolBalance.toString(10), "Carol balance stayed the same");
            assert.strictEqual(bobNewBalance.toString(10), bobBalance.toString(10), "Bob balance stayed the same");
        })
    })

    it("contract balance should increase by anyone except alice", function(){
        var contrib1 = 10;
        var contrib2 = 20;
        var contrib3 = 30;
        var aliceContrib = 239;

        return contract.financeContract({ from: owner, value: contrib1})
        .then(function(txn){
            return contract.financeContract({ from: carolAcc, value: contrib2})
        })
        .then(function(txn){
            return contract.financeContract({ from: bobAcc, value: contrib3})
        })
        .then(function(txn){
            return contract.financeContract({ from: aliceAcc, value: aliceContrib})
        })
        .then(function(txn){
            return web3.eth.getBalance(contract.address);
        })
        .then(function(_contractNewBalance) {
            assert.strictEqual(_contractNewBalance.toString(10), (contrib1 + contrib2 + contrib3).toString(10), "Contract balance raised");
        })
    })


    function makeSomeContribsAndReturnContractBalance() {
        var contrib1 = 10;
        var contrib2 = 20;
        var contrib3 = 30;
        var aliceContrib = 239;

        return contract.financeContract({ from: owner, value: contrib1})
        .then(function(txn){
            return contract.financeContract({ from: carolAcc, value: contrib2})
        })
        .then(function(txn){
            return contract.financeContract({ from: bobAcc, value: contrib3})
        })
        .then(function(txn){
            return contract.financeContract({ from: aliceAcc, value: aliceContrib})
        })
        .then(function(txn){
            return web3.eth.getBalance(contract.address);
        })
    }

    function killByAcc(contribFunc, killerAcc, canKill) {
        return contribFunc()
        .then(function(txn) {
            return contract.killContract({ from: killerAcc });
        })
        .then(function(txn){
            assert.strictEqual(canKill, true, "Other guy cannot kill the contract")
        })
        .catch(function(e) {
            assert.strictEqual(!canKill, true, "Other guy was not able to kill the contract")
        })
    }

    it("should fail, if some other guy kills the contract", function() {
        return killByAcc(makeSomeContribsAndReturnContractBalance, someOtherGuy, false);
    })
    it("should succeed, if our guy kills the contract", function() {
        return killByAcc(makeSomeContribsAndReturnContractBalance, aliceAcc, true);
    })
    it("should succeed, if our guy kills the contract", function() {
        return killByAcc(makeSomeContribsAndReturnContractBalance, carolAcc, true);
    })
    it("should succeed, if our guy kills the contract", function() {
        return killByAcc(makeSomeContribsAndReturnContractBalance, bobAcc, true);
    })

    function checkWithdrawal(acc) {
        var accBal;
        var contractBal;
        var etherSpent; 
        var gasP = 50000;

        return makeSomeContribsAndReturnContractBalance()
        .then(function(txn) {
            return web3.eth.getBalance(acc)
        })
        .then(function(_accBalance) {
            accBal = _accBalance;
            console.log("Munny on acc", accBal.toString(10))
            return web3.eth.getBalance(contract.address); 
        })
        .then(function(_contractBalance) {
            contractBal = _contractBalance;
            console.log("Munny on contract", contractBal.toString(10))
            return contract.killContract({ from: acc, gasP: 50000 });
        })
        .then(function(txn) {
            etherSpent = gasP * txn.receipt.gasUsed;
            console.log("Munny spent", etherSpent.toString(10))
            
            return web3.eth.getBalance(acc)
        })
        .then(function(accNewBalance) {
            console.log("Munny on acc after", accNewBalance.toString(10))
            var expected = accBal.add(contractBal).sub(etherSpent);
            console.log("Munny expected", expected.toString(10));
            
            assert.strictEqual(expected.toString(10), accNewBalance.toString(10), "The withdrawn munny was corrupted")
        })
    }
})