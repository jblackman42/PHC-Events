const express = require('express');
const app = express();
const axios = require('axios');
const qs = require('qs');
const { checkHost } = require('../middleware/authorization.js')

app.get('/tickets', checkHost, async (req, res) => {
  const accessToken = await axios({
      method: 'post',
      url: 'https://my.pureheart.org/ministryplatformapi/oauth/connect/token',
      data: qs.stringify({
          grant_type: "client_credentials",
          scope: "http://www.thinkministry.com/dataplatform/scopes/all",
          client_id: process.env.APP_CLIENT_ID,
          client_secret: process.env.APP_CLIENT_SECRET
      })
  })
      .then(response => response.data.access_token)
      .catch(err => console.error(err))

  const data = await axios({
      method: 'post',
      url: `https://my.pureheart.org/ministryplatformapi/procs/api_Widget_HelpdeskTickets`,
      headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
      }
  })
      .then(response => response.data[0])
      .catch(err => console.error(err))

  res.status(200).send(data).end();
})

module.exports = app;