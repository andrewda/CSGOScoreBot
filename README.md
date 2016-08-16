# CSGOScoreBot

## How to Run
```bash
$ git clone https://github.com/andrewda/CSGOScoreBot
$ cd CSGOScoreBot
$ npm install
```

Now move the `options.example.json` file to `options.json` and configure it to match your needs.
Then, run the bot:

```bash
$ npm run
```

## Configuration

### Create New Reddit App

To get your OAuth2 id and secret, [create a new app](https://www.reddit.com/prefs/apps#create-app-button)
and make sure to select the `script` type. You will be able to access your new app's details by clicking
on the `edit` button - the id will be listed under the name at the top, and your secret will be listed
below. Finally, add all the accounts you'll be using as developers on the app.

### Configure Your `options.json`

Enter your newly created OAuth2 id and secret in the appropriate location in the `options.json` file.
Next, you'll need to enter the account information for the Reddit accounts you'll be using on the bot.
The bot will automatically cycle through the accounts to avoid being slowed down by Reddit's occasional
one-minute cooldowns.
