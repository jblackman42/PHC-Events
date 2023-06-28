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

module.exports = router;