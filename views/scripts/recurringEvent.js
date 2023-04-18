let pattern;
const eventCreateLimit = 52;
const recurringEventContainer = document.querySelector('.recurring-event-container');

const dailyTab = document.getElementById('Daily');
const weeklyTab = document.getElementById('Weekly');
const monthlyTab = document.getElementById('Monthly');
const startByDate = document.getElementById('start-by');
const endByDateDOM = document.getElementById('by-date');
const endByOccurDOM = document.getElementById('occurrence');
const byDateInputDOM = document.getElementById('by-date-input');
const occurrenceNumDOM = document.getElementById('occurrence-num');
const warningMsg = document.getElementById('recurring-warning-msg');

const patternShow = () => {
  // check required fields
  const eventDate = document.getElementById('start-date');
  const eventStartTime = document.getElementById('start-time');

  if (!eventDate.value || !eventStartTime.value) {
    alert('Please fill out required Fields:\nEvent Date,\nStart Time')
    return;
  }

  recurringEventContainer.classList.add('open')

  if (startDateDOM.value) {
      const startDateTime = new Date(`${startDateDOM.value}T${startTimeDOM.value}`);
      startByDate.innerText = startDateTime.toDateString() + ' @ ' + startDateTime.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'});
  }
};
const patternHide = () => recurringEventContainer.classList.remove('open');

const cancelPattern = () => {
  const recurringLabel = document.getElementById('recurring-label');
    recurringLabel.innerText = 'One Time Event';
    pattern = undefined;
    patternHide();
}

const updatePatternOption = () => {
    const options = ['Daily', 'Weekly', 'Monthly'];
    const activeOption = document.querySelector('.active').id;

    const hiddenOptions = options.filter(option => option != activeOption);
    hiddenOptions.forEach(optionName => {
        const elem = document.getElementById(`${optionName}-options`);
        elem.style.visibility = 'hidden';
        elem.style.display = 'none';
    })
    const activeElem = document.getElementById(`${activeOption}-options`)
    activeElem.style.visibility = 'visible';
    activeElem.style.display = 'block';
}
updatePatternOption();

const showDaily = () => {
  dailyTab.classList.add('active');
  weeklyTab.classList.remove('active');
  monthlyTab.classList.remove('active');
  updatePatternOption();
}

const showWeekly = () => {
  dailyTab.classList.remove('active')
  weeklyTab.classList.add('active');
  monthlyTab.classList.remove('active');
  updatePatternOption();
}

const showMonthly = () => {
  dailyTab.classList.remove('active')
  weeklyTab.classList.remove('active');
  monthlyTab.classList.add('active');
  updatePatternOption();
}

const toggleInputs = (disableInputIDs, enableInputIDs) => {
  for (const id of disableInputIDs) {
    const elem = document.getElementById(id);
    elem.disabled = true;
  }
  for (const id of enableInputIDs) {
    const elem = document.getElementById(id);
    elem.disabled = false;
  }
}

const handleSave = async () => {
  const activeOption = document.querySelector('.active').id;
  const recurringLabel = document.getElementById('recurring-label');

  loading();
  patternHide();
  
  switch (activeOption) {
    case 'Daily':
      await getDailyPattern();
      break;
    case 'Weekly':
      await getWeeklyPattern();
      break;
    case 'Monthly':
      await getMonthlyPattern();
      break;
  
    default:
      break;
  }

  if (pattern.length > 52) {
    pattern.length = 52;
    alert('Maximum Event Limit Reached\n\nYou Have reached the maximum event limit of 52. You cannot create more than 52 events at once.')
  }

  recurringLabel.innerText = `${pattern.length} Event${pattern.length == 1 ? '': 's'}`;

  doneLoading();
  reviewShow();
}

const getDailyPattern = async () => {
  const eventDate = document.getElementById('start-date');
  const eventStartTime = document.getElementById('start-time');
  const dailyIntervalDOM = document.getElementById('days-number-option');
  const daysPatternOptionDOM = document.getElementById('days');
  const weekdaysPatternOptionDOM = document.getElementById('weekday');

  const sequence = {
    "Type": "Daily",
    "Interval": daysPatternOptionDOM.checked ? parseInt(dailyIntervalDOM.value) : null,
    "StartDate": new Date(`${eventDate.value}T${eventStartTime.value}`).toISOString(),
    "EndDate": endByDateDOM.checked ? new Date(`${byDateInputDOM.value}T${eventStartTime.value}`).toISOString() : null,
    "TotalOccurrences": endByOccurDOM.checked ? parseInt(occurrenceNumDOM.value) : null,
    "Day": 0,
    "DayPosition": "Unspecified",
    "Weekdays": weekdaysPatternOptionDOM ? "Weekday" : "None",
    "Month": "Unspecified",
  }

  pattern = await axios({
    method: 'post',
    url: '/api/mp/generate-sequence',
    data: {
      sequence: sequence
    }
  })
    .then(response => response.data);
}

const getWeeklyPattern = async () => {
  const eventDate = document.getElementById('start-date');
  const eventStartTime = document.getElementById('start-time');
  const weekPatternDOM = document.getElementById('week-pattern');
  const checkboxSunday = document.getElementById('week-pattern-sunday');
  const checkboxMonday = document.getElementById('week-pattern-monday');
  const checkboxTuesday = document.getElementById('week-pattern-tuesday');
  const checkboxWednesday = document.getElementById('week-pattern-wednesday');
  const checkboxThursday = document.getElementById('week-pattern-thursday');
  const checkboxFriday = document.getElementById('week-pattern-friday');
  const checkboxSaturday = document.getElementById('week-pattern-saturday');
  const weekdayOptions = [checkboxSunday, checkboxMonday, checkboxTuesday, checkboxWednesday, checkboxThursday, checkboxFriday, checkboxSaturday];
  const selectedDays = weekdayOptions.filter(elem => elem.checked).map(elem => elem.value);

  const sequence = {
    "Type": "Weekly",
    "Interval": parseInt(weekPatternDOM.value),
    "StartDate": new Date(`${eventDate.value}T${eventStartTime.value}`).toISOString(),
    "EndDate": endByDateDOM.checked ? new Date(`${byDateInputDOM.value}T${eventStartTime.value}`).toISOString() : null,
    "TotalOccurrences": endByOccurDOM.checked ? parseInt(occurrenceNumDOM.value) : null,
    "Day": 0,
    "DayPosition": "Unspecified",
    "Weekdays": selectedDays.join(','),
    "Month": "Unspecified",
  }

  pattern = await axios({
    method: 'post',
    url: '/api/mp/generate-sequence',
    data: {
      sequence: sequence
    }
  })
    .then(response => response.data);
}

const getMonthlyPattern = async () => {
  const eventDate = document.getElementById('start-date');
  const eventStartTime = document.getElementById('start-time');
  const dayOfMonthOption = document.getElementById('day-of-month');
    const monthDay = document.getElementById('month-day');
    const everyMonthNum = document.getElementById('every-month-num');
  const timesOfMonthOption = document.getElementById('times-of-month');
    const monthlyDayPattern = document.getElementById('monthly-day-pattern');
    const weekdayPattern = document.getElementById('weekday-pattern');
    const everyMonthNum2 = document.getElementById('every-month-num-2');

  const sequence = {
    "Type": "Monthly",
    "Interval": dayOfMonthOption.checked ? parseInt(everyMonthNum.value) : parseInt(everyMonthNum2.value),
    "StartDate": new Date(`${eventDate.value}T${eventStartTime.value}`).toISOString(),
    "EndDate": endByDateDOM.checked ? new Date(`${byDateInputDOM.value}T${eventStartTime.value}`).toISOString() : null,
    "TotalOccurrences": endByOccurDOM.checked ? parseInt(occurrenceNumDOM.value) : null,
    "Day": dayOfMonthOption.checked ? parseInt(monthDay.value) : 0,
    "DayPosition": timesOfMonthOption.checked ? monthlyDayPattern.value : 'Unspecified',
    "Weekdays": timesOfMonthOption.checked ? weekdayPattern.value : 'None',
    "Month": "Unspecified",
  }
  
  pattern = await axios({
    method: 'post',
    url: '/api/mp/generate-sequence',
    data: {
      sequence: sequence
    }
  })
    .then(response => response.data);
}