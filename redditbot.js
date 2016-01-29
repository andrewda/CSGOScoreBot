var Scorebot = require('hltv-scorebot');
var LiveGames = require('hltv-live-games');
var rawjs = require('raw.js');

var reddit = new rawjs('CSGOScoreBot');
var lg = new LiveGames({ polling: 5000 });
var sb = new Scorebot();

var connected = false;
var tname = '';
var cname = '';

reddit.setupOAuth2('id', 'secret');

lg.on('newGame', function(game) {
    if (!connected) {
        console.log(game);
        
        sb.connect(game.matchid, game.listid);
        connected = true;
        
        reddit.auth({'username': 'usrnm', 'password': 'passwd'}, function(err, response) {
            if(err) {
                console.log('Unable to authenticate user: ' + err);
            } else {
                // The user is now authenticated. If you want the temporary bearer token, it's available as response.access_token
                // and will be valid for response.expires_in seconds.
                // raw.js will automatically refresh the bearer token as it expires. Unlike web apps, no refresh tokens are available.
                
                reddit.createLiveThread({
                    title: game.teams[0] + ' vs. ' + game.teams[1],
                    description: ''
                }, function (err, id) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(id);
                        
                        sb.on('roundEnd', function(data) {
                            var message = data.winner + ' wins the round - (' + cname + ') ' + data.score.ct + ' : ' + data.score.t + ' (' + tname + ')'; 
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
    }
});