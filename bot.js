var cluster = require('cluster');
var LiveGames = require('hltv-live-games');
var AccountRotation = require('./lib/utils/AccountRotation');

var options = require('./options.json');

var lg = new LiveGames({
    pollTime: 10000
});

var accounts = new AccountRotation(options.accounts, 60000);

var cluster_map = {};
var disconnected = {};

if (cluster.isMaster) {
    lg.on('newGame', function(game) {
        console.log('new game');
        console.log(game)

        var worker = cluster.fork();

        cluster_map[worker.id] = game;

        var worker2 = cluster.fork();

        cluster_map[worker2.id] = game;

        var worker3 = cluster.fork();

        cluster_map[worker3.id] = game;
    });

    cluster.on('online', function(worker) {
        console.log('Worker is now online');

        cluster.workers[worker.id].on('message', function(data) {
            console.log('got message', data)
            if (data.type === 'disconnect') {
                disconnected[worker.id] = true;
            }
        });

        worker.send({
            type: 'start',
            data: {
                account: accounts.getAccount(),
                accounts: options.accounts,
                oauth: options.OAuth2,
                debug: options.debug,
                game: cluster_map[worker.id]
            }
        });
    });

    cluster.on('exit', function(worker, code, signal) {
        if (!disconnected[worker.id]) {
            console.log('Worker died with code: ' + code + ', and signal: ' + signal);
            console.log('Starting a new worker');

            var newWorker = cluster.fork();

            cluster_map[newWorker.id] = cluster_map[worker.id];
            delete cluster_map[worker.id];
        } else {
            delete disconnected[worker.id];
        }
    });
} else {
    var HLTVBot = require('./lib/');

    process.on('message', function(message) {
        if (message.type === 'start') {
            var bot = new HLTVBot(message.data);

            bot.start();
        }
    });
}
