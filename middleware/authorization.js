const axios = require('axios');
const qs = require('qs');

// checks for valid access token
const ensureAuthenticated = async (req, res, next) => {
    const logging = 0;

    const {user, access_token, refresh_token} = req.session;

    if (!user || !access_token) {
        if (logging) console.log('no token')
        // kick em out
        return res.render('pages/login', {error: ''});
    };

    // checks if current access token is valid
    const isValid = await axios({
        method: 'post',
        url: `${process.env.BASE_URL}/oauth/connect/accesstokenvalidation`,
        data: qs.stringify({
            'token': req.session.access_token
        })
    })
        .then(response => {
            const {exp} = response.data;
            return new Date() < new Date(exp * 1000)
        })
        .catch(err => {
            // console.log(err)
            return false;
        })

    if (isValid) {
        if (logging) console.log('valid token')
        return next()
    };
    if (logging) console.log('invalid token')
    // if token is not valid, use refresh token to get a new one

    if (!refresh_token) {
        if (logging) console.log('no refresh toke')
        return res.render('pages/login', {error: 'session expired'})
    }
    
    const newAccessToken = await axios({
        method: 'post',
        url: `${process.env.BASE_URL}/oauth/connect/token`,
        headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')}`
        },
        data: qs.stringify({
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token
        })
    })
        .then(response => response.data.access_token)
        .catch(err => {
            console.log('ensureAuthenticated')
            console.log('something went wrong: ' + err);
            return false;
        })

    if (logging) console.log('new token')

    if (newAccessToken) {
        req.session.access_token = newAccessToken;
        return next();
    } else {
        return res.render('pages/login', {error: 'internal server error'})
    }
}

const ensureApiAuthenticated = async (req, res, next) => {
    const logging = 0;

    const {user, access_token, refresh_token} = req.session;

    if (!user || !access_token) {
        if (logging) console.log('no token')
        // kick em out
        res.status(403).send({error: 'session expired'}).end();
        return;
    };

    // checks if current access token is valid
    const isValid = await axios({
        method: 'post',
        url: `${process.env.BASE_URL}/oauth/connect/accesstokenvalidation`,
        data: qs.stringify({
            'token': req.session.access_token
        })
    })
        .then(response => {
            const {exp} = response.data;
            return new Date() < new Date(exp * 1000)
        })
        .catch(err => {
            // console.log(err)
            return false;
        })

    if (isValid) {
        if (logging) console.log('valid token')
        return next()
    };
    if (logging) console.log('invalid token')
    // if token is not valid, use refresh token to get a new one
    
    if (!refresh_token) {
        if (logging) console.log('no refresh token')
        res.status(403).send({error: 'session expired'}).end();
        return;
    }
    
    const newAccessToken = await axios({
        method: 'post',
        url: `${process.env.BASE_URL}/oauth/connect/token`,
        headers: {
            'Authorization': `Basic ${Buffer.from(`${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`).toString('base64')}`
        },
        data: qs.stringify({
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token
        })
    })
        .then(response => response.data.access_token)
        .catch(err => {
            console.log('ensureAuthenticated')
            console.log('something went wrong: ' + err);
            console.log(err)
            return false;
        })

    if (logging) console.log('new token')

    if (newAccessToken) {
        req.session.access_token = newAccessToken;
        return next();
    } else {
        res.status(403).send({error: 'session expired'}).end();
        return;
    }
}

const checkHost = (req, res, next) => {
    const host = req.get('host');
    
    if (process.env.WHITELISTED_DOMAINS.includes(host)) {
      next(); // Move to the next middleware/route
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Host not allowed'
      });
    }
}

module.exports = {
    ensureAuthenticated,
    ensureApiAuthenticated,
    checkHost
}