// global data vars
let user;
let locations = [];
let primaryContacts = [];
let eventTypes = [];
let congregations = [];
// global html vars
const eventCreatorDOM = document.querySelector('#event-creator');
const eventNameDOM = document.querySelector('#event-name')
const eventDescDOM = document.querySelector('#event-desc');
const primaryContactDOM = document.querySelector('#primary-contact');
const startDateDOM = document.querySelector('#start-date');
const startTimeDOM = document.querySelector('#start-time');
const endTimeDOM = document.querySelector('#end-time')
const eventTypeDOM = document.querySelector('#event-type');
const attendanceDOM = document.querySelector('#attendance')
const congregationDOM = document.querySelector('#congregation');
const setupTimeDOM = document.querySelector('#setup');
const cleanupTimeDOM = document.querySelector('#cleanup');
const eventLocationDOM = document.querySelector('#event-location');
const visibilityLevelDOM = document.querySelector('#visibility');

const warningMsgDOM = document.querySelector('#warning-msg');


let sectionId = 1;
const nextSection = async () => {
    const sections = document.querySelectorAll('.section');
    if (sectionId < sections.length) {
        sectionId ++;
        const currSection = document.querySelector(`#section-${sectionId}`);
        sections.forEach(section => {section.style.display = 'none'; section.style.visibility = 'hidden';})
        currSection.style.display = 'flex';
        currSection.style.visibility = 'visible';
    }
    warningMsgDOM.innerText = ""
}

const prevSection = () => {
    const sections = document.querySelectorAll('.section');
    if (sectionId > 0) {
        sectionId --;
        const currSection = document.querySelector(`#section-${sectionId}`);
        sections.forEach(section => {section.style.display = 'none'; section.style.visibility = 'hidden';})
        currSection.style.display = 'flex';
        currSection.style.visibility = 'visible';
    }
}

const loadForm = () => {
  eventCreatorDOM.innerHTML = user.display_name;
  eventLocationDOM.innerHTML = locations.map(location => {
      return `
          <option value='${location.Location_ID}'>
              ${location.Location_Name}
          </option>
      `
  }).join('')
  
  primaryContactDOM.innerHTML = primaryContacts.map(user => {
    return `
        <option value='${user.User_ID}'>
            ${user.Display_Name}
        </option>
    `
  }).join('')
  primaryContactDOM.value = user.userid;
  
  eventTypeDOM.innerHTML = eventTypes.map(eventType => {
    return `
        <option value='${eventType.Event_Type_ID}'>
            ${eventType.Event_Type}
        </option>
    `
  }).join('')
  
  congregationDOM.innerHTML = congregations.map(congregation => {
    return `
        <option value='${congregation.Congregation_ID}'>
            ${congregation.Congregation_Name}
        </option>
    `
  }).join('')
}

const toggleFormFields = (e) => {
  console.log(e.target.value)
}

// load form data
(async () => {
  user = await getUser();

  locations = await axios({
    method: 'get',
    url: '/api/mp/locations'
  })
    .then(response => response.data);
  
  primaryContacts = await axios({
    method: 'get',
    url: '/api/mp/primary-contacts'
  })
    .then(response => response.data);
  
  eventTypes = await axios({
    method: 'get',
    url: '/api/mp/event-types'
  })
    .then(response => response.data);

  congregations = await axios({
    method: 'get',
    url: '/api/mp/congregations'
  })
    .then(response => response.data);

  loadForm();
})()