const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
const { checkHost } = require('../middleware/authorization');



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
    const expiresDate = new Date(new Date().getTime() + (expires_in * 1000)).toISOString()
    return access_token;
}

const sendNotifications = async (req, res) => {

    const prayersToNotify = await axios({
        method: 'get',
        //gets all prayer requests that are to be scheduled for notification within the last 2 weeks
        url: 'https://my.pureheart.org/ministryplatformapi/tables/Prayer_Requests?$filter=Date_Created > dateadd(week,-2,getdate()) AND Notification_Scheduled=1',
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`
        }
    })
        .then(response => response.data)
        .catch(err => console.error(err))

    for (let i = 0; i < prayersToNotify.length; i ++) {

        try {

            const {Author_Name, Author_Email, Prayer_Count, Prayer_Request_ID} = prayersToNotify[i];
            console.log(prayersToNotify[i])
            //send email to prayer authors letting them know how many times their request has been prayed for
            await axios({
                method: 'post',
                url: 'https://my.pureheart.org/ministryplatformapi/messages',
                headers: {
                    'content-type': 'application/json',
                    'authorization': `Bearer ${await getAccessToken()}`
                },
                data: {
                    "FromAddress": { "DisplayName": "Prayer Wall", "Address": "noreply@pureheart.org" },
                    "ToAddresses": 
                    [ 
                        { "DisplayName": Author_Name, "Address": Author_Email }
                    ],
                    "ReplyToAddress": { "DisplayName": "noreply@pureheart.org", "Address": "noreply@pureheart.org" },
                    "Subject": "Prayer Request Update",
                    "Body": `
                        <p>Dear ${Author_Name},</p>
                        <p>We wanted to thank you for sharing your prayer request with us on our online prayer wall. We have received your request and added it to our prayer list.</p>
                        <p>We believe in the power of prayer and want to assure you that we are praying for you. So far, your request has been prayed for <strong>${Prayer_Count} times.</strong></p>
                        <p>Thank you for trusting us with your prayer request. Our thoughts and prayers are with you.</p>
                        <p>Sincerely,</p>
                        <p>Pure Heart Church<br>Prayer Team</p>
                        <br/>
                        <br/>
                        <a href="https://www.pureheart.org/prayerwall-unsubscribe/?id=${Prayer_Request_ID}">unsubscribe</a>
                    `
                    // "Body": `Your recent contribution to the Pure Heart Church Prayer Wall has just been prayed for! It has now been prayed for ${Prayer_Count} times.`
                }
            })
            //removes notification scheduled bit field
            prayersToNotify[i].Notification_Scheduled = 0;
            await axios({
                method: 'put',
                url: 'https://my.pureheart.org/ministryplatformapi/tables/Prayer_Requests',
                headers: {
                    'Authorization': `Bearer ${await getAccessToken()}`
                },
                data: [prayersToNotify[i]]
            })

        } catch (e) {
            console.log(e)
        }
    }
    
    if (!req) return console.log(`sent ${prayersToNotify.length} ${prayersToNotify.length == 1 ? 'notification' : 'notifications'}`)
    res.status(200).send({msg: `sent ${prayersToNotify.length} ${prayersToNotify.length == 1 ? 'notification' : 'notifications'}`}).end()
}

//sends emails out at 5:00PM each day
// 2:00 PM
// schedule.scheduleJob('14 0 * *', () => sendNotifications());
// schedule.scheduleJob('8 * * *', () => sendNotifications());


router.get('/send-notifications', checkHost, async (req, res) => {
    return await sendNotifications(req, res)
})

router.get('/', checkHost, async (req, res) => {

    const {skip} = req.query;
    
    const prayer_requests = await axios({
        method: 'get',
        url: `https://my.pureheart.org/ministryplatformapi/tables/Prayer_Requests?%24filter=Prayer_Status_ID%3D2&%24orderby=Date_Created%20DESC&%24top=18&%24skip=${skip}`,
        // url: `https://my.pureheart.org/ministryplatformapi/tables/Prayer_Requests?$filter=Prayer_Status_ID=2&$top=18&$skip=${skip}`,
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`
        }
    })
    .then(response => response.data)
    .catch(err => console.log(err))
    
    res.status(200).json({prayer_requests}).end();
})

router.get('/:id', checkHost, async (req, res) => {

    const prayer_request = await axios({
        method: 'get',
        url: `https://my.pureheart.org/ministryplatformapi/tables/Prayer_Requests/${req.params.id}`,
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`
        }
    })
    .then(response => response.data[0])
    .catch(err => console.log(err))
    
    res.status(200).json({prayer_request}).end();
})

router.post('/', checkHost, async (req, res) => {
    
    const response = await axios({
        method: 'post',
        url: 'https://my.pureheart.org/ministryplatformapi/tables/Prayer_Requests',
        headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${await getAccessToken()}`
        },
        data: [req.body]
    })
    .then(response => response)
    .catch(err => console.log(err))
    
    res.sendStatus(response.status)
})

router.post('/prayed', checkHost, async (req, res) => {

    try {
        const data = await axios({
            method: 'put',
            url: 'https://my.pureheart.org/ministryplatformapi/tables/Prayer_Requests',
            headers: {
                'Authorization': `Bearer ${await getAccessToken()}`
            },
            data: [req.body]
        })
        .then(response => response)
        .catch(err => console.log(err))

        console.log(data)
        res.sendStatus(data.status)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

module.exports = router;