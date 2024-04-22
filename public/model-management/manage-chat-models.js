import { escapeHtml } from "/utils.js";
let editingChatModelId = null; // Track the editing chat model ID

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

document.addEventListener("DOMContentLoaded", function() {
    setupOpenaiAPIOptions();
});

document.getElementById('chatModelForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const chatModelInput = document.getElementById('chatModel');
    let   chatModel = chatModelInput.value;
    
    const stopTokensInput = document.getElementById('stopTokens');
    let   stopTokens = stopTokensInput.value;

    const openaiAPIsSelect = document.getElementById('openaiAPIs');
    let  openaiAPIId = openaiAPIsSelect.value;
    
    const method = editingChatModelId ? 'PUT' : 'POST';
    const url = editingChatModelId ? `/admin/chatModels/${editingChatModelId}` : '/admin/chatModels';
    
    const feedback = document.getElementById('feedback');

    // trim fileds
    chatModel = chatModel.trim();
    stopTokens = stopTokens.trim();

    if(!chatModel || !stopTokens || !openaiAPIId) {
        setFeedback('All fields are required');
        return;
    }

    // validate stop tokens
    const regex = /^\[\s*(['"][^'"]*['"]\s*)(,\s*['"][^'"]*['"]\s*){0,3}\]$/;
    if (!regex.test(stopTokens)) {
        setFeedback('Invalid stop tokens format. Use an array of up to four strings');
        stopTokensInput.focus();
        return;
    }

    // save chat model
    fetch(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ chatModel, stopTokens, openaiAPIId })
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) { throw new Error(data.error); }

        console.log(data);
        chatModelInput.value = '';
        stopTokensInput.value = '';
        feedback.innerHTML = '';
        editingChatModelId = null;
        document.getElementById('chatModelFormButton').textContent = 'Add Chat Model';
        document.getElementById('cancelEditButton').style.display = 'none';
        loadChatModels();
        cancelEditChatModel();
        setFeedback(data.feedback);
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
    })
});

document.getElementById('cancelEditButton').addEventListener('click', function(event) {
    cancelEditChatModel();
});

function editChatModel(id, chatModel, stopTokens, openaiAPIId) {
    editingChatModelId = id;
    document.getElementById('chatModel').value = chatModel;
    document.getElementById('stopTokens').value = stopTokens;
    document.getElementById('openaiAPIs').value = openaiAPIId;
    document.getElementById('chatModelFormButton').textContent = 'Save Changes';
    document.getElementById('cancelEditButton').style.display = 'inline';
}

function cancelEditChatModel() {
    editingChatModelId = null;
    document.getElementById('chatModel').value = '';
    document.getElementById('stopTokens').value = '';
    document.getElementById('openaiAPIs').value = '';
    document.getElementById('chatModelFormButton').textContent = 'Add Chat Model';
    document.getElementById('cancelEditButton').style.display = 'none';
}

function deleteChatModel(id) {
    fetch(`/admin/chatModels/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) { throw new Error(data.error); }
        console.log(data);
        loadChatModels();  // Reload the chat models after deletion
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback
    })
}

function setupOpenaiAPIOptions() {
    fetch('/admin/openaiAPIs')
    .then(response => response.json())
    .then(openaiAPIs => {
        const selectBox = document.getElementById('openaiAPIs');

        // Loop through each openaiAPI and append it to the select box
        openaiAPIs.forEach(openaiAPI => {
            const option = document.createElement('option');
            option.value = openaiAPI.id;
            option.textContent = `${openaiAPI.name} ⇢ ${openaiAPI.url}`;
            selectBox.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
    })
}

function loadChatModels() {
    fetch('/admin/chatModels')
    .then(response => response.json())
    .then(chatModels => {
        const chatModelsList = document.getElementById('chatModelsList');
        // Clear existing chat models
        chatModelsList.innerHTML = '';

        // Loop through each chat model and append it to the list
        chatModels.forEach(chatModel => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="flex-row-left">
                    <button type="button" class="delete-button delete small" data-id="${chatModel.id}">Delete</button>
                    <button type="button" class="edit-button edit small" data-id="${chatModel.id}" data-chatModel="${chatModel.chatModel}" data-stopTokens="${escapeHtml(chatModel.stopTokens)}" data-open-ai-api-id="${chatModel.openaiAPIId}">Edit</button>
                </div>
                <div class="flex-row-left">
                    <span class="accent2-block width-120 margin-right-10">chat model</span>
                    <div class="word-break-break-word">${chatModel.chatModel}</div>
                </div>
                <div class="flex-row-left">
                    <span class="accent2-block width-120 margin-right-10">stop tokens</span>
                    <div class="word-break-break-word">${escapeHtml(chatModel.stopTokens)}</div>
                </div>
                <div class="flex-row-left">                
                    <span class="accent2-block width-120 margin-right-10">OpenAI API</span>
                    <div class="word-break-break-word">${chatModel.openaiAPIs_name} ⇢ ${chatModel.openaiAPIs_url}</div>
                </div>
            `;
            chatModelsList.appendChild(listItem);
        });
        attachEditButtonEventListeners();
        attachDeleteButtonEventListeners();
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
    })
}

function attachEditButtonEventListeners() {
    const editButtons = document.querySelectorAll('.edit-button');
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const chatModel = this.getAttribute('data-chatModel');
            const stopTokens = this.getAttribute('data-stopTokens');
            const openaiAPIId = this.getAttribute('data-open-ai-api-id');
            editChatModel(id, chatModel, stopTokens, openaiAPIId);
        });
    });
}

function attachDeleteButtonEventListeners() {
    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteChatModel(id);
        });
    });
}


// Initial load of chat models
loadChatModels();