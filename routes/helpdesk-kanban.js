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

router.get('/tickets', async (req, res) => {
  try {
      //get access token for accessing database informatin
      const accessToken = await getAccessToken();

      const data = await axios({
          method: 'get',
          url: `https://my.pureheart.org/ministryplatformapi/tables/IT_Help_Tickets`,
          params: {
              $select: `IT_Help_Tickets.[IT_Help_Ticket_ID] AS [IT_Help_Ticket_ID],  Ticket_Requestor_Table.[Contact_ID] AS [Ticket_Requestor_Contact_ID],  Ticket_Requestor_Table.[Display_Name] AS [Ticket_Requestor_Display_Name],  IT_Help_Tickets.[Request_Date] AS [Request_Date],  IT_Help_Tickets.[Resolve_Date] AS [Resolve_Date],  IT_Help_Tickets.[Request_Title] AS [Request_Title],  IT_Help_Tickets.[Description] AS [Description],  Tag_Table.[IT_Help_ID] AS [Tag_ID],  Tag_Table.[Tag] AS [Tag_Name],  Status_Table.[Ticket_Status_ID] AS [Status_ID],  Status_Table.[Status] AS [Status_Name],  Agent_Table.[IT_Operators_ID] AS [Agent_ID],  Agent_Table.[First_Name] AS [Agent_Name],  Priority_Table.[Ticket_Priority_ID] AS [Priority_ID],  Priority_Table.[Priority] AS [Priority_Name]`,
              $filter: `Status_Table.[Ticket_Status_ID] NOT IN (3,4) OR IT_Help_Tickets.[Resolve_Date] >= DATEADD(DAY, -1, GETDATE())`,
              $orderby: `IT_Help_Tickets.[Request_Date] DESC`
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

router.get('/agents', async (req, res) => {
  try {
      //get access token for accessing database informatin
      const accessToken = await getAccessToken();

      const data = await axios({
          method: 'get',
          url: `https://my.pureheart.org/ministryplatformapi/tables/IT_Operators`,
          params: {
              $orderby: `First_Name`
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