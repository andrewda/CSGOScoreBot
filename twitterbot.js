var Scorebot = require('hltv-scorebot');
var LiveGames = require('hltv-live-games');
var Twitter = require('twitter');

var lg = new LiveGames({ polling: 5000 });
var sb = new Scorebot();

var tag = '{team1}vs{team2}';

var connected = false;

var tname;
var cname;

var client = new Twitter({
    consumer_key: 'key',
    consumer_secret: 'secret',
    access_token_key: 'access-key',
    access_token_secret: 'access-secret'
});

lg.on('newGame', function(game) {
    console.log('GAME NOW LIVE: ' + game.matchid);
    if (!connected) {
        console.log(game);
        
        tname = game.teams[0];
        cname = game.teams[1];
        
        tag = tag.replace('{team1}', tname).replace('{team2}', cname);
        
        sb.connect(game.matchid, game.listid);
        connected = true;
    }
});

sb.on('connected', function() {
    sb.on('roundEnd', function(data) {
        var winner;
        
        if (data.winner === 0) {
            winner = tname;
        } else {
            winner = cname;
        }
        
        var message = tag + ' | ' + winner + ' wins the round - (' + cname + ') ' + data.score.ct + ' : ' + data.score.t + ' (' + tname + ')';
        
        postToTwitter(message);
    });
    
    sb.on('scoreboard', function(data) {
        tname = data.terroristTeamName;
        cname = data.ctTeamName;
    });
});

function postToTwitter(tweet) {
    client.post('statuses/update', {
        status: tweet
    }, function(err) {
        if (err) {
            console.log(err);
        }
    });
    
    console.log(tweet);
}
