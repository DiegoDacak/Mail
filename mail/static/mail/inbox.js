var x = 0;

document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#archive').addEventListener('click', archive_email);
  document.querySelector('#reply').addEventListener('click', reply_email);

  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector('form').onsubmit = send_email;

});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#show-content').style.display = 'none';
  document.querySelector ('#danger-alert').style.display = 'none';
  document.querySelector('#success-alert').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  x = 0;

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#show-content').style.display = 'none';
  document.querySelector ('#danger-alert').style.display = 'none';
  document.querySelector('#success-alert').style.display = 'none';

  //Mostramos el error si hay
  var send = localStorage.getItem('send');
  if (send) {
    document.querySelector('#success-alert').style.display = 'block';
  }

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //Mostramos los email
  show_email (mailbox);

  //Limpiamos el local storage
  localStorage.clear()
  
}

//Enviar email
function send_email() {
  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipient,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    if(result.error != undefined) {
      //Mostramos mensaje de error si no existe el usuario
      document.querySelector('#danger-alert').innerHTML = result.error;
      document.querySelector('#danger-alert').style.display = 'block';
    }
    else {
      //Si existe el usuario cargamos el mailbox
      document.querySelector('#danger-alert').style.display = 'none';
      document.querySelector('#success-alert').innerHTML = result.message;
      document.querySelector('#success-alert').style.display = 'block';
      localStorage.setItem('send', true);
      load_mailbox('sent');
    }
  });
  return false;
}

//Titulo para la tabla show_email
function table_title () {
  const th = [];

  //Obtenemos el elemento div
  const div = document.querySelector('#emails-view');
  
  //Creamos el tag de la tabla
  const table = document.createElement('table');
  table.classList.add("table");
  div.appendChild(table);

  //Creamos el tag del encabezado
  const thead = document.createElement('thead');
  thead.classList.add("thead-dark");
  table.appendChild(thead);

  //Creamos el tag tr
  const tr = document.createElement('tr');
  thead.appendChild(tr)

  //Creamos diferentes tag th para los titulos
  for (var i = 0; i < 3; i++) {
    th[i] = document.createElement('th');
  }
  th[0].innerHTML = "From";
  th[1].innerHTML = "Subject";
  th[2].innerHTML = "Timestamp";

  //Agregamos los titulos
  for (var i = 0; i < 3; i++) {
    tr.appendChild(th[i])
  } 
}

//Mostramos los emails enviados, recibidos o archivados
function show_email (mailbox) {
  //Si es son emails enviados
  if (mailbox == 'sent') {
    x = 1;
  }
  table_title();
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {     
      emails.forEach(email => {
        //Obtenemos el elemento div
        const table = document.querySelector('.table');
        //Creamos el cuerpo de los emails
        const tbody = document.createElement('tbody');
        tbody.id =`email_${email.id}`;
        tbody.classList.add('email');
        //Vemos si ya fue leido
        if (email.read == true) {
          tbody.classList.add('leido');
        }
        tbody.setAttribute('onclick', `show_content(${email.id})`);
        table.appendChild(tbody);

        //Elemento tr
        const tr = document.createElement('tr');
        tbody.appendChild(tr);

        //Creamos los elementos titulos del email
        const td = [];
        for (var i = 0; i < 3; i++) {
          td[i] = document.createElement('td');
        }        
        td[0].innerHTML = email.sender;
        td[1].innerHTML = email.subject;
        td[2].innerHTML = email.timestamp;

        //Agregamos los emails
        for (var i = 0; i < 3; i++) {
          tr.appendChild(td[i]);
        }
      });
  });
}

//Mostramos el contenido de algun email especifico
function show_content(id) {
  if (x === 1) {
    document.querySelector('#archive').classList.add('hidden');
  }
  else {
    document.querySelector('#archive').classList.remove('hidden');
  }
  //Show de email content, hide others views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#show-content').style.display = 'block';
  document.querySelector ('#danger-alert').style.display = 'none';
  document.querySelector('#success-alert').style.display = 'none';
  //Marcamos como leido
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
  //Mostramos el email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    //Guardamos el id en local storage
    localStorage.setItem('id', email.id);
    var title = [];
    title[0] = "From";
    title[1] = "To";
    title[2] = "Subject";
    title[3] = "Timestamp";
    var aux = [];
    aux[0] = "sender";
    aux[1] = "recipients";
    aux[2] = "subject";
    aux[3] = "timestamp";
    //Mostramos los titulos
    for (var i = 0; i < 4; i++) {
      const item = document.querySelector(`#${title[i]}`);
      item.innerHTML = `${title[i]}: ${email[aux[i]]}`;
    }  
    //Mostramos el contenido
    const content = document.querySelector("#content");
    email.body = email.body.replace(/\r?\n/g, '<br />');
    content.innerHTML = email.body;
    
    //Vemos si esta o no archivado
    if (email.archived == true) {
      document.querySelector('#archive').innerHTML = "Unarchive";
    }
    else {
      document.querySelector('#archive').innerHTML = "Archive";
    }
  });
}

//Archivamos el email
function archive_email() {
  var id = localStorage.getItem('id');
  var archive;
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    //Vemos si el email esta archivo
    if (email.archived == false) {
      archive = false;
      document.querySelector('#archive').innerHTML = "Unarchive";
    }
    else {
      archive = true;
      document.querySelector('#archive').innerHTML = "Archive";
    }
    //Si no esta archivado lo archivamos
    if (archive == false) {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: true
        }),
      })
      .then(email => {
        load_mailbox('inbox')
      })
    }
    //Si esta archivo lo desarchivamos
    else {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          archived: false
        })
      })
      .then(email => {
        load_mailbox('inbox')
      })
    }
  });
}

//Responder email
function reply_email() {
  var id = localStorage.getItem('id');
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#show-content').style.display = 'none';
    document.querySelector ('#danger-alert').style.display = 'none';
    document.querySelector('#success-alert').style.display = 'none';
    document.querySelector('#compose-recipients').value = email.sender;
    var aux = email.subject.search('Re:')
    if (aux == -1) {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
    else {
      document.querySelector('#compose-subject').value = email.subject;
    }
    document.querySelector('#compose-body').value = `\nOn ${email.timestamp} ${email.sender} wrote:\n${email.body}`
  });
}