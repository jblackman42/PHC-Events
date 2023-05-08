const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs')
const path = require('path');
const fs = require('fs');

// const StaffSchema = require('../models/Staff');
// const SermonSchema = require('../models/Sermons');

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

router.get('/files', (req, res) => {
    fs.readdir(path.join(__dirname, '../dist'), (err, files) => {
        res.send(files.filter(file => file !== 'styles')).status(200).end();
    });
})

router.get('/files/:filename', (req, res) => {
    const { filename } = req.params;

    fs.readdir(path.join(__dirname, '../dist'), (err, files) => {
        const currFile = files.filter(file => file == filename);

        if (!currFile.length) res.sendStatus(404);
        else res.sendFile(path.join(__dirname, '../dist', currFile[0]))
    });
})

router.get('/styles', (req, res) => {
    fs.readdir(path.join(__dirname, '../dist/styles'), (err, files) => {
        res.send(files).status(200).end();
    });
})

router.get('/styles/:filename', (req, res) => {
    const { filename } = req.params;

    fs.readdir(path.join(__dirname, '../dist/styles'), (err, files) => {
        const currFile = files.filter(file => file == filename);

        if (!currFile.length) res.sendStatus(404);
        else res.sendFile(path.join(__dirname, '../dist/styles', currFile[0]))
    });
})

router.post('/staff', async (req, res) => {
    const {Contact_ID_List} = req.body;

    if (!Contact_ID_List) {
        res.status(403).send({msg: "Procedure or function 'api_Widget_GetStaff' expects parameter '@Contact_ID_List', which was not supplied."})
    }

    const data = await axios({
        method: 'post',
        url: `https://my.pureheart.org/ministryplatformapi/procs/api_Widget_GetStaff`,
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json'
        },
        data: {
            "@Contact_ID_List": Contact_ID_List
        }
    })
        .then(response => response.data[0])
        .catch(err => console.error('oops something went terribly wrong'))

    res.status(200).send(data).end();
})

router.get('/staff-ministries', async (req, res) => {

    const data = await axios({
        method: 'post',
        url: `https://my.pureheart.org/ministryplatformapi/procs/api_MPP_Widget_GetStaffByMinistry`,
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.data[0])
        .catch(err => console.error('oops something went terribly wrong'))

    res.status(200).send(data).end();
})

// sermons widget here -------------------------------------------------------------------------------

router.get('/series', async (req, res) => {
    let SeriesType = req.query.SeriesType;
    let SeriesID = req.query.SeriesID;

    if (!SeriesType) {
        SeriesType = 1;
    }

    const data = await axios({
        method: 'post',
        url: `https://my.pureheart.org/ministryplatformapi/procs/api_Widget_GetAllSeries`,
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json'
        },
        data: {
            "@Sermon_Series_Type_ID": SeriesType,
            "@Sermon_Series_ID": SeriesID || null
        }
    })
        .then(response => response.data[0])
        .catch(err => console.error(err))

    res.status(200).send(data).end();
})

router.get('/sermons', async (req, res) => {
    let SeriesID = req.query.SeriesID

    if (!SeriesID) {
        res.status(403).send({msg: "Procedure or function 'api_Widget_GetSeries' expects parameter '@Sermon_Series_ID', which was not supplied."})
    }

    const data = await axios({
        method: 'post',
        url: `https://my.pureheart.org/ministryplatformapi/procs/api_Widget_GetSeries`,
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json'
        },
        data: {
            "@Sermon_Series_ID": SeriesID
        }
    })
        .then(response => response.data[0])
        .catch(err => console.error(err))

    res.status(200).send(data).end();
})

router.get('/test', (req, res) => {
    res.sendStatus(200);
})

router.get('/featured-events', async (req, res) => {

    console.log(8)
    const data = await axios({
        method: 'post',
        url: `https://my.pureheart.org/ministryplatformapi/procs/api_Widget_GetFeaturedEvents`,
        data: {
            "@MONTHS_FORWARD": 3,
            "@MONTHS_BACKWARD": 0
        },
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.data[0])
        .catch(err => console.error(err))

    res.status(200).send(data).end();
})

router.get('/opportunities', async (req, res) => {

    const data = await axios({
        method: 'post',
        url: `https://my.pureheart.org/ministryplatformapi/procs/api_Widget_Opportunities`,
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.data[0])
        .catch(err => console.error(err))

    res.status(200).send(data).end();
})

router.post('/opportunity-auto-place', async (req, res) => {
    //get access token for accessing database informatin
    try {
        const {id} = req.body;
        if (!id) return res.sendStatus(400)
        const data = [{"Response_ID": parseInt(id),"Response_Result_ID": 1}]
        await axios({
            url: 'https://my.pureheart.org/ministryplatformapi/tables/Responses',
            method: 'PUT',
            mode: 'cors',
            data: JSON.stringify(data),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAccessToken()}`,
            }
        })
            .then(response => response.data)
            .then((data) => {
                res.sendStatus(200)
            })
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.post('/email', async (req, res) => {
    const apiUserId = 6580;
    const apiUserContactId = 95995;

    const {Subject, Name, Email, Message, RecipientContactID} = req.body;

    try {
        await axios({
            method: 'post',
            url: 'https://my.pureheart.org/ministryplatformapi/communications',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAccessToken()}`,
            },
            data: {
                "AuthorUserId": apiUserId,
                "Subject": Subject,
                "Body": Message,
                "FromContactId": apiUserContactId,
                "ReplyToContactId": apiUserContactId,
                "ReplyToName": Name,
                "ReplyToAddress": Email,
                "ExcludeOptedOutOfBulkMessages": false,
                "Contacts": [RecipientContactID]
            }
        })
        res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

router.get('/unsubscribe', async (req, res) => {
    const id = req.query.id;

    try {

        await axios({
            method: 'put',
            url: 'https://my.pureheart.org/ministryplatformapi/tables/Prayer_Requests',
            headers: {
                "Authorization": `Bearer ${await getAccessToken()}`,
                "Content-Type": "application/json"
            },
            data: [{
                "Prayer_Request_ID": id,
                "Prayer_Notify": false,
            }]
        })

        res.sendStatus(200);
    } catch (e) {
        console.log(e)
        res.sendStatus(500);
    }
})


router.get('/group-register', async (req, res) => {
    const formGUID = req.query.Form_GUID;

    if (!formGUID) return res.status(400).send({err: 'no form guid found'}).end();

    try {
        //get access token for accessing database informatin
        const accessToken = await getAccessToken();

        const formData = await axios({
            method: 'get',
            url: `https://my.pureheart.org/ministryplatformapi/tables/Forms?$filter=Form_GUID='${formGUID}'`,
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        })
            .then(response => response.data[0])

            console.log(formData.Form_ID)
        const formFieldsData = await axios({
            method: 'get',
            url: `https://my.pureheart.org/ministryplatformapi/tables/Form_Fields?$filter=Form_ID=${formData.Form_ID}`,
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        })
            .then(response => response.data)

        res.send({
            Form: formData,
            Form_Fields: formFieldsData
        });
    } catch (e) {
        const { response } = e;
        const { data } = response;
        const { Message } = data;
        res.status(response.status).send(Message).end();
    }
})

// custom forms for stored proc stuff

router.get('/form', async (req, res) => {
    const { Form_GUID } = req.query;

    if (!Form_GUID) return res.status(400).send({err: 'no Form_GUID'}).end();

    const formData = await axios({
        method: 'get',
        url: 'https://my.pureheart.org/ministryplatformapi/tables/Forms',
        params: {
            '$select': 'Form_ID, Form_Title, Instructions, Get_Contact_Info, Get_Address_Info, Primary_Contact',
            '$filter': `Form_GUID='${Form_GUID}'`
        },
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.data[0])
        .catch(err => console.error(err))

    res.status(200).send(formData).end();
})

router.get('/form-fields', async (req, res) => {
    const { Form_ID } = req.query;

    if (!Form_ID) return res.status(400).send({err: 'no Form_ID'}).end();

    const formData = await axios({
        method: 'get',
        url: 'https://my.pureheart.org/ministryplatformapi/tables/Form_Fields',
        params: {
            '$filter': `Form_ID=${Form_ID}`,
            '$orderby': 'Field_Order'
        },
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.data)
        .catch(err => console.error(err))

    res.status(200).send(formData).end();
})

router.get('/validate-form-fields', async (req, res) => {
    const { procedure } = req.query;

    if (!procedure) return res.status(400).send({err: 'no procedure'}).end();
    const procedureData = await axios({
        method: 'get',
        url: `https://my.pureheart.org/ministryplatformapi/procs?%24search=${procedure}`,
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.data[0])
        .catch(err => console.error(err))

    res.status(200).send(procedureData.Parameters.filter(parameter => parameter.Name != '@GroupID')).end();
})

router.post('/form-submit', async (req, res) => {
    const { params, procedure, group_id } = req.body;

    if (!procedure || !params || !params.length) return res.status(400).send({err: 'missing fields'}).end();

    const parametersData = {};
    for (const item of params) {
        parametersData[item.name] = item.value;
    }
    if (group_id) parametersData['@GroupID'] = group_id;

    console.log(parametersData)

    const procedureData = await axios({
        method: 'post',
        url: `https://my.pureheart.org/ministryplatformapi/procs/${procedure}`,
        data: parametersData,
        headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.data)
        .catch(err => console.error(err))

    res.status(200).send(procedureData).end();
})

module.exports = router;