// Define tools to generate the route
const tools = new Map();
// tools.set({Tool Name}, {Path to Tool Page})
tools.set('test', 'pages/tools/test');
tools.set('updateAnswers', 'pages/tools/updateAnswers');















const express = require('express');
const router = express.Router();
const qs = require('qs')
const axios = require('axios');

// TOOL AUTHORIZE MIDDLEWARE

const authorize = async (req, res, next) => {
  try {
    if (!req.query.code && !req.session.access_token) {
      const id = req.path.split('/').at(-1);

      req.session.access_token = null;
      req.session.toolName = id;
      req.session.toolParams = qs.stringify(req.query); // Save initial parameters
    
      const params = new URLSearchParams({
        client_id: process.env.TOOL_CLIENT_ID,
        redirect_uri: `${process.env.DOMAIN_NAME}/api/tools/login`,
        response_type: 'code',
        scope: 'http://www.thinkministry.com/dataplatform/scopes/all'
      }).toString();

      return res.redirect('https://my.pureheart.org/ministryplatformapi/oauth/connect/authorize?' + params)
    } else if (!req.session.access_token) {
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
  
      const { access_token, expires_in, token_type } = tokenData;
      req.session.access_token = access_token;
      req.session.expires_in = expires_in;
      req.session.token_type = token_type;
  
      return res.redirect(req.originalUrl.split('?')[0] + '?' + req.session.toolParams);
    } else {
      return next();
    }
  } catch (error) {
    console.log(error)
    const err = {
      status: error.response ? error.response.status : 500,
      statusText: error.response ? error.response.statusText : 'Something Went Wrong',
      data: error.response ? error.response.data : {}
    }
    return res.status(err.status).send(err).end();
  }
}

router.get('/login', authorize, (req, res) => {
  res.redirect(`/api/tools/${req.session.toolName}`)
})

// TOOL ROUTES

for (const [toolPathName, pathToToolPage] of tools) {
  router.get(`/${toolPathName}`, (req, res) => {
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