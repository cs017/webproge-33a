document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Ability to send email from compose view
  document.querySelector('form').onsubmit = function() {
    send_email();
    return false;
  };

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block'; 
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';

   // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {

    // Display emails
    emails.forEach(email => {
      const emailDiv = document.createElement('div');
      const emailSubject = document.createElement('p');
      const emailSender = document.createElement('p');
      const emailTimestamp = document.createElement('span');

      emailSubject.innerHTML = email.subject;
      emailSender.innerHTML = email.sender;
      emailTimestamp.innerHTML = email.timestamp;

      emailDiv.appendChild(emailSender);
      emailDiv.appendChild(emailSubject);
      emailDiv.appendChild(emailTimestamp);

      // Styling for displaying read emails
      if (`${email.read}` == "true") {
        emailDiv.style.backgroundColor = 'lightgray';
        emailDiv.onmouseover = function(){emailDiv.style.backgroundColor = 'lightblue'};
        emailDiv.onmouseout = function(){emailDiv.style.backgroundColor = 'lightgray'};
      }

      // Add listener for clicking on an email to mark as read
      emailDiv.addEventListener('click',function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        });
        view_email(email);
      });

      document.querySelector('#emails-view').append(emailDiv);

    })
  });
}

function view_email(email) {
  // Mark an email as read when it has been viewed
  if (`${email.read}` == "false") {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          read: true
        })
      })
  }

  // Show single email view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'block';

  // Create HTML elements for displaying email contents and features
  const emailDiv = document.createElement('div');
  const emailSubject = document.createElement('p');
  const emailSender = document.createElement('p');
  const emailRecipients = document.createElement('p');
  const emailTimestamp = document.createElement('p');
  const emailBody = document.createElement('p');
  const replyButton = document.createElement('button');

  // Clear out anything on page in the single email view
  document.querySelector('#single-email-view').innerHTML = "";

  // Making sure line breaks are displayed properly in the email body
  emailBodyWithBreaks = `${email.body}`;
  emailBodyWithBreaks = emailBodyWithBreaks.replace(/(?:\r\n|\r|\n)/g, '</br>');

  // Start adding content to the HTML elements created above
  emailSubject.innerHTML = `<p class=emailProperty>Subject: </p>${email.subject}`;
  emailSender.innerHTML = `<p class=emailProperty>From: </p>${email.sender}`;
  emailRecipients.innerHTML = `<p class=emailProperty>To: </p>${email.recipients}`;
  emailTimestamp.innerHTML = `<p class=emailProperty>Date: </p>${email.timestamp}`;
  emailBody.innerHTML = `<p class=emailProperty>Message: </p><p id="body"><br/>${emailBodyWithBreaks}</p>`;
  replyButton.innerHTML = "Reply";
  replyButton.id = "replyButton";

  // Start adding populated HTML elements to overall email element
  emailDiv.appendChild(emailSender);
  emailDiv.appendChild(emailRecipients);
  emailDiv.appendChild(emailSubject);
  emailDiv.appendChild(replyButton);

  // Compiling list of sent emails for determining whether Archive button should be displayed in this email
  const sentIds = [];
  fetch(`/emails/sent`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      sentIds.push(email.id)
    });
    console.log(sentIds)
  })

  // If email is a sent email, don't display Archive/Unarchive button
  if (sentIds.includes(email.id)) {}

  // If email is not archived, display an Archive button
  else if (`${email.archived}` == "false") {
    const archiveButton = document.createElement('button');
    archiveButton.id = "archiveButton";
    archiveButton.innerHTML = "Archive";
    emailDiv.appendChild(archiveButton);
  }

  // If email is archived, display an Unarchive button
  else if (`${email.archived}` == "true") {
    const archiveButton = document.createElement('button');
    archiveButton.id = "archiveButton";
    archiveButton.innerHTML = "Unarchive";
    emailDiv.appendChild(archiveButton);
  }

  // Add remaining populated HTML elements to email item
  emailDiv.appendChild(emailTimestamp);
  emailDiv.appendChild(emailBody);

  // Add email item to single email view
  document.querySelector('#single-email-view').append(emailDiv);

  // Functionality for Reply button
  document.querySelector('#replyButton').onclick = function() {
    compose_email();
    // Determine what automatic subject should be for a replied email
    let subject = `${email.subject}`;
    if (subject.startsWith(`Re: `)) {}
    else {
      subject = `Re: ${email.subject}`;
    }

    const replyBody = `${email.body}`;

    // Add presets for composition fields
    document.querySelector('#compose-recipients').value = `${email.sender}`;
    document.querySelector('#compose-subject').value = subject;
    document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${replyBody}`;

  };

  // Add functionality for Archive / Unarchive button
  if (`${email.archived}` == "false") {
    document.querySelector('#archiveButton').onclick = function() {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        })
      })
      .then(result => {
          console.log(result);
          load_mailbox('inbox')
      });
    }
  }

  else if (`${email.archived}` == "true") {
    document.querySelector('#archiveButton').onclick = function() {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      })
      .then(result => {
        console.log(result);
        load_mailbox('inbox')
    });
    }
  }
}

// Functionality for sending an email from the compose/reply view
function send_email() {
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
    load_mailbox('sent');
  });
}