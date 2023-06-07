const express = require('express');
const router = express.Router();
const qs = require('qs')
const axios = require('axios');

const getAccessToken = async () => {
  const data = await axios({
      method: 'post',
      url: 'https://my.pureheart.org/ministryplatformapi/oauth/connect/token',
      data: qs.stringify({
          grant_type: "client_credentials",
          scope: "http://www.thinkministry.com/dataplatform/scopes/all",
          client_id: process.env.APP_CLIENT_ID,
          client_secret: process.env.APP_CLIENT_SECRET
      })
  })
      .then(response => response.data)
  const {access_token, expires_in} = data;
  return access_token;
}


router.get('/statuses', async (req, res) => {
  // const { ministryQuestionID } = req.query;
  
  // if (!ministryQuestionID) return res.status(400).send({err: 'no ministry question id'}).end();

  try {
      //get access token for accessing database informatin
      const accessToken = await getAccessToken();

      const data = await axios({
          method: 'get',
          url: `https://my.pureheart.org/ministryplatformapi/tables/Ticket_Status`,
          params: {
              $filter: `Hidden = 0`,
              $orderby: `Kanban_Order`
          },
          headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'Application/JSON'
          }
      })
          .then(response => response.data)

      res.send(data);
  } catch (e) {
      const { response } = e;
      const { data } = response;
      const { Message } = data;
      res.status(response.status).send(Message).end();
  }
})

module.exports = router;