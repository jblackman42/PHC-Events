const url = document.location.search
const eventId = new URLSearchParams(url).get('id');

const generalSectionDOM = document.getElementById('general');
const roomsSectionDOM = document.getElementById('rooms');
const equipmentSectionDOM = document.getElementById('equipment');
const servicesSectionDOM = document.getElementById('services')

const showEvent = async () => {
    loading();

    const event = await axios({
      method: 'get',
      url: '/api/mp/event',
      params: {
        eventId: eventId
      }
    })
      .then(response => response.data)

    const eventRooms = await axios({
      method: 'get',
      url: '/api/mp/event-rooms',
      params: {
        eventIDs: [eventId]
      }
    })
      .then(response => response.data)

    const eventEquipment = await axios({
      method: 'get',
      url: '/api/mp/event-equipment',
      params: {
        eventId: eventId
      }
    })
      .then(response => response.data)

      const eventServices = await axios({
        method: 'get',
        url: '/api/mp/event-services',
        params: {
          eventId: eventId
        }
      })
        .then(response => response.data)
      
    console.log(event)
    console.log(eventRooms)
    console.log(eventEquipment)
    console.log(eventServices)

    const { Event_Title, Event_Type, Congregation_Name, Location_Name, Meeting_Instructions, Description, Program_Name, Participants_Expected, Minutes_for_Setup, Minutes_for_Cleanup, Event_Start_Date, Event_End_Date, Cancelled, Display_Name } = event;

    // event info section ----------------------------------------

    generalSectionDOM.innerHTML = `
        <h1>General:</h1>
        
        <div class="field">
            <p class="label">Event Title:</p>
            <p class="value">${Event_Title}</p>
        </div>
        <div class="field">
            <p class="label">Event Type:</p>
            <p class="value">${Event_Type }</p>
        </div>
        <div class="field">
            <p class="label">Congregation:</p>
            <p class="value">${Congregation_Name}</p>
        </div>
        <div class="field">
            <p class="label">Location:</p>
            <p class="value">${Location_Name || 'N/A'}</p>
        </div>
        <div class="field">
            <p class="label">Meeting Instructions:</p>
            <p class="value">${Meeting_Instructions || 'N/A'}</p>
        </div>
        <div class="field" id="description">
            <p class="label">Description:</p>
            <p class="value">${Description || 'N/A'}</p>
        </div>
        <div class="field">
            <p class="label">Program:</p>
            <p class="value">${Program_Name}</p>
        </div>
        <div class="field">
            <p class="label">Minutes For Setup:</p>
            <p class="value">${Minutes_for_Setup}</p>
        </div>
        <div class="field">
            <p class="label">Minutes For Cleanup:</p>
            <p class="value">${Minutes_for_Cleanup}</p>
        </div>
        <div class="field">
            <p class="label">Event Start Date:</p>
            <p class="value">${new Date(Event_Start_Date).toLocaleDateString()} @ ${new Date(Event_Start_Date).toLocaleTimeString()}</p>
        </div>
        <div class="field">
            <p class="label">Event End Date:</p>
            <p class="value">${new Date(Event_End_Date).toLocaleDateString()} @ ${new Date(Event_End_Date).toLocaleTimeString()}</p>
        </div>
        <div class="field">
            <p class="label">Cancelled:</p>
            <p class="value">${Cancelled ? 'Yes' : 'No'}</p>
        </div>
        <div class="field">
            <p class="label">Participants Expected:</p>
            <p class="value">${Participants_Expected || 'N/A'}</p>
        </div>
        <div class="field">
            <p class="label">Primary Contact:</p>
            <p class="value">${Display_Name}</p>
        </div>
    `

    // room info section ------------------------------------------------------------

    const buildings = [...new Set(eventRooms.map(room => room.Building_Name))]

    const roomsSectionHTML = buildings.map(building => {
      return `
          <div class="field">
              <p class="label">Building ${building}:</p>
              <p class="value">${[... new Set(eventRooms.filter(room => room.Building_Name == building).map(room => room.Room_Name))].join(', ')}</p>
          </div>
      `
  }).join('')
  
  roomsSectionHTML ? roomsSectionDOM.innerHTML = `
      <h1>Rooms:</h1>
      ${roomsSectionHTML}
  ` : ''

  // equipment info section -----------------------------------------------------------

    const equipmentSectionHTML = eventEquipment.map(equipment => {
      const {Equipment_ID, Quantity, Equipment_Name, _Approved} = equipment;
      return `
          <div class="field">
              <p class="label">${Equipment_Name}:</p>
              <p class="value">${Quantity}</p>
          </div>
      `
  }).join('')

  equipmentSectionHTML ? equipmentSectionDOM.innerHTML = `
      <h1>Equipment:</h1>
      ${equipmentSectionHTML}
  ` : ''

  // service info section ---------------------------------------------------------------

    const servicesSectionHTML = eventServices.map(service => {
      const {Service_Name, Description} = service;
      return `
          <div class="field">
              <p class="label">${Service_Name}:</p>
              <p class="value">${Description}</p>
          </div>
      `
  }).join('')

  servicesSectionHTML ? servicesSectionDOM.innerHTML = `
      <h1>Services:</h1>
      ${servicesSectionHTML}
  ` : ''

  doneLoading();

  print();
}
if (eventId) showEvent()
else window.location.href = '/';