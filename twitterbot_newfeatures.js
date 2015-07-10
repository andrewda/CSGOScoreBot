// This bot has new features, like knife round detection. (Also needs new hltv-scorebot)

var scorebot     = require('hltv-scorebot');
var Twitter      = require('twitter');
var EventEmitter = require('events').EventEmitter;
var em           = new EventEmitter();

var team1     = 'Titan'; // Team that starts on CT
var team2     = 'Luminosity'; // Team that starts on T
var matchid   = 365646;
var halftime  = false;
var goodToGo  = false;
var tag       = '#' + team1 + 'vs' + team2;
var lastScore = {
    'ct': 0,
    't': 0
    };
var winTeam, t1score, t2score, t1t, t2t, t1st, t2st, winner, scoreText, scoreTextSide;

//Twitter login
var client = new Twitter({
    consumer_key:        'key',
    consumer_secret:     'secret',
    access_token_key:    'key',
    access_token_secret: 'secret'
});

scorebot.connect('http://scorebot.hltv.org:10022', matchid, em, false);

scorebot.on('restart', function() {
    
});

scorebot.on('roundOver', function(data, scores, knifeRound) {
    winTeam = data.side;
    console.log(knifeRound);
    
    if (goodToGo && !knifeRound) {
        updateScore();
        
        if (winTeam == 'CT') {
            winner = team1;
            t1score = Number(t1score) + 1;
            updateScore();
        } else if (winTeam == 'T') {
            winner = team2;
            t2score = Number(t2score) + 1;
            updateScore();
        }
        
        if (Number(t1score) + Number(t2score) >= 15) {
            if (!halftime) {
                swapTeams();
            }
        }
        
        if (Number(t1score) + Number(t2score) <= 30) {
            postToTwitter(tag + ' | #' + winner + ' wins the round!' + ' | ' + scoreTextSide);
        }

        if (Number(t1score) + Number(t2score) >= 15 && lastScore.ct + lastScore.t >= 14) {
            if (!halftime) {
                postToTwitter(tag + ' | Halftime | ' + scoreText);
                halftime = true;
            }
        }
        
        if ((t1score == '16' && Number(t2score) < 15) || (t1score == '17' && Number(t2score) < 15)) {
            postToTwitter(tag + ' | #' + team1 + ' wins the map!');
        }
        
        if ((Number(t1score) < 15 && t2score == '16') || (Number(t1score) < 15 && t2score == '17')) {
            postToTwitter(tag + ' | #' + team2 + ' wins the map!');
        }
        
        if (t1score == '15' && t2score == '15') {
            postToTwitter(tag + ' | We\'re going to overtime! (At the moment, I cannot post overtime scores. Please check HLTV or watch the live stream.)');
        }
        
        lastScore = {
            'ct': Number(t1score),
            't': Number(t2score)
            };
    } else if (knifeRound) {
        if (winTeam == 'CT') {
            postToTwitter(tag + ' | #' + team1 + ' wins the knife round!');
        } else if (winTeam == 'T') {
            postToTwitter(tag + ' | #' + team2 + ' wins the knife round!');
            swapTeams(); // Assume the T teams wants to be CT (until we get a better method. the only map where this might not be true is dust2)
        }
    } else {
        console.log('Waiting for Good-To-Go!');
    }
});

scorebot.on('scoreUpdate', function(t, ct) {
    if (!goodToGo) {
        goodToGo  = true;
        lastScore = [
            Number(ct), 
            Number(t)
            ];
        t1score = Number(ct);
        t2score = Number(t);
        console.log("Good-To-Go!", '(CT [' + team1 + '] - ' + ct + ' | ' + t + ' - [' + team2 + '] T)');
        console.log(" ");
    }
});

function swapTeams() {
    t1t   = team1;
    t2t   = team2;
    team1 = t2t;
    team2 = t1t;

    t1st    = t1score;
    t2st    = t2score;
    t1score = t2st;
    t2score = t1st;
}

function postToTwitter(tweet) {
    client.post('statuses/update', {
        status: tweet
    }, function(error, tweet, response) {
        if (error) console.log(error);
    });
    
    console.log(tweet);
}

function updateScore() {
    scoreText     = '#' + team1 + ' ' + t1score + ' : ' + t2score + ' #' + team2;
    scoreTextSide = '#' + team1 + ' (CT) ' + t1score + ' : ' + t2score + ' (T) #' + team2;
}
