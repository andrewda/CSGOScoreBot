var scorebot     = require('hltv-scorebot');
var Twitter      = require('twitter');
var EventEmitter = require('events').EventEmitter;
var em           = new EventEmitter();

var team1     = 'eBettle'; // Team that starts on CT
var team2     = 'nerdRage'; // Team that starts on T
var matchid   = 367252; // The HLTV matchid
var halftime  = false;
var goodToGo  = false;
var tenPlayer = false;
var tag       = '#' + team1 + 'vs' + team2;
var ctPlayer  = '';
var tPlayer   = '';
var winTeam, t1score, t2score, t1t, t2t, t1st, t2st, winner, scoreText, scoreTextSide;

//Twitter login
var client = new Twitter({
    consumer_key:        'key',
    consumer_secret:     'secret',
    access_token_key:    'access-key',
    access_token_secret: 'access-secret'
});

scorebot.connect('http://scorebot.hltv.org:10022', matchid, em, false);

scorebot.on('kill', function() {
    scorebot.getPlayers(function(allPlayers, playerAttr) {
        tenPlayer = allPlayers;
        if (goodToGo && allPlayers) {
            console.log("CT:", playerAttr.ct[0].name, playerAttr.ct[0].id);
            console.log("T:", playerAttr.t[0].name, playerAttr.t[0].id);
            
            if (tPlayer == '' || ctPlayer == '') {
                tPlayer  = playerAttr.t[0].id;
                ctPlayer = playerAttr.ct[0].id;
            }
            
            if (tPlayer !== playerAttr.t[0].id || ctPlayer !== playerAttr.ct[0].id) {
                tPlayer  = playerAttr.t[0].id;
                ctPlayer = playerAttr.ct[0].id;
                
                postToTwitter(tag + ' | Halftime | ' + scoreText);
                
                console.log("Swapping teams!");
                swapTeams();
            }
        }
    });
});

scorebot.on('roundOver', function(data, scores, knifeRound) {
    winTeam = data.side;
    
    if (goodToGo && !knifeRound && tenPlayer) {
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
        
        postToTwitter(tag + ' | #' + winner + ' wins the round!' + ' | ' + scoreTextSide);
        
        if ((t1score == '16' && Number(t2score) < 15) || (t1score == '17' && Number(t2score) < 15)) {
            postToTwitter(tag + ' | #' + team1 + ' wins the map!');
            restarted = false;
            //goodToGo  = false;
        }
        
        if ((Number(t1score) < 15 && t2score == '16') || (Number(t1score) < 15 && t2score == '17')) {
            postToTwitter(tag + ' | #' + team2 + ' wins the map!');
            restarted = false;
            //goodToGo  = false;
        }
        
        if (t1score == '15' && t2score == '15') {
            postToTwitter(tag + ' | We\'re going to overtime!');
        }
    } else if (knifeRound) {
        if (winTeam == 'CT') {
            postToTwitter(tag + ' | #' + team1 + ' wins the knife round!');
        } else if (winTeam == 'T') {
            postToTwitter(tag + ' | #' + team2 + ' wins the knife round!');
            swapTeams(); // Assume the T teams wants to be CT (until we get a better method. the only map where this might not be true is dust2)
        }
    } else if (!goodToGo) {
        console.log('Waiting for Good-To-Go!');
    }
});

scorebot.on('scoreUpdate', function(t, ct) {
    if (!goodToGo) {
        goodToGo  = true;
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

function endGame() {
    // This function will be changed to automatically start the next game later.
    
    matchid = 0;
    scorebot.connect('http://scorebot.hltv.org:10022', matchid, em, false);
}
