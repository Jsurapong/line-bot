"use strict";
require("dotenv").config();
const { split, includes } = require("lodash");

const line = require("@line/bot-sdk");
const express = require("express");

// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post("/callback", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

const getEndPointId = key => {
  switch (key) {
    case process.env.GROUP_ID_A:
      return process.env.GROUP_ID_B;

    case process.env.GROUP_ID_B:
      return process.env.GROUP_ID_A;

    default:
      return "null";
  }
};

// event handler
function handleEvent(event) {
  console.log({ event });
  if (
    event.type !== "message" ||
    event.message.type !== "text" ||
    !includes(event.message.text, "tbv|salestracking|")
  ) {
    // ignore non-text-message event
    return Promise.resolve(null);
  }

  const groupId = event.source.groupId;
  if (process.env.GROUP_ID_B === groupId) {
    return Promise.resolve(null);
  }
  // create a echoing text message

  const message = event.message.text;

  const [prefix, position, number] = split(event.message.text, "|");

  const endPointId = getEndPointId(event.source.groupId);

  return client.pushMessage(endPointId, {
    type: "text",
    text: `${message}`
  });
  // return client.replyMessage(event.replyToken, echo);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
