const qs = require('qs')
const axios = require('axios');

const getAccessToken = async (username, password) => {
  const login = await axios({
      method: 'post',
      url: `${process.env.BASE_URL}/oauth/connect/token`,
      data: qs.stringify({
          grant_type: "password",
          scope: "http://www.thinkministry.com/dataplatform/scopes/all openid offline_access",
          client_id: process.env.CLIENT_ID,
          username: username,
          password: password
      }),
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')}`
      }
  })
      .then(response => response.data)
  
  const {access_token, token_type, refresh_token, expires_in} = login;

  return access_token;
}

const populate = async () => {
  let schedules = [];

  let returnLength = Infinity;
  let count = 0;

  while (returnLength >= 1000) {
    const newSchedules = await axios({
      method: 'get',
      url: 'https://my.pureheart.org/ministryplatformapi/tables/Prayer_Schedules',
      params: {
        '$skip': count
      },
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${await getAccessToken('jblackman', 'Jd21678400=')}`
      }
    })
      .then(response => response.data)

    returnLength = newSchedules.length;
    count += returnLength;

    newSchedules.forEach(schedule => schedules.push(schedule))
  }

  // console.log(schedules)


  let contactCount = 0;
  for (let i = 0; i < schedules.length; i ++) {
    const { Prayer_Schedule_ID } = schedules[i];

    await axios({
      method: 'post',
      url: 'https://my.pureheart.org/ministryplatformapi/procs/api_PrayerSignup',
      data: {
        "@PrayerScheduleID": Prayer_Schedule_ID
      },
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${await getAccessToken('jblackman', 'Jd21678400=')}`
      }
    })

    contactCount ++;
    console.log(`${contactCount} / ${schedules.length}`)
  }
}

module.exports = {
  populate
}