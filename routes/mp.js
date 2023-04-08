const express = require('express');
const router = express.Router();
const qs = require('qs')
const axios = require('axios');

const { ensureAuthenticated } = require('../middleware/authorization.js')

router.get('/user-tasks', ensureAuthenticated, async (req, res) => {
  const { userID } = req.query;

  if (!userID) return res.status(400).send({error: 'no userID parameter'}).end();

  const allTasks = await axios({
    method: 'post',
    url: 'https://my.pureheart.org/ministryplatformapi/procs/api_PHCGetUserTasks',
    data: {
      '@UserID': userID
    },
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data[0])

  res.status(200).send(allTasks).end();
})

router.get('/events', ensureAuthenticated, async (req, res) => {
  // monthStart <= eventEnd && monthEnd >= eventStart
  const { monthStart, monthEnd } = req.query;

  const events = await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Events',
    params: {
      $filter: `'${monthStart}'<=Event_End_Date AND '${monthEnd}'>=Event_Start_Date AND Cancelled=0`,
      $orderby: `Event_Start_Date`,
      $select: 'Event_ID, Event_Title, Event_Type_ID_Table.[Event_Type], Congregation_ID_Table.[Congregation_Name], Location_ID_Table.[Location_Name], Meeting_Instructions, Events.[Description], Program_ID_Table.[Program_Name], Primary_Contact_Table.[Display_Name], Participants_Expected, Minutes_for_Setup, Event_Start_Date, Event_End_Date, Minutes_for_Cleanup, Cancelled, Featured_On_Calendar'
    },
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(events)
})

module.exports = router;