'use strict';

var _botkit = require('botkit');

var _botkit2 = _interopRequireDefault(_botkit);

var _secrets = require('./secrets');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var controller = _botkit2.default.slackbot({
    debug: false,
    //include "log: false" to disable logging
    //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
    json_file_store: 'path_to_json_database'
});

var canJoinForCoffee = false; // a person can only join for coffee is someone has offered to make coffee
var peopleWhoWanCoffee = []; // array to hold the people who want coffee in the batch

// connect the bot to a stream of messages
controller.spawn({
    token: _secrets.slackBotKey
}).startRTM();

// Listen for messages sent to coffeeBot to let others know that you are about to make some coffee
controller.hears('.*coffeetime.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    canJoinForCoffee = true;
    console.log(message);

    // Record some stats - save the number of times someone offers to make coffee
    bot.api.users.info({ user: message.user }, function (error, response) {
        var name = response.user.name;
        peopleWhoWanCoffee.push({ username: name, userId: message.user, makingCoffee: true });

        // Get the saved value and increment it by 1
        controller.storage.users.get(message.user + '_coffee_making_count', function (err, user_data) {
            controller.storage.users.save({
                id: message.user + '_coffee_making_count',
                count: user_data.count ? user_data.count++ : 1
            }, function (err) {
                if (err) {
                    console.log(err);
                }
            });
        });
    });

    // Only give people 1 minute to get of the coffee boat
    setTimeout(function () {
        canJoinForCoffee = false;

        // at the end of the minute send a message with a summary of who wants what
        var peopleString = '';
        peopleWhoWanCoffee.forEach(function (user) {
            peopleString += '\n' + user.name + user.makingCoffee ? ' - making this batch' : null;
        });
        bot.reply(message, 'Time is up. The orders look as follows: ' + peopleString);
    }, 1000);
});

// Listen for messages that someone wants tea
controller.hears('.*I want tea.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    if (canJoinForCoffee) {
        bot.reply(message, 'Ok, putting you down for a cup of tea');
    } else {
        bot.reply(message, 'Nobody is making any now. Why don\'t you offer to make?');
    }
});

// Listen for messages that someone wants coffee
controller.hears('.*I want coffee.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    if (canJoinForCoffee) {
        bot.reply(message, 'Ok, putting you down for a cup of coffee');
    } else {
        bot.reply(message, 'Nobody is making any now. Why don\'t you offer to make?');
    }
});

// Listen for messages sent to coffeeBot to update preferences
controller.hears('set my pref.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
    console.log(message);

    bot.startConversation(message, function (err, convo) {

        // Ask the user how they take their coffee
        convo.ask('Ok, how do you take your coffee?', function (response, convo) {

            convo.say('Cool, you said: ' + response.text);
            convo.next();

            // Save the users prefs to a JSON file
            controller.storage.users.save({
                id: message.user + '_coffee_pref',
                coffee_pref: response.text
            }, function (err) {
                if (err) {
                    console.log(err);
                }
            });

            convo.say('Your coffee preferences have been saved.');
            convo.next();
        });
    });

    // Ask the user how they take their tea
    convo.ask('Ok, how do you take your tea?', function (response, convo) {

        convo.say('Cool, you said: ' + response.text);
        convo.next();

        // Save the users prefs to a JSON file
        controller.storage.users.save({
            id: message.user + 'tea_pref',
            coffee_pref: response.text
        }, function (err) {
            if (err) {
                console.log(err);
            }
        });

        convo.say('Your tea preferences have been saved.');
        convo.next();
    });
});
//# sourceMappingURL=index.js.map