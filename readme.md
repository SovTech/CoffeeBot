# SovTech Coffee Slack Bot 

A simple Slack Bot for ordering tea and coffee at SovTech

## How to run this?

Install dependencies with `npm i`

Add your Slack API token to secrets.dummy.js and rename it secrets.js

Run with `forever start dist/index.js > stdout.txt 2> stderr.txt &`

## How to use this?

Send a message /coffee to Slack