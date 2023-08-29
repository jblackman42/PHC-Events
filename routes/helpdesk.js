const express = require('express');
const app = express();
const axios = require('axios');
const qs = require('qs');
const MicrosoftGraph = require('@microsoft/microsoft-graph-client');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const MS_GRAPH_API = {
    getAccessToken: async () => {
        const { access_token } = await axios({
            method: 'get',
            url: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
            data: qs.stringify({
                grant_type: "client_credentials",
                scope: "https://graph.microsoft.com/.default",
                client_secret: process.env.MS_CLIENT_SECRET,
                client_id: process.env.MS_CLIENT_ID,
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(response => response.data);

        return access_token;
    },
    renewSubscription: async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 3);
        tomorrow.setHours(0);
        tomorrow.setMinutes(-tomorrow.getTimezoneOffset());
        tomorrow.setSeconds(0);
        tomorrow.setMilliseconds(0);
        return await axios({
            method: 'patch',
            url: `https://graph.microsoft.com/v1.0/subscriptions/${process.env.MS_SUBSCRIPTION_ID}`,
            data: {
                "expirationDateTime": tomorrow.toISOString()
            },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await MS_GRAPH_API.getAccessToken()}`
            }
        })
            .then(response => response.data)
    }
}

const client = MicrosoftGraph.Client.init({
    authProvider: async (done) => {
        try {
            const { access_token, refresh_token } = await axios({
                method: 'post',
                url: `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
                data: qs.stringify({
                    grant_type: "refresh_token",
                    scope: "https://graph.microsoft.com/.default",
                    client_id: process.env.MS_CLIENT_ID,
                    client_secret: process.env.MS_CLIENT_SECRET,
                    refresh_token: process.env.MS_REFRESH_TOKEN
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            })
            .then(response => {
                if (response.data && response.data.access_token && response.data.refresh_token) {
                    return response.data;
                } else {
                    throw new Error("Unexpected response structure from Microsoft Graph authentication");
                }
            });
            
            process.env.MS_REFRESH_TOKEN = refresh_token;
            done(null, access_token);
        } catch (error) {
            console.error('Error fetching token from Microsoft Graph:', error.message);

            // Depending on your needs, you might want to pass the error to the callback
            // Or handle it differently based on the context.
            done(error);
        }
    }
});

const verifyTeamsNotificationMiddleware = (req, res, next) => {
    if (req.query && req.query.validationToken) return res.send(req.query.validationToken);
    if (!req.body.value || !req.body.value.length) return res.status(401).send({error: "Invalid subscriptionId or tenantId"})
    const { subscriptionId, tenantId } = req.body.value[0];
    if (subscriptionId === process.env.MS_SUBSCRIPTION_ID && tenantId === process.env.MS_TENANT_ID) {
        return next();
    } else {
        res.status(401).send({error: "Invalid subscriptionId or tenantId"})
    }
}

app.post('/teams-notification', verifyTeamsNotificationMiddleware, async (req, res) => {
    const messageData = req.body.value[0];
    console.log(JSON.stringify(messageData));

    if (messageData.resource.includes("/replies/")) {
        console.log("Reply detected. No action taken.");
        return res.status(200).send({ message: "Reply detected. No action taken." });
    }
    
    console.log("New Conversation Detected.")
    res.sendStatus(200);
    // const resourceId = messageData.resource;

    // // Check if the resource string has multiple '/messages' indicating it might be a reply
    // const isReply = (resourceId.match(/\/messages/g) || []).length > 1;

    // if (isReply) {
    //     console.log('Detected a reply. Not sending automated response.');
    //     return res.status(200).send({ message: 'Reply detected. No action taken.' });
    // }

    // const messageId = messageData.resourceData.id;
    // if (!messageId) {
    //     console.error("Couldn't extract message ID from the payload:", messageData);
    //     return res.status(400).send({ error: 'Message ID not found in the payload.' });
    // }

    // const newMessage = {
    //     body: {
    //         content: "Automated Response!",
    //         contentType: "text"
    //     }
    // };

    // try {
    //     // Wait for a short period (e.g., 2 seconds) before sending the reply.
    //     await delay(2000);

    //     const response = await client
    //         .api(`/teams/${process.env.MS_TEAM_ID}/channels/${process.env.MS_CHANNEL_ID}/messages/${messageId}/replies`)
    //         .post(newMessage);

    //     console.log('Reply sent:', response);
    //     res.send(response);
    // } catch (err) {
    //     console.error('Failed to send automated response:', err);
    //     res.status(500).send({ error: 'Failed to send automated response.' });
    // }
});


app.post('/renew-subscription', async (req, res) => {
    try {
        const data = await MS_GRAPH_API.renewSubscription();
        res.status(200).send(data);
    } catch (error) {
        res.status(500).send(error);
    }
})


app.get('/tickets', async (req, res) => {
    const accessToken = await axios({
        method: 'post',
        url: 'https://my.pureheart.org/ministryplatformapi/oauth/connect/token',
        data: qs.stringify({
            grant_type: "client_credentials",
            scope: "http://www.thinkministry.com/dataplatform/scopes/all",
            client_id: process.env.APP_CLIENT_ID,
            client_secret: process.env.APP_CLIENT_SECRET
        })
    })
        .then(response => response.data.access_token)
        .catch(err => console.error(err))
  
    const data = await axios({
        method: 'post',
        url: `https://my.pureheart.org/ministryplatformapi/procs/api_Widget_HelpdeskTickets`,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.data[0])
        .catch(err => console.error(err))
  
    res.status(200).send(data).end();
  })

module.exports = app;