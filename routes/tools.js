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
            client_id: process.env.TOOL_CLIENT_ID,
            client_secret: process.env.TOOL_CLIENT_SECRET
        })
    })
        .then(response => response.data)
    const {access_token, expires_in} = data;
    const expiresDate = new Date(new Date().getTime() + (expires_in * 1000)).toISOString()
    return access_token;
}

const getUser = async (user_guid, access_token) => {
  return await axios({
    method: 'get',
    url: 'https://my.pureheart.org/ministryplatformapi/tables/dp_Users',
    params: {
      '$filter':`User_GUID='${user_guid}'`
    },
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.data[0])
}

const toolMiddleware = async (req, res, next) => {
  try {
    const { dg, ug } = req.query;
    const access_token = await getAccessToken();
    const user = await getUser(ug, access_token);
    req.session.access_token = access_token;
    req.session.user = user;
  
    next();
  } catch (err) {
    console.log('something went wrong');
    res.sendStatus(err.response.status);
  }
}

// API ROUTES

router.get('/user', async (req, res) => {
  try {
    res.send(req.session.user);
  } catch (error) {
    console.log('something went wrong');
    res.sendStatus(err.response.status);
  }
})

router.get('/ministryQuestions', async (req, res) => {
  try {
    const ministryQuestions = await axios({
      method: 'get',
      url: 'https://my.pureheart.org/ministryplatformapi/tables/Ministry_Questions',
      params: {
        '$select': `Ministry_Question_ID, Question_Title, Question_Header`
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
    console.log(MinistryQuestionID)
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
    console.log(MinistryQuestionID)
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

// NAVIGATION ROUTES

router.get('/test', toolMiddleware, async (req, res) => {
  res.render('pages/tools/test')
})

module.exports = router;