# Dated (Final Project app submission for CSCI E-33a)

## Purpose

The Dated app functions as a calendar and scheduler, letting users add events to their own calendars as well as invite other users to events.

## Description

Users are first presented with the option to register a new account or log into one they'd previously created. After logging in, a user will by default see their own calendar grid for the current month, populated with any events already associated with their account. Users can navigate to different months and years using the "Go to month" selector at the top of the page.

To create a new event, click the "Add An Event" button. A new event must have a specified start date and time, end date and time, invitees (usernames separated by commas), title, and (optionally) description. The form will check for general lack of logic (ie., the start datetime is after the end datetime). Upon submitting the new event, the user will be taken to the month grid of that event's start date to confirm that the event was successfully added. Events that carry over multiple days will display the start and end date, while all other events will just show start and end time.

Clicking on any event will show the event's details, including invitees and host. Clicking on any invitee or the host will bring the user to that other user's calendar, and from there the user can navigate to new months within the other user's calendar. While viewing another user's calendar, there is always a "Back to My Calendar" option available near the top of the page for a quick return.

From the event details view (shown after clicking on an event), only the host of an event can edit its details by clicking the "edit" button. Similar logic from the "Add An Event" form follows for this form, depositing the user into the relevant start month after they click "Save".


## Files

   
    - static
        - index.js: contains JavaScript functions for displaying 
        - styles.css: contains styling for all areas of application
    - templates
        - index.html: additional page structure for main app and calendar pages
        - layout.html: general page layout for index, login, and register pages
        - login.html: additional page structure for user login process
        - register.html: additional page structure for account register process 
    - __init__.py
    - admin.py: allows Django admin access for User and Event objects
    - apps.py: lists dated app in project
    - models.py: contains Python models for User and Event
    - tests.py
    - urls.py: lists URLs, patterns, and API URLs for app
    - views.py: functions for APIs and Django/db access

## Future Plans

Timezone support, ability to "accept" or "decline" invitations to events, user control of calendar viewing permissions.
