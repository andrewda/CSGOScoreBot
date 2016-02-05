var Scorebot = require('hltv-scorebot');
var LiveGames = require('hltv-live-games');
var rawjs = require('raw.js');
var FuzzySet = require('fuzzyset.js');

var reddit = new rawjs('CSGOScoreBot');
var sb = new Scorebot();
var lg = new LiveGames({
    pollTime: 10000
});

var connected = false;
var bestof, time, players, lastScore, title;
var teams = {
    t: {},
    ct: {}
};

reddit.setupOAuth2('id', 'secret');

lg.on('newGame', function(game) {
    console.log('GAME NOW LIVE: ' + game.matchid);
    if (!connected) {
        console.log(game);

        teams.t.name = game.teams[0];
        teams.ct.name = game.teams[1];

        bestof = game.bestof;

        time = game.time;

        players = FuzzySet(game.players[0].concat(game.players[1]));

        sb.connect(game.matchid, game.listid);
        connected = true;

        lastScore = Math.floor(Date.now() / 1000);
    }
});

sb.on('connected', function() {
    console.log('established connection');
    reddit.auth({
        'username': 'username',
        'password': 'password'
    }, function(err, response) {
        if (err) {
            console.log('Unable to authenticate user: ' + err);
        } else {
            title = teams.t.name + ' vs. ' + teams.ct.name + ' | BO' + bestof + ' | ' + double(time.date) + '/' + double(time.month) + '/' + time.year + ' | ' + double(time.hour) + ':' + double(time.min) + ' UTC';
            reddit.createLiveThread({
                title: title,
                description: ''
            }, function(err, id) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(id);

                    reddit.inviteLiveContributor(id, 'admin', ['close', 'edit', 'manage', 'settings', 'update'], function(err) {
                        if (err) {
                            console.log(err);
                        }
                    });

                    sb.on('roundEnd', function(data) {
                        var winner;

                        if (teams.ct.players && teams.t.players) {
                            if (teams.ct.players.length > 0 && teams.t.players.length > 0) {
                                var ctBest = teams.ct.players[0].name;
                                var tBest = teams.t.players[0].name;

                                if (players.get(teams.ct.players[0].name)) {
                                    ctBest = players.get(teams.ct.players[0].name)[0][1];
                                }

                                if (players.get(teams.t.players[0].name)) {
                                    tBest = players.get(teams.t.players[0].name)[0][1];
                                }

                                if (data.winner === 0) {
                                    winner = teams.t.name;
                                } else {
                                    winner = teams.ct.name;
                                }

                                setTimeout(function() {
                                    console.log(winner + ' won the round');
                                    if (!data.knifeRound) {
                                        var message = winner + ' won the round';
                                        var scoremessage = 'Side|Team|Score|Best Player \n :--|:--|:--|:-- \n CT|' + teams.ct.name + '|' + data.score.ct + '|' + ctBest + ' (' + teams.ct.players[0].score + '/' + teams.ct.players[0].assists + '/' + teams.ct.players[0].deaths + ')\nT|' + teams.t.name + '|' + data.score.t + '|' + tBest + ' (' + teams.t.players[0].score + '/' + teams.t.players[0].assists + '/' + teams.t.players[0].deaths + ')';
                                        reddit.liveUpdate(id, message + '\n\n' + scoremessage, function(err) {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });
                                    } else {
                                        var message = winner + ' won the knife round';
                                        reddit.liveUpdate(id, message, function(err) {
                                            if (err) {
                                                console.log(err);
                                            }
                                        });
                                    }
                                }, 500);
                            }
                        }
                    });

                    sb.on('bombPlanted', function(data) {
                        var message = data.player.name + ' (' + teams.t.name + ') planted the bomb';

                        if (players.get(data.player.name)) {
                            message = players.get(data.player.name)[0][1] + ' (' + teams.t.name + ') planted the bomb';
                        }

                        reddit.liveUpdate(id, message, function(err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    });

                    sb.on('bombDefused', function(data) {
                        var message = data.player.name + ' (' + teams.ct.name + ') defused the bomb';

                        if (players.get(data.player.name)) {
                            message = players.get(data.player.name)[0][1] + ' (' + teams.ct.name + ') defused the bomb';
                        }

                        reddit.liveUpdate(id, message, function(err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    });

                    sb.on('scoreboard', function(data) {
                        teams.t.name = data.terroristTeamName;
                        teams.ct.name = data.ctTeamName;

                        teams.t.players = data.TERRORIST;
                        teams.ct.players = data.CT;

                        lastScore = Math.floor(Date.now() / 1000);

                        changeScoreboard(id);
                    });
                }
            });
        }
    });
});

setInterval(function() {
    if (typeof lastScore !== 'undefined') {
        console.log(Math.floor(Date.now() / 1000) - lastScore);
        if (Math.floor(Date.now() / 1000) - lastScore > 600) {
            disconnect();
            lastScore = undefined;
        }
    }
}, 30000);

function disconnect() {
    connected = false;
    sb.disconnect();

    console.log('disconnect');
}

function double(time) {
    if (time < 10) {
        return '0' + time;
    } else {
        return time;
    }
}

function changeScoreboard(postid) {
    console.log('scoreboard updated');
    reddit.editLiveThread(postid, title, '', formatScoreboard(), function(err) {
        if (err) {
            console.log(err);
        }
    });
}

function formatScoreboard() {
    var topTable = teams.ct.name.trim() + '|K|A|D\n:--|:--|:--|:-- ';

    teams.ct.players.forEach(function(player) {
        if (players.get(player.name)) {
            topTable += '\n' + players.get(player.name)[0][1] + '|' + player.score + '|' + player.assists + '|' + player.deaths;
        } else {
            topTable += '\n' + player.name + '|' + player.score + '|' + player.assists + '|' + player.deaths;
        }
    });

    var bottomTable = teams.t.name.trim() + '|K|A|D\n:--|:--|:--|:-- ';

    teams.t.players.forEach(function(player) {
        if (players.get(player.name)) {
            bottomTable += '\n' + players.get(player.name)[0][1] + '|' + player.score + '|' + player.assists + '|' + player.deaths;
        } else {
            bottomTable += '\n' + player.name + '|' + player.score + '|' + player.assists + '|' + player.deaths;
        }
    });

    return topTable + '\n\n' + bottomTable;
}
