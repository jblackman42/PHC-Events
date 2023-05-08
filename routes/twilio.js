const express = require('express');
const router = express.Router();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

router.post('/', (req, res) => {
  const { toNumber, messageBody, sendAt } = req.body;

  // const secondsBetween = ((new Date(sendAt).getTime() - new Date().getTime()) / 10000);
  const secondsBetween = Math.abs(new Date(sendAt).getTime() - new Date().getTime())/1000
  console.log(secondsBetween)
  const validSchedule = secondsBetween > 900 && secondsBetween < 604800;

  if (!validSchedule) return res.status(400).send('invalid time value').end();

  const textData = {
    body: messageBody,
    messagingServiceSid: process.env.TWILIO_SERVICE_SID,
    to: toNumber,
    sendAt: new Date(sendAt).toISOString(),
    scheduleType: 'fixed'
  }

  try {
    client.messages
      .create(textData)
      .then(message => res.send(message.sid));
  } catch(err) {
    res.status(500).send(err).end();
  }
})

module.exports = router;