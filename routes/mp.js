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

router.get('/event-rooms', ensureAuthenticated, async (req, res) => {
  const { eventIDs } = req.query;

  const rooms = await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Event_Rooms',
    params: {
      $filter: `Event_ID IN (${eventIDs.join()}) AND Cancelled=0`,
      $select: `Event_Room_ID, Event_ID, Room_ID_Table.[Room_Name], Room_ID_Table_Building_ID_Table.Building_Name, Room_ID_Table_Building_ID_Table_Location_ID_Table.[Location_Name]`
    },
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(rooms)
})

router.get('/places', ensureAuthenticated, async (req, res) => {
  const places = await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Rooms',
    params: {
      $filter: `Bookable=1 AND (Building_ID_Table.Date_Retired IS NULL OR Building_ID_Table.Date_Retired > GETDATE())`,
      $select: 'Rooms.Room_ID, Rooms.Room_Name, Rooms.Building_ID, Building_ID_Table.[Building_Name], Building_ID_Table_Location_ID_Table.[Location_ID], Building_ID_Table_Location_ID_Table.Location_Name'
    },
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
  .then(response => response.data)
  .catch(err => console.log(err))

  const locations = [...new Set(places.map(place => place.Location_Name))]
  const locationsArr = locations.map(location => {
    const buildings = [...new Set(places.filter(place => place.Location_Name == location).map(place => place.Building_Name))]
    return {
      Location_Name: location,
      Buildings: buildings.map(building => {
        const rooms = [...new Set(places.filter(place => place.Building_Name == building).map(place => place.Room_Name))]
        return {
          Building_Name: building,
          Rooms: rooms
        }
      })
    }
  })

  res.send(locationsArr)
})

module.exports = router;