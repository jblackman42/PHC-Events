// Define tools to generate the route
const tools = new Map();
// tools.set({Tool Name}, {Path to Tool Page})
tools.set('test', 'pages/tools/test');
tools.set('updateAnswers', 'pages/tools/updateAnswers');
tools.set('createEvent', 'pages/tools/createEvent');
tools.set('checkinSetup', 'pages/tools/checkinSetup');
tools.set('childrenCheckin', 'pages/tools/childrenCheckin');















const express = require('express');
const router = express.Router();
const qs = require('qs')
const axios = require('axios');

// TOOL AUTHORIZE MIDDLEWARE

const autoLogin = async (req, res, next) => {
  req.session.toolName = req.path.split('/').at(-1);
  req.session.toolParams = qs.stringify(req.query); // Save initial parameters
  if (!req.session.access_token) {

    const params = new URLSearchParams({
      client_id: process.env.TOOL_CLIENT_ID,
      redirect_uri: `${process.env.DOMAIN_NAME}/api/tools/login`,
      response_type: 'code',
      scope: 'http://www.thinkministry.com/dataplatform/scopes/all openid'
    }).toString();

    return res.redirect('https://my.pureheart.org/ministryplatformapi/oauth/connect/authorize?' + params)
  }

  if (Date.parse(req.session.expires_at)-Date.parse(new Date())<0) {
    req.session.access_token = null;

    const params = new URLSearchParams({
      client_id: process.env.TOOL_CLIENT_ID,
      redirect_uri: `${process.env.DOMAIN_NAME}/api/tools/login`,
      response_type: 'code',
      scope: 'http://www.thinkministry.com/dataplatform/scopes/all openid'
    }).toString();

    return res.redirect('https://my.pureheart.org/ministryplatformapi/oauth/connect/authorize?' + params)
  }
  
  return next();
}

router.get('/login', async (req, res) => {
  if (req.query.code && !req.session.access_token) {
    const {code} = req.query;

    const tokenData = await axios({
      url: 'https://my.pureheart.org/ministryplatformapi/oauth/connect/token',
      method: 'POST',
      data: qs.stringify({
          'grant_type': 'authorization_code',
          'code': code,
          'redirect_uri': `${process.env.DOMAIN_NAME}/api/tools/login`,
          'client_id': process.env.TOOL_CLIENT_ID,
          'client_secret': process.env.TOOL_CLIENT_SECRET
      })
    })
      .then(response => response.data)

    const userData = await axios({
      method: 'get',
      url: 'https://my.pureheart.org/ministryplatformapi/oauth/connect/userinfo',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/json'
      }
    })
      .then(response => response.data)

    const { access_token, expires_in, token_type } = tokenData;
    const today = new Date();
    req.session.access_token = access_token;
    req.session.expires_in = expires_in;
    req.session.expires_at = new Date(today.setSeconds(today.getSeconds() + expires_in));
    req.session.token_type = token_type;
    req.session.user = userData;

    const { toolParams } = req.session;
    // return res.sendStatus(200);
    return res.redirect(`/api/tools/${req.session.toolName}${toolParams ? `?${toolParams}` : ''}`);


  }
})

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.send(200);
})

// TOOL ROUTES

for (const [toolPathName, pathToToolPage] of tools) {
  router.get(`/${toolPathName}`, autoLogin, (req, res) => {
    res.render(pathToToolPage)
  })
}

// router.get('/test', (req, res) => {
//   res.send({message: 'hello world'})
// })

// router.get('/updateAnswers', authorize, (req, res) => {
//   res.render('pages/tools/updateAnswers')
// })

module.exports = router;