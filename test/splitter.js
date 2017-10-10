var Splitter = artifacts.require("./Splitter.sol");

contract("Splitter", function(accounts) {
    var contract;
    var owner = accounts[0];
    var party1 = accounts[1];
    var party2 = accounts[2];
    var source = accounts[3];

    beforeEach(function() {
        // init the contract with new instance each time
        return Splitter.new({ from: owner } )
        .then(instance => contract = instance)
    })


    it("should check that the contribution is at the account balance, if split is not specified", 
    () => { return checkClearContribution(owner, 239) })
    it("should check that the contribution is at the account balance, if split is not specified", 
    () => { return checkClearContribution(party1, 40) })
    it("should check that the contribution is at the account balance, if split is not specified", 
    () => { return checkClearContribution(party2, 38) })
    it("should check that the contribution is at the account balance, if split is not specified", 
    () => { return checkClearContribution(source, 37) })

    it("should check that the contribution is splitted, if split was specified", 
    () => { return checkSplitContribution(source, party1, party2, 239) })
    it("should check that the contribution is splitted, if split was specified", 
    () => { return checkSplitContribution(source, party1, party2, 240) })

    it("should fail, if zero ether is contribuited", 
    () => { return contract.contribute({from: source, value: 0}).then(txn => assert.strictEqual(true, false, "It should fail")).catch(e => {}) })

    it("should fail, if set own address as recipient", 
    () => { return contract.setRecipients(source, party2, {from: source}).then(txn => assert.strictEqual(true, false, "It should fail")).catch(e => {}) })
    it("should fail, if set own address as recipient", 
    () => { return contract.setRecipients(party1, source, {from: source}).then(txn => assert.strictEqual(true, false, "It should fail")).catch(e => {}) })
    it("should fail, if set own address as recipient", 
    () => { return contract.setRecipients(party1, party2, {from: source}).then(txn => assert.strictEqual(true, false, "It should fail")).catch(e => {}) })

    it("should fail, if withdraw from empty account", 
    () => { return checkWithdrawFailAccount(source) })

    it ("should check, that the account balance is changed ok after withdrawal",
    () => { return getContributionAccountData(source, null, null, 4000000000000).then(data => checkWithdrawalAccount(source)) })

    it("should check the account balance after contributing and withdrawing", 
    () => { 
        var before;
        var after;
        var gasContribute;
        var priceContribute;
        var gasWithdrawn;
        var priceWithdrawn;

        return getBalance(source) 
        .then(balance => { before = balance; return contract.contribute({from: source, value: 1000 * 1000 * 1000})})
        .then(txn => { gasContribute = txn.receipt.gasUsed; return web3.eth.getTransaction(txn.tx)})
        .then(tx => { priceContribute = tx.gasPrice; return contract.withdrawRefund({from: source})})
        .then(txn => { gasWithdrawn = txn.receipt.gasUsed; return web3.eth.getTransaction(txn.tx) })
        .then(tx => { priceWithdrawn = tx.gasPrice; return getBalance(source) })
        .then(balance => { 
            after = balance; 
            var costContribute = priceContribute.times(gasContribute);
            var costWithdraw = priceWithdrawn.times(gasWithdrawn);
            assert.strictEqual(before.toString(10), after.plus(costContribute).plus(costWithdraw).toString(10), "balance of the account should remain the same")} )
    })

    function getBalance(acc) {
        return new Promise(function(resolve, reject) {
            web3.eth.getBalance(acc, function(e, balance) { resolve(balance); });
        });
    }


    // contributes the value to the account, and than checks the balance of it
    function getContributionAccountData(acc, party1, party2, value) {
        var dataObj = new Object();
        dataObj.contribution = value;

        return contract.isSplitterSet(acc)
        .then(split => { dataObj.split = split; return contract.getBalance(acc, {from: acc})})
        .then(before => { dataObj.before = before; return contract.getBalance(party1, {from: acc})})
        .then(beforeParty1 => { dataObj.beforeParty1 = beforeParty1; return contract.getBalance(party2, {from: acc})})
        .then(beforeParty2 => { dataObj.beforeParty2 = beforeParty2; return contract.contribute({from: acc, value: value})})
        .then(txn => { return contract.getBalance(acc, {from: acc})})
        .then(after => { dataObj.after = after; return contract.getBalance(party1, {from: acc})})
        .then(afterParty1 => { dataObj.afterParty1 = afterParty1; return contract.getBalance(party2, {from: acc})})
        .then(afterParty2 => { dataObj.afterParty2 = afterParty2; return dataObj })
    }

    function clearSplit(acc) {
        return contract.clearRecipients({from: acc});
    }

    function setSplit(acc, party1, party2) {
        return contract.setRecipients(party1, party2, {from: acc});
    }

    function checkAccountBalance(data) {
        if (data.split) { 
            var contrib1 = Math.floor(data.contribution / 2);
            var contrib2 = data.contribution - contrib1;
            assert.strictEqual(data.before.toString(10), data.after.toString(10), "Account changed after split"); 
            assert.strictEqual(data.beforeParty1.add(contrib1).toString(10), data.afterParty1.toString(10), "Split account changed by half"); 
            assert.strictEqual(data.beforeParty2.add(contrib2).toString(10), data.afterParty2.toString(10), "Split account stayed the same"); 
        } else { 
            assert.strictEqual(data.before.add(data.contribution).toString(10), data.after.toString(10), "Account increased without split");
            assert.strictEqual(data.beforeParty1.toString(10), data.afterParty1.toString(10), "Split account stayed the same"); 
            assert.strictEqual(data.beforeParty2.toString(10), data.afterParty2.toString(10), "Split account stayed the same"); 
        }
    }
    
    function checkClearContribution(acc, value) {
        return clearSplit(acc)
        .then(tx => getContributionAccountData(acc, null, null, value))
        .then(data => checkAccountBalance(data))
    }

    function checkSplitContribution(acc, party1, party2, value) {
        return setSplit(acc, party1, party2)
        .then(tx => getContributionAccountData(acc, party1, party2, value))
        .then(data => checkAccountBalance(data))
    }

    function checkWithdrawFailAccount(acc) {
        return contract.withdrawRefund({from :acc})
        .then(tx => assert.strictEqual(true, false, "It should fail")).catch(e => {})
    }

    function getWithdrawalData(acc) {
        var data = new Object();

        return contract.getBalance(acc, {from: acc})
        .then(before => { data.before = before; return web3.eth.getBalance(contract.address)})
        .then(contractBefore => { data.contractBefore = contractBefore; return web3.eth.getBalance(acc)})
        .then(accBefore => { data.accBefore = accBefore; return contract.withdrawRefund({from: acc});})
        .then(txn => { data.gasUsed = txn.receipt.gasUsed; return web3.eth.getTransaction(txn.tx) })
        .then(tx => {data.price = tx.gasPrice.times(data.gasUsed); return contract.getBalance(acc, {from: acc})})
        .then(after => { data.after = after; return web3.eth.getBalance(contract.address)} )
        .then(contractAfter => { data.contractAfter = contractAfter; return web3.eth.getBalance(acc); })
        .then(accAfter => { data.accAfter = accAfter; return data;})
    }

    function checkWithdrawalBalance(data) {
        assert.strictEqual(data.before.minus(data.after).toString(10), data.contractBefore.minus(data.contractAfter).toString(10), 
            "The amount of changed account data equals to the withdrawn data");
        assert.strictEqual(data.accAfter.minus(data.accBefore).plus(data.price).toString(10), data.contractBefore.minus(data.contractAfter).toString(10), 
            "The amount of changed account data equals to the withdrawn data")
    }

    function checkWithdrawalAccount(acc) {
        return getWithdrawalData(acc)
        .then(data => checkWithdrawalBalance(data))
    }

})