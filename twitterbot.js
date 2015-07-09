var scorebot     = require('hltv-scorebot');
var Twitter      = require('twitter');
var EventEmitter = require('events').EventEmitter;
var em           = new EventEmitter();

var team1     = 'Phenomenon'; // Team that starts on CT
var team2     = 'Evolution'; // Team that starts on T
var matchid   = 365486;
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

scorebot.on('roundOver', function(data, scores) {
    if (goodToGo) {
        winTeam       = data.side;
        t1score       = scores.ct;
        t2score       = scores.t;
        scoreText     = '#' + team1 + ' ' + t1score + ' : ' + t2score + ' #' + team2;
        scoreTextSide = '#' + team1 + ' (CT) ' + t1score + ' : ' + t2score + ' (T) #' + team2;
        
        if (winTeam == 'CT') {
            winner = team1;
        } else if (winTeam == 'T') {
            winner = team2;
        }
        
        if (Number(t1score) + Number(t2score) == 16) {
            t1st = t1score;
            t2st = t2score;
            t1score = t2st;
            t2score = t1st;
            
            if (winTeam == 'CT') {
                t1score = Number(Number(t1score) + 1).toString();
                t2score = Number(Number(t2score) - 1).toString();
            } else if (winTeam == 'T') {
                t1score = Number(Number(t1score) - 1).toString();
                t2score = Number(Number(t2score) + 1).toString();
            }
            
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
        console.log("Good-To-Go!", '(CT [' + team1 + '] - ' + ct + ' | ' + t + ' - [' + team2 + '] T)');
        console.log(" ");
    }
});

function swapTeams() {
    t1t   = team1;
    t2t   = team2;
    team1 = t2t;
    team2 = t1t;
}

function postToTwitter(tweet) {
    /*client.post('statuses/update', {
        status: tweet
    }, function(error, tweet, response) {
        if (error) console.log(error);
    });*/
    
    console.log(tweet);
}

function updateScore() {
    scoreText     = '#' + team1 + ' ' + t1score + ' : ' + t2score + ' #' + team2;
    scoreTextSide = '#' + team1 + ' (CT) ' + t1score + ' : ' + t2score + ' (T) #' + team2;
}
