class PHC_Calendar extends HTMLElement {
  constructor() {
    super();
    // set important stuff
    this.id = 'calendar-container';

    // globals
    this.dayMaxEvents = 21;
    this.monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const today = new Date();
    this.month = today.getMonth();
    this.year = today.getFullYear();

    this.update();
    this.createDetailsPopup();
  }
  
  update = async () => {
    loading();
    await this.getPlaces();
    await this.getEvents();
    this.createCalendar();
    doneLoading();


    console.log(this.events)
  }

  getPlaces = async () => {
    this.places = await axios({
      method: 'get',
      url: '/api/mp/places'
    })
      .then(response => response.data)

    console.log(this.places)
  }

  getEvents = async () => {
    // Get all days that will be visible on calendar

    const startDate = new Date(this.year, this.month, 1)
    this.monthArr = [];

    while (startDate.getMonth() === this.month) {
      this.monthArr.push(startDate.toISOString());
      startDate.setDate(startDate.getDate() + 1);
    }

    const daysToGoBack = new Date(this.monthArr[0]).getDay();
    const currDate = new Date(this.monthArr[0])
    for (let i = 0; i < daysToGoBack; i ++) {
      currDate.setDate(currDate.getDate() - 1);
      this.monthArr.unshift(currDate.toISOString());
    }

    const monthStart = this.monthArr[0];
    const monthLastDay = new Date(this.monthArr[this.monthArr.length-1])
    const monthEnd = new Date(monthLastDay.getTime() + 86399999).toISOString()

    // console.log(monthStart)
    // console.log(monthEnd)

    this.events = await axios({
      method: 'get',
      url: '/api/mp/events',
      params: {
        monthStart: monthStart,
        monthEnd: monthEnd
      }
    })
      .then(response => response.data)
  }

  createCalendar = () => {
    this.innerHTML = `
      <div id="calendar-controls">
          <div class="row">
              <div class="date-selector">
                  <button class="nav-buttons" id="prev-month-btn"><i class="material-icons">keyboard_arrow_left</i></button>
                  <p id="date-label">${this.monthsList[this.month]} ${this.year}</p>
                  <button class="nav-buttons" id="next-month-btn"><i class="material-icons">keyboard_arrow_right</i></button>
              </div>
              <div class="calendar-search">
                  <input type="text" id="search">
                  <button id="search-btn">Search</button>
                  <div class="search-results"></div>
              </div>
          </div>
          <div class="filter-controls">
              <div>
                  <label for="filter">Location: </label>
                  <div class="filter-box">
                      <select name="filter" id="filter" onchange="handleFilterChange(event)">
                          <option value="0">All</option>
                      </select>
                  </div>
              </div>

              <div>
                  <label for="building-filter">Building:</label>
                  <div class="filter-box">
                      <select name="building-filter" id="building-filter" onchange="handleBuildingFilterChange(event)">
                          <option value="0">All</option>
                      </select>
                  </div>
              </div>

              <div>
                  <label for="room-filter">Room:</label>
                  <div class="filter-box">
                      <select name="room-filter" id="room-filter">
                          <option value="0">All</option>
                      </select>
                  </div>
              </div>

              <div class="button-container">
                  <button class="btn" id="reset-btn" onclick="handleReset()">Reset</button>
                  <button class="btn" onclick="handleEvents()">Submit</button>
              </div>
          </div>
      </div>

      <div id="calendar-labels">
          <p>s<span>unday</span></p>
          <p>m<span>onday</span></p>
          <p>t<span>uesday</span></p>
          <p>w<span>ednesday</span></p>
          <p>t<span>hursday</span></p>
          <p>f<span>riday</span></p>
          <p>s<span>aturday</span></p>
      </div>
      
      <div id="calendar">
        ${this.monthArr.map(day => {
          const currDate = new Date(day);
          const endOfCurrDate = new Date(currDate.getTime() + 86399999)
          const daysEvents = this.events.filter(event => currDate <= new Date(event.Event_End_Date) && endOfCurrDate >= new Date(event.Event_Start_Date));
          return `
            <button class="calendar-day">
              <p>${currDate.getDate()}<sup>th</sup></p>
              <p class="eventsNumber">${daysEvents.length} Events</p>
              <div class="progressBar" style="max-width: ${Math.round((daysEvents.length / this.dayMaxEvents) * 100)}%"></div>
            </button>
          `
        }).join('')}
      </div>
    `

    const calendarDaysList = document.querySelectorAll('.calendar-day');
    calendarDaysList.forEach((elem, i) => {
      elem.onclick = () => this.showDetailsPopup(this.monthArr[i])
    })

    const nextMonthBtnDOM = document.getElementById('next-month-btn');
        nextMonthBtnDOM.onclick = this.nextMonth;
    const prevMonthBtnDOM = document.getElementById('prev-month-btn');
        prevMonthBtnDOM.onclick = this.prevMonth;
  }

  nextMonth = () => {
    if (this.month < 11) {
      this.month ++;
    } else {
      this.month = 0;
      this.year ++;
    }

    this.update();
  }

  prevMonth = () => {
    if (this.month > 0) {
      this.month --;
    } else {
      this.month = 11;
      this.year --
    }

    this.update();
  }

  createDetailsPopup = () => {
    const eventDetailsPopupDOM = document.createElement('div');
    eventDetailsPopupDOM.id = 'popup-container';
    document.body.appendChild(eventDetailsPopupDOM)
  }

  showDetailsPopup = async (day) => {
    this.hideDetailsPopup();
    loading();

    const currDate = new Date(day);
    const endOfCurrDate = new Date(currDate.getTime() + 86399999)
    const daysEvents = this.events.filter(event => currDate <= new Date(event.Event_End_Date) && endOfCurrDate >= new Date(event.Event_Start_Date));

    const daysEventsRooms = await axios({
      method: 'get',
      url: '/api/mp/event-rooms',
      params: {
        eventIDs: daysEvents.map(event => event.Event_ID)
      }
    })
      .then(response => response.data)

    const eventDetailsPopupDOM = document.getElementById('popup-container');
    eventDetailsPopupDOM.classList.add('open');

    eventDetailsPopupDOM.innerHTML = `
      <button id="prev-day-btn"><i class="material-icons">keyboard_arrow_left</i></button>
      <div id="popup">
          <div class="title">
              <h1 id="event-date">${currDate.toLocaleDateString('en-us', { weekday:"short", year:"numeric", month:"short", day:"numeric"})}</h1>
              <p id="number-of-events">${daysEvents.length} Events</p>
              <button class="close-button" id="details-close-btn"><i class="material-icons">close</i></button>
          </div>
          
          <ul id="events-list">
            ${daysEvents.map(event => {
              const { Event_ID, Event_Title, Minutes_for_Setup, Minutes_for_Cleanup, Location_Name, Event_End_Date, Event_Start_Date } = event;
              const eventsRooms = daysEventsRooms.filter(room => room.Event_ID == Event_ID)

              const eventStartTime = new Date(Event_Start_Date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
              const eventEndTime = new Date(Event_End_Date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
              const eventTimesString = `${eventStartTime} - ${eventEndTime}`;

              const reservedStartTime = new Date(new Date(Event_Start_Date).getTime() - (Minutes_for_Setup * 60000)).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
              const reservedEndTime = new Date(new Date(Event_End_Date).getTime() + (Minutes_for_Cleanup * 60000)).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
              const reservedTimeString = `${reservedStartTime} - ${reservedEndTime}`;
              
              return `
                <li class="event" id="event-${Event_ID}">
                    <div style="flex-wrap:wrap;">
                        <h4 id="event-name">${Event_Title}</h4>
                    </div>
                    ${Minutes_for_Setup || Minutes_for_Cleanup ? `
                        <div>
                            <p id="label">Reserved Time:</p>
                            <p>${reservedTimeString}</p>
                        </div>
                    ` : ''}
                    <div>
                        <p id="label">Event Time:</p>
                        <p>${eventTimesString}</p>
                    </div>
                    <div>
                        <p>Location:</p>
                        <p>${Location_Name || 'Unknown'}</p>
                    </div>
                    <div>
                        <p id="label">${'Rooms'}:</p>
                        <p id="rooms-list">${eventsRooms.length ? [...new Set(eventsRooms.map(room => room.Room_Name))].join(', ') : 'No Rooms Booked'}</p>
                    </div>
                    <div class="btn-container">
                        <a class="popup-btn" href="https://my.pureheart.org/mp/${308}/${Event_ID}" target="_blank"><i class="material-icons">description</i><span class="btn-label">View on MP</span></a>
                        <a class="popup-btn" target="_blank" href="https://outlook.office.com/calendar/0/deeplink/compose?allday=false&enddt=${new Date(Event_End_Date).toISOString()}&location=${Location_Name || 'Unknown'}&path=/calendar/action/compose&rru=addevent&startdt=${new Date(Event_Start_Date).toISOString()}&subject=${Event_Title}"><i class="material-icons">bookmark</i><span class="btn-label">Add to Calendar</span></a>
                        <a href="/print?id=${Event_ID}" id="print" class="popup-btn"><i class="material-icons">print</i><span class="btn-label">Print</span></a>
                    </div>
                </li>
              `
            }).join('')}
          </ul>
      </div>
      <button id="next-day-btn" onClick="nextDay()"><i class="material-icons">keyboard_arrow_right</i></button>
    `

    const detailsCloseBtnDOM = document.getElementById('details-close-btn');
    detailsCloseBtnDOM.onclick = this.hideDetailsPopup;

    const nextDayBtn = document.getElementById('next-day-btn');
    nextDayBtn.onclick = () => this.nextDay(day)
    const prevDayBtn = document.getElementById('prev-day-btn');
    prevDayBtn.onclick = () => this.prevDay(day)

    doneLoading();
  }

  hideDetailsPopup = () => {
    const eventDetailsPopupDOM = document.getElementById('popup-container');
    eventDetailsPopupDOM.classList.remove('open');
  }

  nextDay = (day) => {
    const nextDayIndex = this.monthArr.indexOf(day) + 1;
    const nextDay = this.monthArr[nextDayIndex];
    if (nextDay) this.showDetailsPopup(nextDay)
  }
  prevDay = (day) => {
    const prevDayIndex = this.monthArr.indexOf(day) - 1;
    const prevDay = this.monthArr[prevDayIndex];
    if (prevDay) this.showDetailsPopup(prevDay)
  }
}

customElements.define('phc-calendar', PHC_Calendar);