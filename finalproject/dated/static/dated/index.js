document.addEventListener('DOMContentLoaded', function() {
    // By default, load this user's calendar view
    my_calendar_view();

    // Ability to create event from calendar view
    document.querySelector('#create-form').onsubmit = function() {
        submit_event();
        return false;
    };

    document.querySelector('#nav-username').addEventListener('click', my_calendar_view);
    document.querySelector('.navbar-brand').addEventListener('click', my_calendar_view);
    document.querySelector('#cal-return-header').addEventListener('click', my_calendar_view);


    // Ability to visit other user calendars from calendar view
    document.querySelector('#month-selector-form').onsubmit = function() {
        let monthYear = document.querySelector('#select-month').value;
        monthYearString = monthYear.toString()
        selectMonth = monthYearString.substring(5);
        intMonth = parseInt(selectMonth)
        intMonth = intMonth-1;
        selectYear = monthYearString.substring(0,4);
        intYear = parseInt(selectYear)

        // Need to find out whose calendar we're currently viewing so we can go to their view of a selected month
        calUser = document.querySelector('#calendar-name-header').innerHTML
        event.preventDefault();
        view_calendar(intMonth, intYear, calUser);
    };
})

function my_calendar_view() {
    let today = new Date();
    thisMonth = today.getMonth();
    thisYear = today.getFullYear();
    fetch(`user/current`)
    .then(response => response.json())
    .then(current => {
        calUser = current.username;
        view_calendar(thisMonth, thisYear, calUser);
    });  
}

function view_calendar(month, year, calUser) {
    // Show calendar layout view and hide other views
    document.querySelector('#calendar-layout-view').style.display = 'block';
    document.querySelector('#create-form').style.display = 'none';
    document.querySelector('#edit-form').style.display = 'none';
    document.querySelector('#month-selector-form').style.display = 'block';

    document.querySelector('#add-event-header').onclick = function(){
        if (document.querySelector('#create-form').style.display == 'block') {
            document.querySelector('#create-form').style.display = 'none'
        }
        else if (document.querySelector('#create-form').style.display == 'none') {
            document.querySelector('#create-form').style.display = 'block'
        }
    };

    document.querySelector('#cancel-create').onclick = function(){
        document.querySelector('#create-form').style.display = 'none';
    };

    document.querySelector('#calendar-name-header').innerHTML = `${calUser}`

    fetch(`user/current`)
    .then(response => response.json())
    .then(current => {
        currentUser = current.username;
        if (currentUser == calUser) {
            document.querySelector('#cal-return-header').style.display = 'none';
        }
        else {
            document.querySelector('#cal-return-header').style.display = 'inline';
        }
    });

    // Clear out what was in there previously
    document.querySelector('#calendar-grid').innerHTML = '';

    const calGrid = document.createElement('div') 
    const thisMonth = month
    const thisYear = year
    
    // Grab proper number of days in a particular month/year
    const monthLastDay = new Date(thisYear, thisMonth+1, 0)
    const thisMonthName = get_month_name(thisMonth)
    // Determine what day of the week month begins
    let monthStart = new Date(thisYear, thisMonth, 1)
    monthStart = monthStart.getDay()
    let monthDays = monthLastDay.getDate()

    // Determine # of rows needed for grid
    const numRows = Math.ceil(monthDays/7)

    // Create calendar using a div for each day

    let dayNum = 1
    let weekDay = monthStart
    let thisRow = 0
    let i = 0;

    // Create spacers so day #1 can be placed in appropriate position
    while (i < monthStart) {
        const spacerDayDiv = document.createElement('div');
        spacerDayDiv.className = "spacerDayClass";
        calGrid.append(spacerDayDiv);
        i++;
    }
    
    // Start creating divs for days of this month
    while (thisRow <= numRows) {
        if (weekDay = 7) {
            // If at end of a week (Saturday), start a new week
            weekDay = 0;
        }
        // Only create days while there are still days of the week left
        while (weekDay < 7) {
            if (dayNum > monthDays) {
                break
            }
            // Create a div for each day in that week
            const dayDiv = document.createElement('div');
            dayDiv.className = "dayClass";
            const dayHeader = document.createElement('h6')
            dayHeader.className = "dayHeaderClass"
            dayHeader.innerHTML = dayNum;
            dayDiv.append(dayHeader)

            dayNumString = dayNum.toString()
            if (dayNumString.length == 1) {
                dayNumString = `0${dayNumString}`
            }
            dayDiv.dataset.id = dayNumString;

            calGrid.append(dayDiv);
            dayNum++;
            weekDay++;
        }  
        thisRow++;
    } 
    // End of calendar grid creation

    // Populate calendar grid with events
    let pyMonth = thisMonth + 1
    pyMonth = pyMonth.toString()
    if (pyMonth.length == 1) {
        pyMonth = `0${pyMonth}`
    }
    let monthyear = `${thisYear}-${pyMonth}`

    fetch(`/events/${monthyear}/${calUser}`)
    .then(response => response.json())
    .then(events => {
        console.log(events);
        if (events && events.length) {
            // Display events
            events.forEach(event => {
                console.log(event);
                const eventDiv = document.createElement('div');
                eventDiv.className = "eventClass";
                const eventStart = document.createElement('span');
                const eventEnd = document.createElement('span');
                const eventTitle = document.createElement('p');
                const formattedStartTime = convert_to_twelve_hour(event.start_time)
                const formattedEndTime = convert_to_twelve_hour(event.end_time)
                const eventTiming = document.createElement('p');

                // If event goes over multiple days, display dates - else just display start/end times
                if (event.start_day != event.end_day) {
                    eventStart.innerHTML = `(${event.start_day}) ${formattedStartTime}`;
                    eventEnd.innerHTML = `(${event.end_day}) ${formattedEndTime}`;
                }
                else {
                    eventStart.innerHTML = formattedStartTime;
                    eventEnd.innerHTML = formattedEndTime;
                }

                eventTitle.innerHTML = event.title;
                eventTitle.className = "eventInfoClass";

                let eventFullStartDay = event.start_day;
                let eventStartDay = eventFullStartDay.slice(-2);

                eventTiming.innerHTML = (`${eventStart.innerHTML}-${eventEnd.innerHTML}:`)
                eventTiming.className = "eventInfoClass";

                eventDiv.appendChild(eventTiming);
                eventDiv.appendChild(eventTitle);

                // Creating elements for detailed view of event
                const eventDetailsDiv = document.createElement('div');
                eventDetailsDiv.className = "eventDetailsClass";
                eventDetailsDiv.dataset.id = event.id;

                const detailsStart = document.createElement('p');
                const detailsEnd = document.createElement('p');
                const detailsTitle = document.createElement('p');
                const detailsDescription = document.createElement('p');
                const detailsInviteesHeader = document.createElement('span');
                const detailsInvitees = document.createElement('ul');
                const detailsHostHeader = document.createElement('span');
                const detailsHost = document.createElement('span');
                const detailsClose = document.createElement('input');
                const detailsButtonsWrapper = document.createElement('div');

                detailsClose.type = "button";
                detailsClose.value = "Close";

                detailsInvitees.className = "detailsInviteesClass";
                detailsHost.className = "detailsHostClass";
                detailsClose.className = "detailsButtons";
                detailsButtonsWrapper.className = "detailsButtonsWrapper";

                detailsStart.innerHTML = `Start: ${event.start_day} at ${formattedStartTime}`;
                detailsEnd.innerHTML = `End: ${event.end_day} at ${formattedEndTime}`;
                detailsTitle.innerHTML = `Title: ${event.title}`;
                detailsDescription.innerHTML = `Description: ${event.description}`;
                detailsInviteesHeader.innerHTML = `Invitees: `;
                detailsHostHeader.innerHTML = `Host: `;

                inviteeList = event.invitees
                inviteeList.forEach(invitee => {
                    const inviteeItem = document.createElement('li');
                    inviteeItem.innerHTML = invitee;
                    inviteeItem.className = "userItem";
                    // When user clicks on an event invitee, go to that invitee's calendar
                    inviteeItem.addEventListener('click',function() {
                        view_calendar(month, year, invitee);
                    });
                    inviteeItem.style.cursor = 'pointer';
                    inviteeItem.hover
                    detailsInvitees.append(inviteeItem);
                });
                

                detailsHost.innerHTML = event.host;
                detailsHost.className = "userItem";
                detailsHost.style.cursor = 'pointer';

                detailsButtonsWrapper.appendChild(detailsClose);

                eventDetailsDiv.appendChild(detailsTitle);
                eventDetailsDiv.appendChild(detailsStart);
                eventDetailsDiv.appendChild(detailsEnd);
                eventDetailsDiv.appendChild(detailsDescription);
                eventDetailsDiv.appendChild(detailsInviteesHeader);
                eventDetailsDiv.appendChild(detailsInvitees);
                eventDetailsDiv.appendChild(detailsHostHeader);
                eventDetailsDiv.appendChild(detailsHost);

                eventDetailsDiv.style.display = 'none';

                // When user clicks on an event div, open up detailed view
                eventDiv.addEventListener('click',function() {
                    eventDiv.style.display = 'none';
                    eventDetailsDiv.style.display = 'block';
                })
                // Adding a "close" option so user can exit out of detailed view
                detailsClose.addEventListener('click',function() {
                    eventDiv.style.display = 'block';
                    eventDetailsDiv.style.display = 'none';
                })

                // When user clicks on an event host, go to that host's calendar
                detailsHost.addEventListener('click',function() {
                    view_calendar(month, year, event.host);
                });

                // Adding edit functionality
                fetch(`user/current`)
                .then(response => response.json())
                .then(current => {
                    // Include edit button if current user's event
                    if (current.username == event.host) {
                        const editButton = document.createElement('button');
                        editButton.className = "detailsButtons";
                        editButton.innerHTML = "Edit"
                        detailsButtonsWrapper.appendChild(editButton);
                        editButton.addEventListener('click',function() {
                            document.querySelector('#edit-form').style.display = 'block';
                            document.querySelector('#calendar-layout-view').style.display = 'none';
                            document.querySelector('#month-selector-form').style.display = 'none';

                            // Populate edit form with details from this event
                            document.querySelector('#edit-invitees').value = event.invitees;
                            document.querySelector('#edit-start-day').value = event.start_day;
                            document.querySelector('#edit-start-time').value = event.start_time;
                            document.querySelector('#edit-end-day').value = event.end_day;
                            document.querySelector('#edit-end-time').value = event.end_time;
                            document.querySelector('#edit-title').value = event.title;
                            document.querySelector('#edit-description').value = event.description;

                            // Add cancel button
                            document.querySelector('#cancel-edit').addEventListener('click',function() {
                                document.querySelector('#edit-form').style.display = 'none';
                                document.querySelector('#calendar-layout-view').style.display = 'block';
                                document.querySelector('#month-selector-form').style.display = 'block';
                                eventDetailsDiv.style.display = 'none';
                                eventDiv.style.display = 'block';
                            })
                            
                            // Add save button
                            document.querySelector('#submit-edit').addEventListener('click',function() {
                                newInvitees = document.querySelector('#edit-invitees').value
                                newStartDay =  document.querySelector('#edit-start-day').value
                                newStartTime = document.querySelector('#edit-start-time').value
                                newEndDay = document.querySelector('#edit-end-day').value
                                newEndTime = document.querySelector('#edit-end-time').value
                                newTitle = document.querySelector('#edit-title').value
                                newDescription = document.querySelector('#edit-description').value
                                edit_event(eventDetailsDiv.dataset.id, newInvitees, newStartDay, newStartTime, newEndDay, newEndTime, newTitle, newDescription);
                                return false;
                            })
                        })
                    } 
                })
                eventDetailsDiv.appendChild(detailsButtonsWrapper);
                document.querySelector(`[data-id="${eventStartDay}"]`).append(eventDiv);
                document.querySelector(`[data-id="${eventStartDay}"]`).append(eventDetailsDiv);
            })
        }
    });
 
    document.querySelector('#month-heading').innerHTML = `${thisMonthName} ${thisYear}`
    document.querySelector('#calendar-grid').append(calGrid)

    // Adding a visual identifier to today's date
    let today = new Date();
    todayMonth = today.getMonth();
    todayYear = today.getFullYear();
    todayDay = today.getDate();

    let pyTodayMonth = todayMonth + 1
    pyTodayMonth = pyTodayMonth.toString()
    if (pyTodayMonth.length == 1) {
        pyTodayMonth = `0${pyTodayMonth}`
    }

    let todayMonthyear = `${todayYear}-${pyTodayMonth}`

    if (todayMonthyear == monthyear) {
        todayDayString = todayDay.toString()
        if (todayDayString.length == 1) {
            todayDayString = `0${todayDayString}`
        }
        document.querySelector(`[data-id="${todayDayString}"]`).style.borderColor = '#598392';
        document.querySelector(`[data-id="${todayDayString}"]`).style.borderStyle = 'solid';
        document.querySelector(`[data-id="${todayDayString}"]`).style.borderWidth = '2px';
        document.querySelector(`[data-id="${todayDayString}"]`).style.backgroundColor = '#9FBFCB';
    }
}

function get_month_name(month_number) {
    if (month_number == 0) {return "January"}
    else if (month_number == 1) {return "February"}
    else if (month_number == 2) {return "March"}
    else if (month_number == 3) {return "April"}
    else if (month_number == 4) {return "May"}
    else if (month_number == 5) {return "June"}
    else if (month_number == 6) {return "July"}
    else if (month_number == 7) {return "August"}
    else if (month_number == 8) {return "September"}
    else if (month_number == 9) {return "October"}
    else if (month_number == 10) {return "November"}
    else if (month_number == 11) {return "December"}
}

function submit_event() {
    // First confirm that requested start day/time comes before end day/time
    const inputStartDay = new Date(document.querySelector('#create-start-day').value)
    const inputEndDay = new Date(document.querySelector('#create-end-day').value)

    let inputStartTime = (document.querySelector('#create-start-time').value)
    inputStartTime = inputStartTime.replace(':', ''); 

    let inputEndTime = (document.querySelector('#create-end-time').value)
    inputEndTime = inputEndTime.replace(':', '');
 
    // If start day is later than end day, throw error
    if (inputStartDay > inputEndDay) {
        alert("We can't create this event! Your start day is later than your end day.");
    }    
    else {
        // If start day is equal to end day and start time is later than or equal to end time, throw error
        if (inputStartDay.getTime() === inputEndDay.getTime() && inputStartTime >= inputEndTime) {
            alert("We can't create this event! Your end time needs to be later than your start time.");
        }
        else {
            // Create event
            // Set up CSRF token
            token = getCookie('csrftoken');
            fetch('/create', {
                headers: {
                    'X-CSRFToken': token
                },
                method: 'POST',
                body: JSON.stringify({
                    invitees: document.querySelector('#create-invitees').value,
                    start_day: document.querySelector('#create-start-day').value,
                    start_time: document.querySelector('#create-start-time').value,
                    end_day: document.querySelector('#create-end-day').value,
                    end_time: document.querySelector('#create-end-time').value,
                    title: document.querySelector('#create-title').value,
                    description: document.querySelector('#create-description').value,
                })
            })
            .then(response => response.json())
            .then(result => {
                // Print result
                console.log(result);
                monthYearString = document.querySelector('#create-start-day').value.substring(0,7);
                eventMonth = monthYearString.substring(5);
                intMonth = parseInt(eventMonth)
                intMonth = intMonth-1;
                eventYear = monthYearString.substring(0,4);
                intYear = parseInt(eventYear)
                fetch(`user/current`)
                .then(response => response.json())
                .then(current => {
                    calUser = current.username;
                    view_calendar(intMonth, intYear, calUser);
                });
            });
            event.preventDefault();
        }
    }
}

function edit_event(eventid, newInvitees, newStartDay, newStartTime, newEndDay, newEndTime, newTitle, newDescription) {
    // First confirm that requested start day/time comes before end day/time
    const inputStartDay = new Date(newStartDay)
    const inputEndDay = new Date(newEndDay)

    let inputStartTime = newStartTime
    inputStartTime = inputStartTime.replace(':', ''); 
    let inputEndTime = newEndTime
    inputEndTime = inputEndTime.replace(':', '');
 
    // If start day is later than end day, throw error
    if (inputStartDay > inputEndDay) {
        alert("We can't create this event! Your start day is later than your end day.");
        event.preventDefault();
    }    
    else {
        // If start day is equal to end day and start time is later than or equal to end time, throw error
        if (inputStartDay.getTime() === inputEndDay.getTime() && inputStartTime >= inputEndTime) {
            alert("We can't create this event! Your end time needs to be later than your start time.");
            event.preventDefault();
        }
        else {
            // Set up CSRF token
            token = getCookie('csrftoken');
            fetch(`/event/${eventid}`, {
                headers: {
                    'X-CSRFToken': token
                },
                method: 'PUT',
                body: JSON.stringify({
                    invitees: newInvitees,
                    start_day: newStartDay,
                    start_time: newStartTime,
                    end_day: newEndDay,
                    end_time: newEndTime,
                    title: newTitle,
                    description: newDescription
                })
            })
            .then(result => {
                console.log(result);
                monthYearString = newStartDay.substring(0,7);
                eventMonth = monthYearString.substring(5);
                intMonth = parseInt(eventMonth)
                intMonth = intMonth-1;
                eventYear = monthYearString.substring(0,4);
                intYear = parseInt(eventYear)
                fetch(`user/current`)
                .then(response => response.json())
                .then(current => {
                    calUser = current.username;
                    view_calendar(intMonth, intYear, calUser);
                });
            });
            event.preventDefault();
        }
    }
}

// This function comes from Django documentation - https://docs.djangoproject.com/en/3.0/ref/csrf/
// Used to get CSRF token
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function convert_to_twelve_hour(timeElement) {
    if (timeElement.startsWith("00:")) {newHour = "00", newEnd = "AM"}
    else if (timeElement.startsWith("01:")) {newHour = "1", newEnd = "AM"}
    else if (timeElement.startsWith("02:")) {newHour = "2", newEnd = "AM"}
    else if (timeElement.startsWith("03:")) {newHour = "3", newEnd = "AM"}
    else if (timeElement.startsWith("04:")) {newHour = "4", newEnd = "AM"}
    else if (timeElement.startsWith("05:")) {newHour = "5", newEnd = "AM"}
    else if (timeElement.startsWith("06:")) {newHour = "6", newEnd = "AM"}
    else if (timeElement.startsWith("07:")) {newHour = "7", newEnd = "AM"}
    else if (timeElement.startsWith("08:")) {newHour = "8", newEnd = "AM"}
    else if (timeElement.startsWith("09:")) {newHour = "9", newEnd = "AM"}
    else if (timeElement.startsWith("10:")) {newHour = "10", newEnd = "AM"}
    else if (timeElement.startsWith("11:")) {newHour = "11", newEnd = "AM"}
    else if (timeElement.startsWith("12:")) {newHour = "12", newEnd = "PM"}
    else if (timeElement.startsWith("13:")) {newHour = "1", newEnd = "PM"}
    else if (timeElement.startsWith("14:")) {newHour = "2", newEnd = "PM"}
    else if (timeElement.startsWith("15:")) {newHour = "3", newEnd = "PM"}
    else if (timeElement.startsWith("16:")) {newHour = "4", newEnd = "PM"}
    else if (timeElement.startsWith("17:")) {newHour = "5", newEnd = "PM"}
    else if (timeElement.startsWith("18:")) {newHour = "6", newEnd = "PM"}
    else if (timeElement.startsWith("19:")) {newHour = "7", newEnd = "PM"}
    else if (timeElement.startsWith("20:")) {newHour = "8", newEnd = "PM"}
    else if (timeElement.startsWith("21:")) {newHour = "9", newEnd = "PM"}
    else if (timeElement.startsWith("22:")) {newHour = "10", newEnd = "PM"}
    else if (timeElement.startsWith("23:")) {newHour = "11", newEnd = "PM"}
    else if (timeElement.startsWith("24:")) {newHour = "12", newEnd = "AM"}
    timeElement = timeElement.substring(2)
    newTime = newHour + timeElement + " " + newEnd
    return newTime;
}