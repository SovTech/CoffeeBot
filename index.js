import Botkit from 'botkit'
import { slackBotKey } from './secrets'

const controller = Botkit.slackbot({
  debug: false,
  // include "log: false" to disable logging
  // or a "logLevel" integer from 0 to 7 to adjust logging verbosity
  json_file_store: 'coffee_bot_database.json'
})

let canJoinForCoffee = false // a person can only join for coffee is someone has offered to make coffee
let peopleWhoWanCoffee = [] // array to hold the people who want coffee in the batch

// connect the bot to a stream of messages
controller.spawn({
  token: slackBotKey
}).startRTM()

// Listen for messages sent to coffeeBot to let others know that you are about to make some coffee
controller.hears('.*coffeetime.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
  if (canJoinForCoffee) {
    bot.reply(message, 'It looks like someone has already offered to make a batch - why not help them with it?')
  } else {
    let personMaking = ''
    canJoinForCoffee = true
    peopleWhoWanCoffee = [] // reset the array of people who want coffee
    bot.reply(message, 'Awesome, get your orders in the the next minute or you will have to make for yourself!')
    console.log(message)

    // Record some stats - save the number of times someone offers to make coffee
    bot.api.users.info({user: message.user}, (error, response) => {
      if (error) {
        console.log(error)
      }

      personMaking = response.user.name

      // Get the saved value and increment it by 1
      controller.storage.users.get(message.user + '_coffee_making_count', function (error, userData) {
        if (error) {
          console.log(error)
        }
        let userCoffeeCount = 0
        console.log(userData)
        if (userData) {
          if (userData.count) {
            userCoffeeCount = userData.count++
          }
        }
        controller.storage.users.save({
          id: message.user + '_coffee_making_count',
          count: userCoffeeCount
        }, function (error) {
          if (error) {
            console.log(error)
          }
        })
      })
    })

    // Only give people 1 minute to get on the coffee boat
    setTimeout(() => {
      canJoinForCoffee = false

      // at the end of the minute send a message with a summary of who wants what
      let peopleString = ''
      peopleWhoWanCoffee.forEach(function (user) {
        peopleString += '\n' + user.username + ' - ' + user.pref
      })
      bot.reply(message, personMaking + ' is making :+1: :taco:')
      bot.reply(message, 'Time is up. The orders look as follows: ' + peopleString)
    }, 30000)
  }
})

// Listen for messages that someone wants tea
controller.hears('.*I want tea.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
  if (canJoinForCoffee) {
    bot.api.users.info({user: message.user}, (error, response) => {
      if (error) {
        console.log(error)
      }
      let {name} = response.user
      peopleWhoWanCoffee.push({username: name, userId: message.user, pref: 'Tea :tea:'})
      if (name === 'edwardvincent' || name === 'gina') {
        bot.reply(message, 'Ok, putting you down for a tea-quila')
      } else {
        bot.reply(message, 'Ok, putting you down for a cup of tea')
      }
    })
  } else {
    bot.reply(message, 'Nobody is making any now. Why don\'t you offer to make?')
  }
})

// Listen for messages that someone wants coffee
// this function could be improved - it shares a lof of functionality with the tea version
controller.hears('.*I want coffee.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
  if (canJoinForCoffee) {
    bot.api.users.info({user: message.user}, (error, response) => {
      if (error) {
        console.log(error)
      }
      let {name} = response.user
      peopleWhoWanCoffee.push({username: name, userId: message.user, pref: 'Coffee :coffee:'})
      if (name === 'edwardvincent' || name === 'gina') {
        bot.reply(message, 'Ok, putting you down for a coffee-quila')
      } else {
        bot.reply(message, 'Ok, putting you down for a cup of coffee')
      }
    })
  } else {
    bot.reply(message, 'Nobody is making any now. Why don\'t you offer to make?')
  }
})

// Listen for messages sent to coffeeBot to update preferences
controller.hears('set my prefs.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
  bot.startConversation(message, function (error, convo) {
    if (error) {
      console.log(error)
    }
    // Ask the user how they take their coffee
    convo.ask('Ok, how do you take your coffee?', function (response, convo) {
      convo.say('Cool, you said: ' + response.text)
      convo.next()

      // Save the users prefs to a JSON file
      controller.storage.users.save({
        id: message.user + '_coffee_pref',
        coffee_pref: response.text
      }, function (error) {
        if (error) {
          console.log(error)
        }
      })

      convo.say('Your coffee preferences have been saved.')
      convo.next()
    })

    // Ask the user how they take their tea
    convo.ask('Ok, how do you take your tea?', function (response, convo) {
      convo.say('Cool, you said: ' + response.text)
      convo.next()

      // Save the users prefs to a JSON file
      controller.storage.users.save({
        id: message.user + 'tea_pref',
        coffee_pref: response.text
      }, function (error) {
        if (error) {
          console.log(error)
        }
      })

      convo.say('Your tea preferences have been saved.')
      convo.next()
    })
  })
})

// Listen for messages that someone wants help with coffee bot
controller.hears('.*Help.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
  bot.reply(message, 'Send `@coffee-bot coffeetime` if you would like to offer to make a batch of tea or coffee.')
  bot.reply(message, 'Send `@coffee-bot set my prefs` to save your tea and coffee preferences. This info will be sent to the user who offered to make.')
  bot.reply(message, 'After someone has offered to make coffee send `@coffee-bot I want tea` or `@coffee-bot I want coffee` to place your order')
})

// Add a small amount of personality
controller.hears('.*Hello.*', ['direct_message', 'direct_mention', 'mention'], function (bot, message) {
  bot.reply(message, 'Hi there!')
})
