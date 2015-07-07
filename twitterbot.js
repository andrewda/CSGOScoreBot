var scorebot     = require('hltv-scorebot');
var Twitter      = require('twitter');
var EventEmitter = require('events').EventEmitter;
var em           = new EventEmitter();

var team1    = 'CT'; // Team that starts on CT
var team2    = 'T'; // Team that starts on T
var matchid  = 365123;
var halftime = false;
var goodToGo = false;
var tag      = '#' + team1 + 'vs' + team2;
var winTeam, t1score, t2score, t1t, t2t, t1st, t2st, winner, scoreText, scoreTextSide;

//Twitter login
var client = new Twitter({
    consumer_key:        'Ghj2ZiV8bvgveWtqVGa2wuDuX',
    consumer_secret:     'su6lpyg3lbeAinfYtOxtNOolc7TLjNlbieA5DHQl978f66qqiL',
    access_token_key:    '2954514570-OaLTeuV69JMnK0MfoH3iiaRMEd7sSUkiVltVMc1',
    access_token_secret: 'tqLJ8R41y4IjqGsjkIrn51Cnj2W2Pm3jXqweT5PaHaVs1'
});

scorebot.connect('http://scorebot.hltv.org:10022', matchid, em);

scorebot.on('roundOver', function(data, scores) {
    if (goodToGo) {
        winTeam       = data.side;
        t1score       = scores.ct;
        t2score       = scores.t;
        scoreText     = '#' + team1 + ' ' + t1score + ' : ' + t2score + ' #' + team2;
        scoreTextSide = '#' + team1 + ' (CT) ' + t1score + ' : ' + t2score + ' #' + team2 + ' (T)';
        
        if (winTeam == 'CT') {
            winner = team1;
        } else if (winTeam == 'T') {
            winner = team2;
        }
        
        if (Number(t1score) + Number(t2score) == 16) {
            t1st    = t1score;
            t2st    = t2score;
            t1score = t2st;
            t2score = t1st;
            
            if (winTeam == 'CT') {
                t1score = Number(Number(t1score) + 1).toString();
                t2score = Number(Number(t2score) - 1).toString();
            } else if (winTeam == 'T') {
                t1score = Number(Number(t1score) - 1).toString();
                t2score = Number(Number(t2score) + 1).toString();
            }
        }
        
        if (Number(t1score) + Number(t2score) >= 15) {
            if (!halftime) {
                swapTeams();
            }
        }
        
        postToTwitter(tag + ' | #' + winner + ' wins the round!' + ' | ' + scoreTextSide);

        if (Number(t1score) + Number(t2score) >= 15) {
            if (!halftime) {
                postToTwitter(tag + ' | Halftime | ' + scoreText);
                halftime = true;
            }
        }
        
        if ((t1score == '16' && Number(t2score) < 15)) {
            postToTwitter(tag + ' | ' + team1 + ' wins the map!');
        }
        
        if ((Number(t1score) < 15 && t2score == '16')) {
            postToTwitter(tag + ' | ' + team2 + ' wins the map!');
        }
        
        if (t1score == '15' && t2score == '15') {
            postToTwitter(tag + ' | We\'re going to overtime! (At the moment, I cannot post overtime scores. Please check HLTV or watch the live stream.)');
        }
    } else {
        console.log('Waiting for Good-To-Go!');
    }
});

scorebot.on('scoreUpdate', function(t, ct) {
    if (!goodToGo) {
        goodToGo = true;
        console.log("Good-To-Go!", '(CT - ' + ct + ' | ' + t + ' - T)');
    }
});

function swapTeams() {
    t1t   = team1;
    t2t   = team2;
    team1 = t2t;
    team2 = t1t;
}

function postToTwitter(tweet) {
    client.post('statuses/update', {
        status: tweet
    }, function(error, tweet, response) {
        if (error) console.log(error);
    });
    
    console.log(tweet);
}
