const express = require('express');
const router = express.Router();
const MinistryPlatformAPI = require('ministry-platform-api-wrapper');
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const { ensureApiAuthenticated } = require('../middleware/authorization.js')

router.post('/get-program', ensureApiAuthenticated, async (req, res) => {
  const programs = await MinistryPlatformAPI.request('get', '/tables/Programs', {"$select":"Programs.Program_ID, Programs.Program_Name, Programs.Congregation_ID, Congregation_ID_Table.Congregation_Name, Congregation_ID_Table.Location_ID, Congregation_ID_Table_Location_ID_Table.Location_Name","$filter":"Programs.End_Date IS NULL OR Programs.End_Date > GETDATE()"}, {})
  const { Event_Title, Event_Type, Congregation_Name, Location_Name, Description, Display_Name, Visibility_Level, Featured_On_Calendar } = req.body;
  const eventString = `Title: ${Event_Title}. Type: ${Event_Type}. Congregation: ${Congregation_Name}. Location: ${Location_Name}. Description: ${Description}. Contact: ${Display_Name}. Visibility: ${Visibility_Level}. Featured on Calendar: ${Featured_On_Calendar}.`;

  const currentPrograms = programs.filter(program => program.Congregation_Name == Congregation_Name || program.Location_Name == Location_Name || [9,2].includes(parseInt(program.Congregation_ID)));
  const availablePrograms = currentPrograms.map(program => `${program.Program_Name} - ${program.Program_ID}`).join(', ');
  const messages = [
    {
      "role": "assistant",
      "content": "You are an assistant that recommends a program id based on event descriptions."
    },
    {
      "role": "user",
      "content": `Event: ${eventString}. Available Programs: ${availablePrograms}`
    }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_FT_MODEL,
      messages: messages,
      temperature: 1,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
  
    const program = response.choices[0].message.content;
    const match = program.match(/\d+/); // Match the first sequence of digits in the string
    const Program_ID = match ? parseInt(match[0], 10) : 1; //pull out number from program string, default 1 if it fails
    return res.send({Program_ID: Program_ID})
  } catch (error) {
    console.log(error);
    return res.send({Program_ID: 1}) // default to 1 if something goes wrong
  }
})

module.exports = router;