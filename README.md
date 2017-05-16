# CSGOScoreBot

[![Greenkeeper badge](https://badges.greenkeeper.io/andrewda/CSGOScoreBot.svg)](https://greenkeeper.io/)

[![Build][travis-img]][travis-url]
[![Steam Donate][steam-donate-img]][steam-donate-url]

## Introduction

What is CSGOScoreBot?

CSGOScoreBot started as a tiny Twitter bot which would tweet out the results of professional CS:GO games,
but has evolved to be a clustered bot which will slave away to update viewers of live game information at
a glance without the need to pull up the stream. The original Twitter bot can still be found on the `old`
branch, but beware, the code is incredibly ugly!

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

## License

```
Copyright (C) 2016 Andrew Dassonville

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
```

<!-- Badge URLs -->

[travis-img]:       https://img.shields.io/travis/andrewda/hltv-livescore.svg?style=flat-square
[travis-url]:       https://travis-ci.org/andrewda/hltv-livescore
[steam-donate-img]: https://img.shields.io/badge/donate-Steam-lightgrey.svg?style=flat-square
[steam-donate-url]: https://steamcommunity.com/tradeoffer/new/?partner=132224795&token=HuEE9Mk1
