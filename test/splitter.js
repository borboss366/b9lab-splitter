var Splitter = artifacts.require("./Splitter.sol");

contract("Splitter", function(accounts) {
    var contract;

    let owner = accounts[0];
    let party1 = accounts[1];
    let party2 = accounts[2];
    let source = accounts[3];

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

    it("should check that the contribution is at the account balance, if split is not specified", 
    () => { return checkClearContributionSet(owner, 239) })
    it("should check that the contribution is at the account balance, if split is not specified", 
    () => { return checkClearContributionSet(party1, 40) })
    it("should check that the contribution is at the account balance, if split is not specified", 
    () => { return checkClearContributionSet(party2, 38) })
    it("should check that the contribution is at the account balance, if split is not specified", 
    () => { return checkClearContributionSet(source, 37) })


    it("should check that the contribution is splitted, if split was specified", 
    () => { return checkContribution(source, party1, party2, 239) })
    it("should check that the contribution is splitted, if split was specified", 
    () => { return checkContribution(source, party1, party2, 240) })

    it("should check that the contribution is splitted, if split was specified", 
    () => { return checkContribution(source, source, party2, 239) })
    it("should check that the contribution is splitted, if split was specified", 
    () => { return checkContribution(source, source, party2, 240) })

    it("should check that the contribution is splitted, if split was specified", 
    () => { return checkContribution(source, party1, source, 239) })
    it("should check that the contribution is splitted, if split was specified", 
    () => { return checkContribution(source, party1, source, 240) })

    it("should fail, if zero ether is contribuited", 
    () => { return contract.contribute({from: source, value: 0}).then(txn => assert.strictEqual(true, false, "It should fail")).catch(e => {}) })

    it("should fail, if withdraw from empty account", 
    () => { return checkWithdrawFailAccount(source) })

    it("should fail, if withdraw from empty account", 
    () => { return checkWithdrawFailAccount(party1) })

    it ("should check, that the account balance is changed ok after withdrawal",
    () => { return checkWithdrawalAccount(source) })

    it ("should check, that the account balance is changed ok after withdrawal",
    () => { return getContributionAccountData(source, source, source, 4000000000000).then(data => checkWithdrawalAccount(source)) })

    it ("should check, that the account balance is changed ok after withdrawal",
    () => { return getContributionAccountData(source, party1, party2, 4000000000000)
        .then(data => { return getContributionAccountData(source, party1, source, 1)})
        .then(data => checkWithdrawalAccount(source)) })
        
    it ("should check that the parties, that are set are set correctly",
    () => { 
        return getContributionAccountData(source, source, source, 4000000000000)
        .then(data => { return contract.setRecipients(party1, party2, {from: source})})
        .then(txn => { return contract.getParty1(source, {from: source})})
        .then(p1 => { assert.strictEqual(party1, p1, "Party1 should be set correctly"); return contract.getParty2(source, {from: source}) })
        .then(p2 => { assert.strictEqual(party2, p2, "Party2 should be set correctly") } )
    })
    

    function checkClearContribution(acc, value) {
        return getContributionAccountData(acc, acc, acc, value)
        .then(data => checkAccountBalance(data))
    }

    function checkClearContributionSet(acc, value) {
        return setSplit(acc, acc, acc)
        .then(tx => getContributionAccountData(acc, acc, acc, value))
        .then(data => checkAccountBalance(data))
    }
    
    function checkContribution(acc, party1, party2, value) {
        return setSplit(acc, party1, party2)
        .then(tx => getContributionAccountData(acc, party1, party2, value))
        .then(data => checkAccountBalance(data))
    }

    function checkAccountBalance(data) {
        if (data.acc == data.party1 && data.acc == data.party2) { 
            assert.strictEqual(data.before.add(data.contribution).toString(10), data.after.toString(10), "Account increased without split");
        } else {
            let contrib1 = Math.floor(data.contribution / 2);
            let contrib2 = data.contribution - contrib1;

            if (data.acc != data.party1 && data.acc != data.party2) {
                assert.strictEqual(data.before.toString(10), data.after.toString(10), "Account changed after split"); 
                assert.strictEqual(data.beforeParty1.add(contrib1).toString(10), data.afterParty1.toString(10), "Split account changed by half"); 
                assert.strictEqual(data.beforeParty2.add(contrib2).toString(10), data.afterParty2.toString(10), "Split account stayed the same"); 
            } else if (data.acc == data.party1) {
                assert.strictEqual(data.before.add(contrib1).toString(10), data.after.toString(10), "Account changed after split"); 
                assert.strictEqual(data.beforeParty2.add(contrib2).toString(10), data.afterParty2.toString(10), "Split account stayed the same"); 
            } else if (data.acc == data.party2) {
                assert.strictEqual(data.before.add(contrib2).toString(10), data.after.toString(10), "Account changed after split"); 
                assert.strictEqual(data.beforeParty1.add(contrib1).toString(10), data.afterParty1.toString(10), "Split account changed by half"); 
            }
        } 
    }

    function getBalance(acc) {
        return new Promise(function(resolve, reject) {
            web3.eth.getBalance(acc, function(e, balance) { resolve(balance); });
        });
    }

    // contributes the value to the account, and than checks the balance of it
    function getContributionAccountData(acc, party1, party2, value) {
        let dataObj = new Object();

        dataObj.acc = acc;
        dataObj.party1 = party1;
        dataObj.party2 = party2;
        dataObj.contribution = value;

        return contract.getBalance(acc, {from: acc})
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

    function checkWithdrawFailAccount(acc) {
        return contract.withdrawRefund({from :acc})
        .then(tx => assert.strictEqual(true, false, "It should fail")).catch(e => {})
    }

    // assert.strictEqual(data.before.toString(10), data.after.plus(costContribute).plus(costWithdraw).toString(10), "balance of the account should remain the same")
    function getWithdrawalData(acc) {
        let data = new Object();
        
        let gasContribute;
        let priceContribute;
        let gasWithdrawn;
        let priceWithdrawn;

        return contract.getBalance(acc)
        .then(contractBalance => {data.contractBalance = contractBalance; return getBalance(source)})
        .then(balance => { data.before = balance; return contract.contribute({from: source, value: 1000 * 1000 * 1000})})
        .then(txn => { gasContribute = txn.receipt.gasUsed; return web3.eth.getTransaction(txn.tx)})
        .then(tx => { priceContribute = tx.gasPrice; return contract.withdrawRefund({from: source})})
        .then(txn => { gasWithdrawn = txn.receipt.gasUsed; return web3.eth.getTransaction(txn.tx) })
        .then(tx => { priceWithdrawn = tx.gasPrice; return getBalance(source) })
        .then(balance => { 
            data.after = balance; 
            data.costContribute = priceContribute.times(gasContribute);
            data.costWithdraw = priceWithdrawn.times(gasWithdrawn);
            return data; })
    }

    function checkWithdrawalBalance(data) {
        assert.strictEqual(data.before.plus(data.contractBalance).toString(10), data.after.plus(data.costContribute).plus(data.costWithdraw).toString(10), "balance of the account should remain the same")
    }

    function checkWithdrawalAccount(acc) {
        return getWithdrawalData(acc)
        .then(data => checkWithdrawalBalance(data))
    }
})