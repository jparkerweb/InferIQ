let editingId = null; // This will hold the ID of the message being edited
let currentPage = 1; // This will hold the current page number

function setFeedback(message) {
    const feedback = document.getElementById('feedback');
    feedback.innerHTML = message;
    setTimeout(() => {
        feedback.innerHTML = '';
    }, 5000);
}

document.getElementById('feedback').addEventListener('click', function(event) {
    const feedback = document.getElementById('feedback');
    feedback.innerHTML = '';
});

document.getElementById('messageForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    const groundedTruthSummaryInput = document.getElementById('groundedTruthSummaryInput');
    const groundedTruthSummary = groundedTruthSummaryInput.value.trim();
    const feedback = document.getElementById('feedback');
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/admin/messages/${editingId}` : '/admin/messages';

    if (message === '') {
        setFeedback('Message cannot be empty');
        return;
    }

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, groundedTruthSummary })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        messageInput.value = '';
        feedback.innerHTML = '';
        setFeedback(data.feedback || 'Message added successfully');
        loadMessages();
        cancelEdit();
    })
    .catch(error => console.error('Error:', error));
});

function editMessage(id, message, groundedTruthSummary) {
    editingId = id;
    const messageInput = document.getElementById('messageInput');
    const groundedTruthSummaryInput = document.getElementById('groundedTruthSummaryInput');
    const messageFormButton = document.getElementById('messageFormButton');
    messageInput.value = message;
    groundedTruthSummaryInput.value = groundedTruthSummary;
    messageFormButton.textContent = 'Save Changes';
    document.getElementById('cancelEditButton').style.display = 'inline';
}

function cancelEdit() {
    editingId = null;
    const messageInput = document.getElementById('messageInput');
    const groundedTruthSummaryInput = document.getElementById('groundedTruthSummaryInput');
    const messageFormButton = document.getElementById('messageFormButton');
    messageInput.value = '';
    groundedTruthSummaryInput.value = '';
    messageFormButton.textContent = 'Add Message';
    document.getElementById('cancelEditButton').style.display = 'none';
}

function showFull(fullElmId, targetElmId) {
    const fullElm = document.getElementById(fullElmId);
    const targetElm = document.getElementById(targetElmId);
    targetElm.innerHTML = fullElm.innerHTML;
    targetElm.classList.add('full--displayed');
}

function loadMessages(page) {
    currentPage = page;
    fetch(`/admin/messages?page=${page}`)
    .then(response => response.json())
    .then(data => {
        const messages = data.messages;
        const total = data.total;
        const totalPages = Math.ceil(total / 10); // Assuming 10 messages per page

        const messagesList = document.getElementById('messagesList');
        messagesList.innerHTML = '';

        // Loop through each message and append it to the list
        messages.forEach(message => {
            const listItem = document.createElement('li');
            
            const textCutoff = 77;
            let showFullMessageLink = '';
            if (message.message.length > textCutoff) {
                showFullMessageLink = `<a href="#" onclick="showFull('fullMessage${message.id}', 'message${message.id}')">◀______________________▶</a>`;
            }
            let showFullGroundedTruthSummaryLink = '';
            if (message.groundedTruthSummary.length > textCutoff) {
                showFullGroundedTruthSummaryLink = `<a href="#" onclick="showFull('fullGroundedTruthSummary${message.id}', 'groundedTruthSummary${message.id}')">◀______________________▶</a>`;
            }

            let innerHTML = `
                <div id="fullMessage${message.id}" style="display:none !important;">${message.message}</div>
                <div id="fullGroundedTruthSummary${message.id}" style="display:none !important;">${message.groundedTruthSummary}</div>
                <div class="accent">message</div>
                <div id="message${message.id}">
                    ${message.message.substring(0, textCutoff)}
                    ${showFullMessageLink}
                    ${message.message.substring(message.message.length - textCutoff)}
                </div>
            `;

            if (message.groundedTruthSummary) {
                innerHTML += `
                    <div class="accent margin-top-15">grounded truth summary</div>
                    <div id="groundedTruthSummary${message.id}">
                        ${message.groundedTruthSummary.substring(0, textCutoff)}
                        ${showFullGroundedTruthSummaryLink}
                        ${message.groundedTruthSummary.substring(message.message.length - textCutoff)}
                    </div>
                `;
            }

            listItem.innerHTML = innerHTML;
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete');
            deleteButton.classList.add('small');
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteMessage(message.id);  // Attach the delete function

            // Add an edit button
            const editButton = document.createElement('button');
            editButton.classList.add('edit');
            editButton.classList.add('small');
            editButton.textContent = 'Edit';
            editButton.onclick = () => editMessage(message.id, message.message, message.groundedTruthSummary);  // Attach the edit function

            listItem.prepend(document.createElement('br'));
            listItem.prepend(editButton);
            listItem.prepend(deleteButton);
            messagesList.appendChild(listItem);
        });

        // Enable/Disable Previous button
        document.querySelector('#prevButton').disabled = currentPage <= 1;
        // Enable/Disable Next button
        document.querySelector('#nextButton').disabled = currentPage >= totalPages;
    })
    .catch(error => console.error('Error:', error));
}
    

function deleteMessage(id) {
    fetch(`/admin/messages/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        loadMessages();  // Reload the messages after deletion
    })
    .catch(error => console.error('Error:', error));
}


// Initial load of messages
loadMessages(currentPage);