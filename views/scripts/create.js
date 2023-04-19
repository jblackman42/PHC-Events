// global data vars
let user;
let locations = [];
let primaryContacts = [];
let eventTypes = [];
let congregations = [];
let places = [];
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

document.getElementById('create-form').addEventListener('keypress', (e) => {
  if (e.key == "Enter" || e.code == "Enter") {
      e.preventDefault();
      nextSection();
  }
})

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
  const startDateTime = new Date(startDateDOM.value);
  const startHours = startTimeDOM.value.split(':')[0];
  const startMinutes = startTimeDOM.value.split(':')[1];
    startDateTime.setHours(startHours);
    startDateTime.setMinutes(startMinutes - startDateTime.getTimezoneOffset());

  const endDateTime = new Date(startDateDOM.value);
  const endHours = endTimeDOM.value.split(':')[0];
  const endMinutes = endTimeDOM.value.split(':')[1];
    endDateTime.setHours(endHours);
    endDateTime.setMinutes(endMinutes - startDateTime.getTimezoneOffset());

  console.log(startDateTime.toLocaleString())
  console.log(endDateTime.toLocaleString())
  console.log(startDateTime.toISOString())
  console.log(endDateTime.toISOString())

  const blockedRooms = await axios({
    method: 'get',
    url: '/api/mp/overlapped-rooms',
    params: {
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString()
    }
  })
    .then(response => response.data)

  console.log(blockedRooms)

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
          <ul class="room-accordion closed" id="rooms-${Building_ID}" style="max-height: ${Rooms.length * 25}px; transition: max-height ${Rooms.length * 25}ms linear;">
              ${Rooms.map(room => {
                  const { Room_Name, Room_ID } = room;
                  const roomUnavailable = blockedRoomIDs.includes(Room_ID);
                  // const blockedRooms = overlappingEventRooms.filter(data => data.room == Room_ID);
                  // const blockedRoomDates = blockedRooms.map(room => new Date(room.day).toLocaleDateString());
                  return `
                      <li id="${Room_ID}">
                          <input type="checkbox" class="room-input" name="room-${Room_ID}" id="room-${Room_ID}" value="${Room_ID}" ${roomUnavailable ? 'disabled' : ''}>
                          <label for="room-${Room_ID}"><span ${roomUnavailable ? `style="text-decoration:line-through;" ` : ''}>${Room_Name}</span> ${roomUnavailable ? `<i onclick='showOverbookPopup(${Room_ID}, "${Room_Name}")' class='fas fa-info-circle' style='cursor: pointer;'></i>` : ''}</label>
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