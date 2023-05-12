// global data vars
let user;
let locations = [];
let primaryContacts = [];
let eventTypes = [];
let congregations = [];
let places = [];
let blockedRooms = [];
// global html vars

// page 1 inputs
const eventCreatorDOM = document.querySelector('#event-creator');
const eventNameDOM = document.querySelector('#event-name')
const eventLocationDOM = document.querySelector('#event-location');
const startDateDOM = document.querySelector('#start-date');
const startTimeDOM = document.querySelector('#start-time');
const endTimeDOM = document.querySelector('#end-time')
const primaryContactDOM = document.querySelector('#primary-contact');
const eventTypeDOM = document.querySelector('#event-type');
const attendanceDOM = document.querySelector('#attendance')
const congregationDOM = document.querySelector('#congregation');
const setupTimeDOM = document.querySelector('#setup');
const cleanupTimeDOM = document.querySelector('#cleanup');
const visibilityLevelDOM = document.querySelector('#visibility');
const eventDescDOM = document.querySelector('#event-desc');
// page 2 inputs
const needsRegistrationDOM = document.querySelector('#registration');
const needsPromotionDOM = document.querySelector('#registration');
const needsAVDOM = document.querySelector('#registration');
const needsFacilitiesDOM = document.querySelector('#registration');
const needsFacilitiesEmployeeDOM = document.querySelector('#registration');
const needsChildcareDOM = document.querySelector('#registration');

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
    warningMsgDOM.innerText = ""
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
        <option value='${user.Contact_ID}'>
            ${user.Display_Name}
        </option>
    `
  }).join('')
  primaryContactDOM.value = user.ext_Contact_ID;
  
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

const toggleFormFields = (e, elemIDs) => {
  elemIDs.forEach(id => {
    const elem = document.getElementById(id);
    if (parseInt(e.target.value)) elem.classList.remove('hidden');
    else elem.classList.add('hidden');
  })
}

const loadRoomOptions = async () => {
  loading();

  const currBuildings = places.filter(place => place.Location_ID == eventLocationDOM.value)[0].Buildings.sort((a, b) => {
    let fa = a.Building_Name.toLowerCase(),
        fb = b.Building_Name.toLowerCase();

    return fa < fb ? -1 : fa > fb ? 1 : 0;
  });
  const roomSelectorsDOM = document.getElementById('room-selectors');

  // get blocked rooms from overbooking
  
  const eventStartDate = new Date(`${startDateDOM.value}T${startTimeDOM.value}:00`);
  const eventEndDate = new Date(`${startDateDOM.value}T${endTimeDOM.value}:00`);
    // scheduleEndTime.setTime(scheduleEndTime.getTime() + (cleanupTimeDOM.value * 60000) - (scheduleEndTime.getTimezoneOffset() * 60000))
  const eventLength = eventEndDate.getTime() - eventStartDate.getTime();
  let tempPattern = pattern;
  if (!tempPattern || !tempPattern.length) tempPattern = [eventStartDate.toISOString()];

  const datesToCheck = tempPattern.map(startDate => {
    const scheduleStartTime = new Date(startDate)
      scheduleStartTime.setTime(scheduleStartTime.getTime() - (setupTimeDOM.value * 60000) - (scheduleStartTime.getTimezoneOffset() * 60000))
    const scheduleEndTime = new Date(new Date(startDate).getTime() + eventLength + (cleanupTimeDOM.value * 60000) - (scheduleStartTime.getTimezoneOffset() * 60000));

    return {
      startDate: scheduleStartTime,
      endDate: scheduleEndTime
    }
  })

  blockedRooms = await axios({
    method: 'post',
    url: '/api/mp/overlapped-rooms',
    data: {
      dates: datesToCheck
      // startDate: scheduleStartTime.toISOString(),
      // endDate: scheduleEndTime.toISOString()
    }
  })
    .then(response => response.data)
  
  // for (const startDate of tempPattern) {
  //   const scheduleStartTime = new Date(startDate)
  //     scheduleStartTime.setTime(scheduleStartTime.getTime() - (setupTimeDOM.value * 60000) - (scheduleStartTime.getTimezoneOffset() * 60000))
  //   const scheduleEndTime = new Date(new Date(startDate).getTime() + eventLength + (cleanupTimeDOM.value * 60000) - (scheduleStartTime.getTimezoneOffset() * 60000));


    
  //   blockedRooms = blockedRooms.concat(newBlockedRooms);
  // }

  const blockedRoomIDs = blockedRooms.map(room => room.Room_ID);
  
  roomSelectorsDOM.innerHTML = currBuildings.map(building => {
    const { Building_Name, Building_ID, Rooms } = building;

    if (Rooms.length == 0) return;
    return `
      <div class="building">
          <div class="building-header" onclick="toggleAccordion(${Building_ID})">
              <p class="building-name" id="building${Building_ID}">Building ${Building_Name}</p>
              <button type="button" class="toggle-btn"><i id="icon-${Building_ID}" class='fas fas fa-angle-down'></i></button>
          </div>
          <ul class="room-accordion closed" id="rooms-${Building_ID}">
              ${Rooms.map(room => {
                  const { Room_Name, Room_ID } = room;
                  const roomUnavailable = blockedRoomIDs.includes(Room_ID);
                  return `
                      <li id="${Room_ID}">
                          <input type="checkbox" class="room-input" name="room-${Room_ID}" id="room-${Room_ID}" value="${Room_ID}" ${roomUnavailable ? 'disabled' : ''}>
                          <label for="room-${Room_ID}"><span ${roomUnavailable ? `style="text-decoration:line-through;" ` : ''}>${Room_Name}</span> ${roomUnavailable ? `<i onclick="showOverbookPopup(${Room_ID}, '${Room_Name}')" class='fas fa-info-circle' style='cursor: pointer;'></i>` : ''}</label>
                      </li>
                  `
              }).join('')}
          </ul>
      </div>
  `
  }).join('')

  doneLoading();
}

const toggleAccordion = (buildingId) => {
  const accordion = document.getElementById(`rooms-${buildingId}`);
  const icon = document.getElementById(`icon-${buildingId}`);

  accordion.classList.toggle('closed');

  icon.classList.toggle('fa-angle-down');
  icon.classList.toggle('fa-angle-up');
}

const showOverbookPopup = (Room_ID, Room_Name) => {
  const popupContainer = document.querySelector('.overbook-popup-container');
  popupContainer.classList.add('open')

  const popupTitleDOM = document.getElementById('overbook-popup-title');
  const popupContentDOM = document.querySelector('.overbook-content');

  popupTitleDOM.innerText = `${Room_Name} Blocked:`;
  const currOverlappingRooms = blockedRooms.filter(eventRooms => eventRooms.Room_ID == Room_ID);
  popupContentDOM.innerHTML = currOverlappingRooms.map(eventRooms => {
      return `
          <p><span>${eventRooms.Event_Title}</span> <span>${new Date(eventRooms.Reservation_Start).toLocaleDateString()}</span></p>
      `
  }).join('');
}
const hideOverbookPopup = () => {
  const popupContainer = document.querySelector('.overbook-popup-container');
  popupContainer.classList.remove('open')
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
    
  places = await axios({
    method: 'get',
    url: '/api/mp/places'
  })
  .then(response => response.data)
  
  // enable the 'next' button when form is done loading
  const firstNextBtn = document.getElementById('first-next-btn');
  firstNextBtn.disabled = false;
  
  loadForm();
})()

document.getElementById('create-form').addEventListener('keypress', (e) => {
  if (e.key == "Enter" || e.code == "Enter") {
      e.preventDefault();
      // nextSection();
  }
})

document.getElementById('create-form').addEventListener('submit', (e) => {
  e.preventDefault();
  createEvent();
})

const createEvent = async () => {
  loading();

  const user = await getUser();

  const eventFields = [eventNameDOM.value, eventLocationDOM.value, startDateDOM.value, startTimeDOM.value, endTimeDOM.value, primaryContactDOM.value, eventTypeDOM.value, attendanceDOM.value, congregationDOM.value, setupTimeDOM.value, cleanupTimeDOM.value, visibilityLevelDOM.value, eventDescDOM.value, needsRegistrationDOM.value, needsPromotionDOM.value, needsAVDOM.value, needsFacilitiesDOM.value, needsFacilitiesEmployeeDOM.value, needsChildcareDOM.value];
  if (eventFields.filter(field => field == '').length) {
    doneLoading();
    warningMsgDOM.innerText = 'Oops! Please complete all fields before submitting the form. Thank you'
    return;
  }

  const eventStartDate = new Date(`${startDateDOM.value}T${startTimeDOM.value}:00`);
  const eventEndDate = new Date(`${startDateDOM.value}T${endTimeDOM.value}:00`);
  const eventLength = eventEndDate.getTime() - eventStartDate.getTime();
  if (!pattern || !pattern.length) pattern = [eventStartDate.toISOString()]
  // create event in MP
  const eventsToCreate = pattern.map(startDate => {
    const scheduleStartTime = new Date(startDate)
      scheduleStartTime.setTime(scheduleStartTime.getTime() - (scheduleStartTime.getTimezoneOffset() * 60000))
    const scheduleEndTime = new Date(new Date(startDate).getTime() + eventLength - (scheduleStartTime.getTimezoneOffset() * 60000));

    return {
      Event_Title: eventNameDOM.value,
      Event_Type_ID: eventTypeDOM.value,
      Congregation_ID: congregationDOM.value,
      Location_ID: eventLocationDOM.value,
      Description: eventDescDOM.value,
      Program_ID: 1, //hard coded because i hate everything
      Primary_Contact: primaryContactDOM.value,
      Participants_Expected: attendanceDOM.value,
      Minutes_for_Setup: setupTimeDOM.value,
      Minutes_for_Cleanup: cleanupTimeDOM.value,
      Event_Start_Date: scheduleStartTime.toISOString(),
      Event_End_Date: scheduleEndTime.toISOString(),
      Visibility_Level_ID: visibilityLevelDOM.value,
      Created_By_User: user.userid
    }
  })
  const createdEvents = await axios({
    method: 'post',
    url: '/api/mp/events',
    data: {
      events: eventsToCreate
    }
  })
    .then(response => response.data)
    .catch(err => {
      doneLoading();
      alert('Something terrible has happened! It looks like we failed to create your events. Please reach out to the IT team.')
    })
  
  bookRooms(createdEvents)
  bookServices(createdEvents)
  bookEquipment(createdEvents)
  createSeries(createdEvents)
 
  doneLoading();

  // go back to the calendar
  window.location = '/';

}
const bookRooms = async (createdEvents) => {
  loading();
  // get rooms to book
  const roomsToBook = [];
  for (const currEvent of createdEvents) {
    const { Event_ID } = currEvent;

    for (const elem of document.querySelectorAll('.room-input')) {
      if (!elem.checked) continue;

      roomsToBook.push({
        Event_ID: Event_ID,
        Room_ID: parseInt(elem.value)
      })
    }
  }
  
  // book rooms in MP
  if (!roomsToBook.length) return;

  await axios({
    method: 'post',
    url: '/api/mp/event-rooms',
    data: {
      roomsToBook: roomsToBook
    }
  })
    .then(response => response.data)
    .catch(err => alert('Something terrible has happened! It looks like we failed to book some rooms. Please reach out to the IT team.'))
  
  doneLoading();
}

const bookServices = async (createdEvents) => {
  loading();
  const servicesToBook = [];
  for (const currEvent of createdEvents) {
    const { Event_ID } = currEvent;

    // handle service requests
    for (const elem of document.querySelectorAll('.event-service-request')) {
      if (!parseInt(elem.value)) continue;
      const serviceID = elem.getAttribute('data-service-id');
      
      servicesToBook.push({
        Event_ID: Event_ID,
        Service_ID: parseInt(serviceID),
        Quantity: 1,
        _Approved: false
      })
    }
  }

  // book services in MP
  if (!servicesToBook.length) return;

  await axios({
    method: 'post',
    url: '/api/mp/event-services',
    data: {
      servicesToBook: servicesToBook
    }
  })
    .then(response => response.data)
    .catch(err => alert('Something terrible has happened! It looks like we failed to book some services. Please reach out to the IT team.'))
  
  doneLoading();
}

const bookEquipment = async (createdEvents) => {
  loading();

  const equipmentToBook = [];
  for (const currEvent of createdEvents) {
    const { Event_ID } = currEvent;

    for (const elem of document.querySelectorAll('.equipment-value-input')) {
      const Equipment_ID = elem.id.split('-')[1];
      const Quantity = elem.value;

      if (Quantity <= 0) continue;

      equipmentToBook.push({
        Event_ID: Event_ID,
        Equipment_ID: Equipment_ID,
        Quantity: Quantity
      })
    }
  }
  // book equipment in MP
  if (!equipmentToBook.length) return;

  await axios({
    method: 'post',
    url: '/api/mp/event-equipment',
    data: {
      equipmentToBook: equipmentToBook
    }
  })
    .then(response => response.data)
    .catch(err => alert('Something terrible has happened! It looks like we failed to book some equipment. Please reach out to the IT team.'))


  doneLoading();
}

const createSeries = async (createdEvents) => {
  loading();
  if (pattern.length <= 1) return;
  // turn recurring event into series
  const eventIDs = createdEvents.map(event => event.Event_ID);

  await axios({
    method: 'post',
    url: '/api/mp/event-sequences',
    data: {
      Event_IDs: eventIDs,
      Table_Name: 'Events'
    }
  })
    .then(response => response.data)
    .catch(err => alert('Something terrible has happened! It looks like we failed to make your recurring events into a series. Please reach out to the IT team.'))
  
  doneLoading();
}