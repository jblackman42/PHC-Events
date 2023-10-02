const express = require('express');
const app = express();
const axios = require('axios');
const qs = require('qs');
const MicrosoftGraph = require('@microsoft/microsoft-graph-client');


const { ensureApiAuthenticated } = require('../middleware/authorization.js')

const client = MicrosoftGraph.Client.init({
    authProvider: async (done) => {
        try {
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
            .then(response => {
                if (response.data && response.data.access_token) {
                    return response.data;
                } else {
                    throw new Error("Unexpected response structure from Microsoft Graph authentication");
                }
            });
            
            done(null, access_token);
        } catch (error) {
            console.error('Error fetching token from Microsoft Graph:', error.message);

            // Depending on your needs, you might want to pass the error to the callback
            // Or handle it differently based on the context.
            done(error);
        }
    }
});

const userClient = MicrosoftGraph.Client.init({
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
            
            done(null, access_token);
        } catch (error) {
            console.error('Error fetching token from Microsoft Graph:', error.message);

            // Depending on your needs, you might want to pass the error to the callback
            // Or handle it differently based on the context.
            done(error);
        }
    }
})

// State variable to determine if polling is on or off
let isPolling = true;
let pollingMs = 20 * 1000; // 20 seconds

// Timer to manage the polling interval
let pollingTimer = null;

let latestMessageID = null;

const pollTeams = async () => {
    try {
        const { value: messages } = await client.api(`/teams/${process.env.MS_TEAM_ID}/channels/${process.env.MS_CHANNEL_ID}/messages`).get();
        messages.sort((a, b) => new Date(b.createdDateTime) - new Date(a.createdDateTime));

        const mostRecentMessage = messages[0];

        // if there is no latestMessageID saved OR the latestMessageID is the same as the mostRecentMessage id than no new message has been posted
        // otherwise the mostRecentMessage is a new message so a new ticket should be created
        const result = !latestMessageID || latestMessageID == mostRecentMessage.id ? null : mostRecentMessage;
        latestMessageID = mostRecentMessage.id;
        return result;
    } catch (error) {
        console.error('Error fetching messages from Teams:', error.message);
        return null;
    }
}

const checkForNewMessagesAndReply = async () => {
    const newMessage = await pollTeams();
    if (newMessage == null) {
        // console.log('no new message');
        return null;
    };

    try {
        const reply = await userClient.api(`/teams/${process.env.MS_TEAM_ID}/channels/${process.env.MS_CHANNEL_ID}/messages/${newMessage.id}/replies`)
            .post({
                body: {
                    content: `<p>Hi ${newMessage.from.user.displayName},</p><br><p>Thanks for reaching out to us! We've received your IT helpdesk ticket and we're on it. We'll do our best to fix the issue as soon as possible, and we'll keep you updated.</p><br><p>If you have any more information to add, you can reach out to helpdesk@pureheart.org. Please don't send multiple tickets for the same issue - it'll slow things down. If this is an emergency you can text or call Blake at 623-341-0204</p><br><p>Thanks!</p>`,
                    contentType: 'html'
                }
            })

        await axios({
            method: 'post',
            url: 'https://prod-135.westus.logic.azure.com:443/workflows/a44f87ab6dea4c5c824e48959a27a6b2/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=L0Ph1e5pj9UQZ5gS3q5wguaVWWwMncDi21_AuPNVOBw',
            data: {
                "Message_ID": newMessage.id,
                "Team_ID": process.env.MS_TEAM_ID,
                "Channel_ID": process.env.MS_CHANNEL_ID,
                "Link_to_Message": newMessage.webUrl
            }
        })
        
        return reply;
    } catch (error) {
        console.error('Error fetching messages from Teams:', error.message);
        return null;
    }
}

// Route to toggle the polling on or off
app.get('/toggle-polling', ensureApiAuthenticated, (req, res) => {
    if (isPolling) {
        clearInterval(pollingTimer);
        isPolling = false;
        res.send("Polling stopped.");
    } else {
        checkForNewMessagesAndReply();
        pollingTimer = setInterval(checkForNewMessagesAndReply, pollingMs); // Poll every 20 seconds
        isPolling = true;
        res.send("Polling started.");
    }
});

// auto start polling
pollingTimer = setInterval(checkForNewMessagesAndReply, pollingMs); // Poll every 20 seconds

module.exports = app;