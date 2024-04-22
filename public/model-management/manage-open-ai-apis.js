import { escapeHtml } from "/utils.js";
let editingOpenaiAPIId = null; // Track the editing ID

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

document.getElementById('openaiAPIForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const openaiAPINameInput = document.getElementById('openaiAPIName');
    let   openaiAPIName = openaiAPINameInput.value;

    const openaiAPIUrlInput = document.getElementById('openaiAPIUrl');
    let   openaiAPIUrl = openaiAPIUrlInput.value;

    const openaiAPIAPIKeyInput = document.getElementById('openaiAPIAPIKey');
    let   openaiAPIAPIKey = openaiAPIAPIKeyInput.value;
    
    const method = editingOpenaiAPIId ? 'PUT' : 'POST';
    const url = editingOpenaiAPIId ? `/admin/openaiAPIs/${editingOpenaiAPIId}` : '/admin/openaiAPIs';
    const feedback = document.getElementById('feedback');

    // trim fileds
    openaiAPIName = openaiAPIName.trim();
    openaiAPIUrl = openaiAPIUrl.trim();
    openaiAPIAPIKey = openaiAPIAPIKey.trim();

    if(!openaiAPIName || !openaiAPIUrl || !openaiAPIAPIKey) {
        setFeedback('All fields are required');
        return;
    }

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openaiAPIName, openaiAPIUrl, openaiAPIAPIKey })
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) { throw new Error(data.error); }

        console.log(data);
        openaiAPINameInput.value = '';
        openaiAPIUrlInput.value = '';
        openaiAPIAPIKeyInput.value = '';
        feedback.innerHTML = '';
        editingOpenaiAPIId = null;
        document.getElementById('openaiAPIFormButton').textContent = 'Add OpenAI API';
        document.getElementById('cancelEditButton').style.display = 'none';
        loadOpenaiAPIs();
        cancelEditOpenaiAPI();
        setFeedback(data.feedback);
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
    })
});

document.getElementById('cancelEditButton').addEventListener('click', function(event) {
    cancelEditOpenaiAPI();
});

function editOpenaiAPI(id, openaiAPIName, openaiAPIUrl, openaiAPIAPIKey) {
    editingOpenaiAPIId = id;
    document.getElementById('openaiAPIName').value = openaiAPIName;
    document.getElementById('openaiAPIUrl').value = openaiAPIUrl;
    document.getElementById('openaiAPIAPIKey').value = openaiAPIAPIKey;
    document.getElementById('openaiAPIFormButton').textContent = 'Save Changes';
    document.getElementById('cancelEditButton').style.display = 'inline';
}

function cancelEditOpenaiAPI() {
    editingOpenaiAPIId = null;
    document.getElementById('openaiAPIName').value = '';
    document.getElementById('openaiAPIUrl').value = '';
    document.getElementById('openaiAPIAPIKey').value = '';
    document.getElementById('openaiAPIFormButton').textContent = 'Add OpenAI API';
    document.getElementById('cancelEditButton').style.display = 'none';
}

function deleteOpenaiAPI(id) {
    fetch(`/admin/openaiAPIs/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) { throw new Error(data.error); }
        loadOpenaiAPIs();
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
    })
}

function loadOpenaiAPIs() {
    fetch('/admin/openaiAPIs')
    .then(response => response.json())
    .then(openaiAPIs => {
        const openaiAPIsList = document.getElementById('openaiAPIsList');
        // Clear existing OpenAI APIs
        openaiAPIsList.innerHTML = '';

        // Loop through each OpenAI API and append it to the list
        openaiAPIs.forEach(openaiAPI => {
            const listItem = document.createElement('li');
            const id = openaiAPI.id;
            const name = openaiAPI.name || '';
            const url = openaiAPI.url || '';
            const apiKey = openaiAPI.apiKey || '';

            listItem.innerHTML = `
                <div class="flex-row-left">
                    <button type="button" class="delete-button delete small" data-id="${id}">Delete</button>
                    <button type="button" class="edit-button edit small" data-id="${id}" data-name="${escapeHtml(name)}" data-url="${escapeHtml(url)}" data-apikey="${escapeHtml(apiKey)}">Edit</button>
                </div>
                <div class="flex-row-left">
                    <span class="accent2-block width-120 margin-right-10">name</span>
                    <div class="word-break-break-word">${escapeHtml(name)}</div>
                </div>
                <div class="flex-row-left">
                    <span class="accent2-block width-120 margin-right-10">url</span>
                    <div class="word-break-break-word">${escapeHtml(url)}</div>
                </div>
                <div class="flex-row-left">
                    <span class="accent2-block width-120 margin-right-10">API key</span>
                    <div class="word-break-break-word">${escapeHtml(apiKey)}</div>
                </div>                
            `;
            openaiAPIsList.appendChild(listItem);
            attachEditButtonEventListeners();
            attachDeleteButtonEventListeners();
        });
    })
    .catch(error => {
        console.error('Error:', error);
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = error;
        setTimeout(() => {
            feedback.innerHTML = '';
        }, 5000);
    })
}

function attachEditButtonEventListeners() {               
    const editButtons = document.querySelectorAll('.edit-button');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const openaiAPIName = this.getAttribute('data-name');
            const openaiAPIUrl = this.getAttribute('data-url');
            const openaiAPIAPIKey = this.getAttribute('data-apikey');
            editOpenaiAPI(id, openaiAPIName, openaiAPIUrl, openaiAPIAPIKey);
        });
    });
}

function attachDeleteButtonEventListeners() {
    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteOpenaiAPI(id);
        });
    });
}


// Initial load of OpenAI APIs
loadOpenaiAPIs();