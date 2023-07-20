const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs')
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const FormData = require('form-data');
const upload = multer();

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



router.get('/ministry-question', async (req, res) => {
    const { ministryQuestionID } = req.query;
    
    if (!ministryQuestionID) return res.status(400).send({err: 'no ministry question id'}).end();

    try {
        //get access token for accessing database informatin
        const accessToken = await getAccessToken();

        const data = await axios({
            method: 'get',
            url: `https://my.pureheart.org/ministryplatformapi/tables/Ministry_Questions/${ministryQuestionID}`,
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'Application/JSON'
            }
          })
            .then(response => response.data[0])

        res.send(data);
    } catch (e) {
        const { response } = e;
        const { data } = response;
        const { Message } = data;
        console.log(e)
        res.status(response.status).send(Message).end();
    }
})

router.get('/ministry-answers', async (req, res) => {
    const { ministryQuestionID, monthly } = req.query;
    
    if (!ministryQuestionID || !monthly) return res.status(400).send({err: 'no ministry question id'}).end();
    
    try {
        const data = await axios({
            method: 'post',
            url: `https://my.pureheart.org/ministryplatformapi/procs/api_PHC_GetMinistryAnswers`,
            data: {
                "@QuestionID": ministryQuestionID,
                "@Monthly": monthly
            },
            headers: {
                'Authorization': `Bearer ${await getAccessToken()}`,
                'Content-Type': 'application/json'
            },
        })
            .then(response => response.data[0])

        res.send(data);
    } catch (e) {
        const { response } = e;
        const { data } = response;
        const { Message } = data;
        res.status(response.status).send(Message).end();
    }
})

router.get('/ministry-answers-monthly', async (req, res) => {
    // const { ministryQuestionID } = req.query;
    
    // if (!ministryQuestionID) return res.status(400).send({err: 'no ministry question id'}).end();

    // try {
    //     //get access token for accessing database informatin
    //     const accessToken = await getAccessToken();

    //     const data = await axios({
    //         method: 'get',
    //         url: `https://my.pureheart.org/ministryplatformapi/tables/Fiscal_Period_Answers`,
    //         params: {
    //             $filter: `Ministry_Question_ID = ${ministryQuestionID}`,
    //             $select: `Fiscal_Period_ID_Table.[Fiscal_Period_Start], Fiscal_Period_Answer_ID, Fiscal_Period_Answers.[Fiscal_Period_ID], Ministry_Question_ID, Numerical_Value, Fiscal_Period_Answers.[Congregation_ID], Congregation_ID_Table.[Congregation_Name], Ministry_ID, Program_ID, Type`,
    //             $orderby: `Fiscal_Period_ID_Table.[Fiscal_Period_Start]`
    //         },
    //         headers: {
    //             'Authorization': `Bearer ${accessToken}`,
    //             'Content-Type': 'Application/JSON'
    //         }
    //     })
    //         .then(response => response.data)

    //     res.send(data);
    // } catch (e) {
    //     const { response } = e;
    //     const { data } = response;
    //     const { Message } = data;
    //     res.status(response.status).send(Message).end();
    // }
    
    const { ministryQuestionID } = req.query;
    
    if (!ministryQuestionID) return res.status(400).send({err: 'no ministry question id'}).end();

    try {
        let count = 0;
        let results = [];
        let hasMoreData = true;
        const accessToken = await getAccessToken();
        
        while (hasMoreData) {
            const response = await axios({
                method: 'get',
                url: `https://my.pureheart.org/ministryplatformapi/tables/Fiscal_Period_Answers`,
                params: {
                    $filter: `Ministry_Question_ID = ${ministryQuestionID}`,
                    $select: `Fiscal_Period_ID_Table.[Fiscal_Period_Start], Fiscal_Period_Answer_ID, Fiscal_Period_Answers.[Fiscal_Period_ID], Ministry_Question_ID, Numerical_Value, Fiscal_Period_Answers.[Congregation_ID], Congregation_ID_Table.[Congregation_Name], Ministry_ID, Program_ID, Type`,
                    $orderby: `Fiscal_Period_ID_Table.[Fiscal_Period_Start]`
                },
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'Application/JSON'
                }
            })
    
            const data = response.data;
    
            // Check if we got fewer items than expected, which means this was the last page
            if (data.length < 1000) {
                hasMoreData = false;
            }
    
            results = results.concat(data);
            count += 1000;
        }
    
        // return results;
        
        res.send(results);
    } catch (e) {
        const { response } = e;
        const { data } = response;
        const { Message } = data;
        res.status(response.status).send(Message).end();
    }
})

router.put('/expirations', async (req, res) => {
    const { updatedLicense } = req.body;

    try {
        const data = await axios({
            method: 'put', //put means update
            url: 'https://my.pureheart.org/ministryplatformapi/tables/expirations', //get from swagger
            data: [updatedLicense], //always an array for put/post so you can do multiple
            headers: {
                'Content-Type': 'Application/JSON',
                'Authorization': `Bearer ${await getAccessToken()}`
            }
        })
            .then(response => response.data)

        res.status(200).send(data).end();
    } catch (err) {
        console.log(err)
        res.status(500).send({error: err}).end();
    }
})

router.post('/files/expirations', upload.any(), async (req, res) => {
    const { id } = req.query;

    const formData = new FormData();
    req.files.forEach((file) => {
        formData.append(file.originalname, file.buffer, file.originalname);
    });

    const formHeaders = formData.getHeaders();

    try {
        const data = await axios({
            method: 'post',
            url: `https://my.pureheart.org/ministryplatformapi/files/expirations/${id}`,
            data: formData,
            // Do not set Content-Type manually, let axios set it automatically.
            headers: {
                ...formHeaders,
                'Authorization': `Bearer ${await getAccessToken()}`
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        })
            .then(response => response.data)

        res.status(200).send(data).end();
    } catch (err) {
        // console.log(err)
        res.status(500).send({error: err}).end();
    }
});

module.exports = router;