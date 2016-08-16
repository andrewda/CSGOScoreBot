/**
 * Copyright (C) 2016 Andrew Dassonville
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */

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
