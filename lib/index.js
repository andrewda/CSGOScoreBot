var Scorebot = require('hltv-livescore');
var RawJS = require('raw.js');
var fuzzy = require('fuzzyset.js');

var enums = Scorebot.Enums;

var self;

function HLTVBot(data) {
    self = this;

    self.game = data.game;

    self.account = data.account;
    self.accounts = data.accounts;
    self.oauth = data.oauth;
    self.debug = data.debug;

    self._sb = new Scorebot();
    self._reddit = new RawJS('CSGOScoreBot');

    self.title;
    self.id;
    self.lastScore = Math.floor(Date.now() / 1000);
    self.bestof = self.game.bestof;
    self.time = self.game.time;
    self.players = fuzzy(self.game.players[0].concat(self.game.players[1]));

    self.hltvTeams = {};
    self.hltvTeams[enums.ESide['TERRORIST']] = self.game.teams[0];
    self.hltvTeams[enums.ESide['COUNTERTERRORIST']] = self.game.teams[1];
}

HLTVBot.prototype.start = function() {
    setInterval(self._checkDisconnect, 30000);

    self._sb.start({
        matchid: self.game.matchid,
        listid: self.game.listid
    });

    self._reddit.setupOAuth2(self.oauth.id, self.oauth.secret);

    self._sb.on('started', function() {
        console.log('established connection');
        self._reddit.auth(self.account, function(err) {
            if (err) {
                console.log('Unable to authenticate user: ' + err);
            } else {
                var tName = self.hltvTeams[enums.ESide['TERRORIST']];
                var ctName = self.hltvTeams[enums.ESide['COUNTERTERRORIST']];

                self.title = tName + ' vs. ' + ctName +
                            ' | BO' + self.bestof +
                            ' | ' + pad(self.time.date) + '/' + pad(self.time.month) + '/' + self.time.year + ' | ' + pad(self.time.hour) + ':' + pad(self.time.min) + ' UTC';

                self._reddit.createLiveThread({
                    title: self.title,
                    description: ''
                }, function(err, id) {
                    self.id = id;

                    if (err) {
                        console.log('Unable to create live thread: ' + err);
                    } else {
                        console.log('https://reddit.com/live/' + self.id);

                        // Sort through accounts and allow other to contribute
                        self.accounts.forEach(function(account) {
                            if (self.account.username !== account.username) {
                                self._reddit.inviteLiveContributor(self.id, account.username, ['close', 'edit', 'manage', 'settings', 'update'], function(err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                        });

                        self._sb.on('roundEnd', function(data) {
                            var winner;

                            self._sb.getTeams(function(teams) {
                                var tTeam = teams[enums.ESide['TERRORIST']];
                                var ctTeam = teams[enums.ESide['COUNTERTERRORIST']];

                                var tBest = tTeam.players[0];
                                var ctBest = ctTeam.players[0];

                                if (self.players.get(tBest.name)) {
                                    tBest.name = self.players.get(tBest.name)[0][1];
                                }

                                if (self.players.get(ctBest.name)) {
                                    ctBest.name = self.players.get(ctBest.name)[0][1];
                                }

                                winner = data.winner.name;

                                setTimeout(function() {
                                    var message;
                                    var scoremessage;

                                    if (data.knifeRound) {
                                        message = winner + ' won the knife round';
                                        scoremessage = 'Side|Team|Score|Best Player \n' +
                                                       ':--|:--|:--|:-- \n' +
                                                       'CT|' + ctTeam.name + '|0|' + ctBest.name + ' (' + ctBest.kills + '/' + ctBest.assists + '/' + ctBest.deaths + ') \n' +
                                                       'T|' + tTeam.name + '|0|' + tBest.name + ' (' + tBest.kills + '/' + tBest.assists + '/' + tBest.deaths + ')';
                                    } else {
                                        message = winner + ' won the round';
                                        scoremessage = 'Side|Team|Score|Best Player \n' +
                                                       ':--|:--|:--|:-- \n' +
                                                       'CT|' + ctTeam.name + '|' + ctTeam.score + '|' + ctBest.name + ' (' + ctBest.kills + '/' + ctBest.assists + '/' + ctBest.deaths + ') \n' +
                                                       'T|' + tTeam.name + '|' + tTeam.score + '|' + tBest.name + ' (' + tBest.kills + '/' + tBest.assists + '/' + tBest.deaths + ')';
                                    }

                                    self._reddit.liveUpdate(self.id, message + '\n\n' + scoremessage, function(err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }, 500);
                            });
                        });

                        self._sb.on('bombPlanted', function(data) {
                            var player = data.player;

                            if (self.players.get(player.name)) {
                                player.name = self.players.get(player.name)[0][1];
                            }

                            var message = player.name + ' (' + player.team.name + ') planted the bomb';

                            self._reddit.liveUpdate(self.id, message, function(err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        });

                        self._sb.on('bombDefused', function(data) {
                            var player = data.player;

                            if (self.players.get(player.name)) {
                                player.name = self.players.get(player.name)[0][1];
                            }

                            var message = player.name + ' (' + player.team.name + ') defused the bomb';

                            self._reddit.liveUpdate(self.id, message, function(err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        });

                        self._sb.on('scoreboard', function() {
                            self.lastScore = Math.floor(Date.now() / 1000);

                            self._updateScoreboard();
                        });

                        if (self.debug) {
                            self._sb.on('debug', function(message) {
                                console.log(message);
                            });

                            self._sb.on('log', function(log) {
                                console.log(log);
                            });
                        }
                    }
                });
            }
        });
    });
};

HLTVBot.prototype._updateScoreboard = function() {
    self._formatScoreboard(function(err, scoreboard) {
        if (!err) {
            self._reddit.editLiveThread(self.id, self.title, '', scoreboard, function(err) {
                if (err) {
                    console.log(err);
                }
            });
        }
    });
};

HLTVBot.prototype._formatScoreboard = function(callback) {
    self._sb.getTeams(function(teams) {
        var tTeam = teams[enums.ESide['TERRORIST']];
        var ctTeam = teams[enums.ESide['COUNTERTERRORIST']];

        var tTable = tTeam.name + '|K|A|D\n:--|:--|:--|:-- ';
        var ctTable = ctTeam.name + '|K|A|D\n:--|:--|:--|:-- ';

        if (tTeam.players.length && ctTeam.players.length) {
            tTeam.players.forEach(function(player) {
                if (self.players.get(player.name)) {
                    player.name = self.players.get(player.name)[0][1];
                }

                tTable += '\n' + player.name + '|' + player.kills + '|' + player.assists + '|' + player.deaths;
            });

            ctTeam.players.forEach(function(player) {
                if (self.players.get(player.name)) {
                    player.name = self.players.get(player.name)[0][1];
                }

                ctTable += '\n' + player.name + '|' + player.kills + '|' + player.assists + '|' + player.deaths;
            });

            callback(null, tTable + '\n\n' + ctTable);
        } else {
            callback(new Error('No players connected'));
        }
    });
};

HLTVBot.prototype._checkDisconnect = function() {
    if (typeof self.lastScore !== 'undefined') {
        if (Math.floor(Date.now() / 1000) - self.lastScore > 1800) {
            console.log('Disconnecting');

            self._sb.disconnect();
            process.send({
                type: 'disconnect'
            });

            setTimeout(function() {
                process.exit();
            }, 250);
        }
    }
};

function pad(time) {
    var fullTime;

    if (time < 10) {
        fullTime = '0' + time;
    } else {
        fullTime = time;
    }

    return fullTime;
}

module.exports = HLTVBot;
