var Scorebot = require('hltv-scorebot');
var LiveGames = require('hltv-live-games');
var rawjs = require('raw.js');

var reddit = new rawjs('CSGOScoreBot');
var lg = new LiveGames({ polling: 5000 });
var sb = new Scorebot();

var connected = false;

var tname;
var cname;
var bestof;
var date;
var time;

reddit.setupOAuth2('id', 'secret');

lg.on('newGame', function(game) {
    console.log('GAME NOW LIVE: ' + game.matchid);
    if (!connected) {
        console.log(game);
        
        tname = game.teams[0];
        cname = game.teams[1];
        
        bestof = game.bestof;
        
        date = game.date;
        time = game.time;
        
        sb.connect(game.matchid, game.listid);
        connected = true;
    }
});

sb.on('connected', function() {
    reddit.auth({'username': 'usr', 'password': 'pass'}, function(err, response) {
        if(err) {
            console.log('Unable to authenticate user: ' + err);
        } else {
            reddit.createLiveThread({
                title: tname + ' vs. ' + cname,
                description: ''
            }, function (err, id) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(id);
                    
                    reddit.inviteLiveContributor(id, 'admin', ['close', 'edit', 'manage', 'settings', 'update'], function(err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    
                    /*
                    reddit.captcha(function(err, captcha) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(captcha);
                        }
                    });
                    
                    reddit.submit({
                        title: tname + ' vs. ' + cname + ' | ' + bestof + ' | ' + date + ' | ' + time + ' CEST',
                        url: 'https://www.reddit.com/live/' + id,
                        save: false,
                        inboxReplies: true,
                        r: 'CSGOScores',
                    }, function(err, id) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    */
                    
                    sb.on('roundEnd', function(data) {
                        var winner;
                        
                        if (data.winner === 0) {
                            winner = tname;
                        } else {
                            winner = cname;
                        }
                        
                        var message = winner + ' wins the round - (' + cname + ') ' + data.score.ct + ' : ' + data.score.t + ' (' + tname + ')'; 
                        reddit.liveUpdate(id, message, function(err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    });
                    
                    sb.on('scoreboard', function(data) {
                        tname = data.terroristTeamName;
                        cname = data.ctTeamName;
                    });
                }
            });
        }
    });
});
