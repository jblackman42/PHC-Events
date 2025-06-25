const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');

router.get('/ministryQuestions', async (req, res) => {
  try {
    const ministryQuestions = await axios({
      method: 'get',
      url: 'https://my.pureheart.org/ministryplatformapi/tables/Ministry_Questions',
      params: {
        '$select': `Ministry_Question_ID, Question_Title, Question_Header, Never_Delete_Answers`
      },
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.data)

    res.send({ministryQuestions}).status(200).end();
  } catch (err) {
    console.log('something went wrong');
    res.sendStatus(err.response.status);
  }
})

router.delete('/deleteAnswers', async (req, res) => {
  try {
    const { MinistryQuestionID } = req.query;
    await axios({
      method: 'post',
      url: 'https://my.pureheart.org/ministryplatformapi/procs/DeleteAnswers',
      data: {
        "@DomainID": "1",
        "@QuestionID": MinistryQuestionID
      },
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    res.sendStatus(200);
  } catch (err) {
    console.log('something went wrong');
    console.log(err)
    res.sendStatus(err.response.status);
  }
})

router.get('/refreshAnswers', async (req, res) => {
  try {
    const { MinistryQuestionID } = req.query;
    await axios({
      method: 'post',
      url: 'https://my.pureheart.org/ministryplatformapi/procs/service_ministry_QA_insert_single_answers',
      data: {
        "@DomainID": "1",
        "@MinistryQuestion_ID": MinistryQuestionID
      },
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    res.sendStatus(200);
  } catch (err) {
    console.log('something went wrong');
    console.log(err)
    res.sendStatus(err.response.status);
  }
})

// testing api routs

router.get('/userinfo', async (req, res) => {
  try {
    const result = await axios({
      method: 'get',
      url: 'https://my.pureheart.org/ministryplatformapi/oauth/connect/userinfo',
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`,
        'Accept': 'application/json'
      }
    });
    
    res.send(result.data);
  } catch (error) {
    console.log({
      status: error.response.status,
      statusText: error.response.statusText,
      data: error.response.data
    })
    res.status(error.response.status).send(error.response.data);
  }
});

// CREATE EVENT ROUTES

router.post('/overlapped-rooms', async (req, res) => {
  const { dates } = req.body;

  if (!dates || !dates.length) return res.status(400).send({err: 'no startDate or endDate provided'}).end();

  const filterDateString = dates.map(date => {
    const { startDate, endDate } = date;
    return `(DateAdd(n,Event_ID_Table.Minutes_for_Setup*-1,Event_ID_Table.Event_Start_Date) < '${endDate}') AND (DateAdd(n,Event_ID_Table.Minutes_for_Cleanup,Event_ID_Table.Event_End_Date) > '${startDate}')`
  }).join(' OR ')

  const eventRooms = await axios({
    method: 'post',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Event_Rooms/get',
    data: {
      // $filter: `Event_Rooms.[Cancelled]=0 AND Room_ID_Table.[Bookable]=1 AND ((Event_ID_Table.[Event_Start_Date] < '${endDate}') AND (Event_ID_Table.[Event_End_Date] > '${startDate}'))`,
      "Filter": `Event_Rooms.[Cancelled]=0 AND Room_ID_Table.[Bookable]=1 AND (${filterDateString})`,
      "Select": `DateAdd(n,Event_ID_Table.Minutes_for_Setup*-1,Event_ID_Table.Event_Start_Date) AS [Reservation_Start], DateAdd(n,Event_ID_Table.Minutes_for_Cleanup,Event_ID_Table.Event_End_Date) AS [Reservation_End], Event_Rooms.[Event_ID], Event_ID_Table.[Event_Title], Event_Rooms.[Room_ID], Room_ID_Table.[Room_Name], Event_ID_Table.[Event_Start_Date], Event_ID_Table.[Event_End_Date], Event_ID_Table.[Minutes_for_Setup], Event_ID_Table.[Minutes_for_Cleanup]`,
      "Distinct": true
    },
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(eventRooms)
})

router.get('/locations', async (req, res) => {
  const locations = await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/locations',
    params: {
      $filter: `Move_Out_Date IS NULL OR Move_Out_Date > GETDATE()`,
      $select: 'Location_ID, Location_Name'
    },
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(locations)
})

router.get('/primary-contacts', async (req, res) => {
  const users = await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/dp_User_User_Groups',
    params: {
      $filter: `dp_User_User_Groups.[User_ID] NOT IN (16129,14881,14746,10925,9709,9504,9429,9229,9092,6908,6800,6799,6798,6797,6796,6795,6745,6580,1276,7,6,5,2,1)`,
      $select: 'User_ID_Table.[Contact_ID], User_ID_Table.[Display_Name]',
      $distinct: true
    },
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => {
      const { data } = response;
      return data.sort((a, b) => {
        let fa = a.Display_Name.split(', ')[0].toLowerCase(),
            fb = b.Display_Name.split(', ')[0].toLowerCase();
    
        if (fa < fb) {
            return -1;
        }
        if (fa > fb) {
            return 1;
        }
        return 0;
      })
    })
    .catch(err => console.log(err))

  res.send(users)
})

router.get('/event-types', async (req, res) => {
  const eventTypes = await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Event_Types',
    params: {
      $filter: `End_Date IS NULL OR End_Date > GETDATE()`,
      $select: 'Event_Type_ID, Event_Type'
    },
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(eventTypes)
})

router.get('/congregations', async (req, res) => {
  const congregations = await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Congregations',
    params: {
      $filter: `End_Date IS NULL OR End_Date > GETDATE()`,
      $select: 'Congregation_ID, Congregation_Name'
    },
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(congregations)
})

router.get('/places', async (req, res) => {
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
  const locationsArr = locations.map((location, locationID) => {
    const buildings = [...new Set(places.filter(place => place.Location_Name == location).map(place => place.Building_Name))]
    return {
      Location_Name: location,
      Location_ID: places.filter(place => place.Location_Name == location)[0].Location_ID,
      Buildings: buildings.map((building, buildingID) => {
        const rooms = [...new Set(places.filter(place => place.Building_Name == building).map(place => place.Room_Name))]
        return {
          Building_Name: building,
          Building_ID: places.filter(place => place.Building_Name == building)[0].Building_ID,
          Rooms: rooms.map((room, roomID) => {
            return {
              Room_Name: room,
              Room_ID: places.filter(place => place.Room_Name == room)[0].Room_ID
            }
          })
        }
      })
    }
  })

  res.send(locationsArr)
})

router.get('/events', async (req, res) => {
  // monthStart <= eventEnd && monthEnd >= eventStart
  const { monthStart, monthEnd } = req.query;

  if (!monthStart || !monthEnd) return res.status(400).send({err: 'you suck'}).end();

  const events = await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Events',
    params: {
      $filter: `Event_Start_Date BETWEEN '${monthStart}' AND '${monthEnd}'`,
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

router.post('/events', async (req, res) => {
  const { events } = req.body;

  if (!events || !events.length)  return res.status(400).send({err: 'no event provided'}).end();

  const eventsData = await axios({
    method: 'post',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Events',
    data: events,
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(eventsData)
})

router.get('/event-rooms', async (req, res) => {
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

router.post('/event-rooms', async (req, res) => {
  const { roomsToBook } = req.body;

  if (!roomsToBook || !roomsToBook.length)  return res.status(400).send({err: 'no rooms to book provided'}).end();
  
  const roomData = await axios({
    method: 'post',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Event_Rooms',
    data: roomsToBook,
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(roomData)
})

router.get('/event-services', async (req, res) => {
  // monthStart <= eventEnd && monthEnd >= eventStart
  const { eventId } = req.query;

  if (!eventId) return res.status(400).send({err: 'no event id'}).end();

  const events = await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Event_Services',
    params: {
      $filter: `Event_ID = ${eventId} AND Cancelled = 0`,
      $select: 'Event_Services.[Service_ID], Service_ID_Table.[Service_Name], Service_ID_Table.[Description], Event_Services.[_Approved]'
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

router.post('/event-services', async (req, res) => {
  const { servicesToBook } = req.body;

  if (!servicesToBook || !servicesToBook.length)  return res.status(400).send({err: 'no rooms to book provided'}).end();

  const serviceData = await axios({
    method: 'post',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Event_Services',
    data: servicesToBook,
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(serviceData)
})

router.get('/event-equipment', async (req, res) => {
  // monthStart <= eventEnd && monthEnd >= eventStart
  const { eventId } = req.query;

  if (!eventId) return res.status(400).send({err: 'no event id'}).end();

  const events = await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Event_Equipment',
    params: {
      $filter: `Event_ID = ${eventId} AND Cancelled = 0`,
      $select: 'Event_Equipment.[Equipment_ID], Equipment_ID_Table.[Equipment_Name], Event_Equipment.[_Approved], Event_Equipment.[Quantity]'
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

router.post('/event-equipment', async (req, res) => {
  const { equipmentToBook } = req.body;

  if (!equipmentToBook || !equipmentToBook.length)  return res.status(400).send({err: 'no equipment to book provided'}).end();

  const equipmentData = await axios({
    method: 'post',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Event_Equipment',
    data: equipmentToBook,
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(equipmentData)
})

router.get('/equipment', async (req, res) => {
  const equipment = await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/Equipment',
    params: {
      $filter: `Bookable=1 AND (Date_Retired IS NULL OR Date_Retired > GETDATE())`,
      $select: 'Equipment_ID, Equipment_Name, Date_Acquired, Equipment_Type_ID_Table.[Equipment_Type], Quantity',
      $orderby: 'Equipment_Type_ID_Table.[Equipment_Type]'
    },
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(equipment)
})

router.post('/event-sequences', async (req, res) => {
  const { Event_IDs, Table_Name } = req.body;
  
  if (!Event_IDs || !Table_Name)  return res.status(400).send({err: 'no event id or table name provided'}).end();
  
  const sequenceData = await axios({
    method: 'post',
    url: 'https://my.pureheart.org/ministryplatformapi/procs/api_PHCCreateSequence',
    data: {
      "@Record_IDs": Event_IDs.map(id => id).join(','),
      "@Table_Name": Table_Name
    },
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data[0])
    .catch(err => console.log(err))

  res.send(sequenceData)
})

router.post('/generate-sequence', async (req, res) => {
  const { sequence } = req.body;

  if (!sequence) return res.status(400).send({err: 'no sequence provided'}).end();
  
  const pattern = await axios({
    method: 'post',
    url: 'https://my.pureheart.org/ministryplatformapi/tasks/generate-sequence',
    data: sequence,
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${req.session.access_token}`
    }
  })
    .then(response => response.data)
    .catch(err => console.log(err))

  res.send(pattern)
})

// CHILDREN'S CHECK-IN
router.get('/selection', async (req, res) => {
  const { SelectionID, PageID, UserID } = req.query;

  if (!SelectionID || !PageID) return res.status(400).send({err: 'Must provide SelectionID, PageID, UserID in query'}).end();

  try {
    const result = await axios({
      method: 'post',
      url: 'https://my.pureheart.org/ministryplatformapi/procs/api_CloudTools_GetSelection',
      data: {
        "@SelectionID": SelectionID,
        "@PageID": PageID,
        "@UserID": UserID || req.session.user.userid
      },
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`,
        'Accept': 'application/json'
      }
    })
      .then(response => response.data[1])
    
    res.send(result);
  } catch (error) {
    const err = {
      status: error.response ? error.response.status : 500,
      statusText: error.response ? error.response.statusText : 'something went wrong please try again',
      data: error.response ? error.response.data : {}
    }
    res.status(err.status).send(err.data);
  }
})

router.post('/PHCChildrenCheckin', async (req, res) => {
  const { EventIDs } = req.body;

  if (!EventIDs) return res.status(400).send({err: 'Must provide EventIDs in body'}).end();

  try {
    const result = await axios({
      method: 'post',
      url: 'https://my.pureheart.org/ministryplatformapi/procs/PHCChildrenCheckin',
      data: {
        "@EventIDs": EventIDs
      },
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`,
        'Accept': 'application/json'
      }
    })
      .then(response => response.status)
    
    res.sendStatus(result);
  } catch (error) {
    const err = {
      status: error.response ? error.response.status : 500,
      statusText: error.response ? error.response.statusText : 'something went wrong please try again',
      data: error.response ? error.response.data : {}
    }
    res.status(err.status).send(err.data);
  }
})

router.post('/PHCCreateEventSequence', async (req, res) => {
  const { EventIDs } = req.body;

  if (!EventIDs) return res.status(400).send({err: 'Must provide EventIDs in body'}).end();

  try {
    const result = await axios({
      method: 'post',
      url: 'https://my.pureheart.org/ministryplatformapi/procs/api_PHCCreateEventSequence',
      data: {
        "@EventIDs": EventIDs
      },
      headers: {
        'Authorization': `Bearer ${req.session.access_token}`,
        'Accept': 'application/json'
      }
    })
      .then(response => response.status)
    
    res.sendStatus(result);
  } catch (error) {
    const err = {
      status: error.response ? error.response.status : 500,
      statusText: error.response ? error.response.statusText : 'something went wrong please try again',
      data: error.response ? error.response.data : {}
    }
    res.status(err.status).send(err.data);
  }
})

module.exports = router;