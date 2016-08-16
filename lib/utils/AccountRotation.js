var self;

function AccountRotation(accounts, reset) {
    self = this;

    self.accounts = accounts;
    self.resetTime = reset;

    self._currentAccount = 0;
    self._resetTimer;
}

AccountRotation.prototype.getAccount = function() {
    return self.accounts[self._currentAccount];

    if (self.accounts[self._currentAccount + 1]) {
        self._currentAccount++;
    } else {
        self._currentAccount = 0;
    }

    if (self.resetTime) {
        self._resetTimer = setTimeout(self.resetAccount, self.resetTime);
    }
}

AccountRotation.prototype.resetAccount = function() {
    self._currentAccount = 0;
}

module.exports = AccountRotation;
