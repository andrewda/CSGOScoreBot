var scorebot = require('hltv-scorebot');
var Twitter = require('twitter');
var EventEmitter = require('events').EventEmitter;
var em = new EventEmitter();

var team1 = 'Epsilon'; // Team that starts on CT
var team2 = 'Reason'; // Team that starts on T
var matchid = 365123;

var tag = '#' + team1 + 'vs' + team2 ;
var winTeam, t1score, t2score, t1t, t2t, t1st, t2st, winner;

var goodToGo = false;

//TWITTER LOGIN
var client = new Twitter ({
    consumer_key: 'key',
    consumer_secret: 'secret',
    access_token_key: 'key',
    access_token_secret: 'secret'
});
//END

function swapTeams () {
    t1t = team1;
    t2t = team2;
    
    team1 = t2t;
    team2 = t1t;
}

scorebot.connect('http://scorebot.hltv.org:10022', matchid, em, false);

scorebot.on('roundOver', function(data, scores) {
    if (goodToGo) {
        winTeam = data.side;
        t1score = scores.ct;
        t2score = scores.t;
        if (winTeam == 'CT') {
            winner = team1;
        } else if (winTeam == 'T') {
            winner = team2;
        }
        if (parseInt(t1score) + parseInt(t2score) == 16) {
            t1st = t1score;
            t2st = t2score;
            
            t1score = t2st;
            t2score = t1st;
            
            if (winTeam == 'CT') {
                t1score = parseInt(parseInt(t1score) + 1).toString();
                t2score = parseInt(parseInt(t2score) - 1).toString();
            } else if (winTeam == 'T') {
                t1score = parseInt(parseInt(t1score) - 1).toString();
                t2score = parseInt(parseInt(t2score) + 1).toString();
            }
        }
        client.post('statuses/update', {status: tag + ' | #' + winner + ' wins the round!' + ' | #' + team1 + ' (CT) ' + t1score + ' : ' + t2score + ' #' + team2 + ' (T)'},  function(error, tweet, response){
            if (error) console.log(error);
        });
        console.log(tag, '|', '#' + winner, 'wins the round!', '|', '#' + team1, '(CT)', t1score, ':', t2score, '#' + team2, '(T)');
        if (parseInt(t1score) + parseInt(t2score) == 15 || parseInt(t1score) + parseInt(t2score) == 33) {
            console.log(tag, '|', 'Halftime.', team1, 'to T side,', team2, 'to CT side.', '|', '#' + team1, t1score, ':', t2score, '#' + team2);
            client.post('statuses/update', {status: tag + ' | Halftime | #' + team1 + ' ' + t1score + ' : ' + t2score + ' #' + team2},  function(error, tweet, response){
                if (error) console.log(error);
            });
            swapTeams();
        }
        if ((t1score == '16' && parseInt(t2score) < 15)) {
            console.log(tag, '|', team1, 'wins the map!');
            client.post('statuses/update', {status: tag + ' | ' + team1 + ' wins the map!'},  function(error, tweet, response){
                if (error) console.log(error);
            });
        }
        if ((parseInt(t1score) < 15 && t2score == '16')) {
            console.log(tag, '|', team2, 'wins!');
            client.post('statuses/update', {status: tag + ' | ' + team2 + ' wins the map!'},  function(error, tweet, response){
                if (error) console.log(error);
            });
        }
        if (t1score == '15' && t2score == '15') {
            console.log(tag, '|', 'We\'re going to overtime!');
            client.post('statuses/update', {status: tag + ' | We\'re going to overtime! (At the moment, I cannot post overtime scores. Please check HLTV or watch the live stream.)'},  function(error, tweet, response){
                if (error) console.log(error);
            });
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