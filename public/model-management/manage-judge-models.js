import { escapeHtml } from "/utils.js";
let editingJudgeModelId = null; // Track the editing judge model ID

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

document.getElementById('judgeModelForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const judgeModelInput = document.getElementById('judgeModel');
    let   judgeModel = judgeModelInput.value;

    const stopTokensInput = document.getElementById('stopTokens');
    let   stopTokens = stopTokensInput.value;

    const openaiAPIsSelect = document.getElementById('openaiAPIs');
    let  openaiAPIId = openaiAPIsSelect.value;

    const method = editingJudgeModelId ? 'PUT' : 'POST';
    const url = editingJudgeModelId ? `/admin/judgeModels/${editingJudgeModelId}` : '/admin/judgeModels';

    const feedback = document.getElementById('feedback');

    // trim fileds
    judgeModel = judgeModel.trim();
    stopTokens = stopTokens.trim();

    if(!judgeModel || !stopTokens || !openaiAPIId) {
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

    // save judge model
    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judgeModel, stopTokens, openaiAPIId })
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) { throw new Error(data.error); }

        console.log(data);
        judgeModelInput.value = '';
        stopTokensInput.value = '';
        feedback.innerHTML = '';
        editingJudgeModelId = null;
        document.getElementById('judgeModelFormButton').textContent = 'Add Judge Model';
        document.getElementById('cancelEditButton').style.display = 'none';
        loadJudgeModels();
        cancelEditJudgeModel();
        setFeedback(data.feedback);
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
    })
});

document.getElementById('cancelEditButton').addEventListener('click', function(event) {
    cancelEditJudgeModel();
});

function editJudgeModel(id, judgeModel, stopTokens, openaiAPIId) {
    editingJudgeModelId = id;
    document.getElementById('judgeModel').value = judgeModel;
    document.getElementById('stopTokens').value = stopTokens;
    document.getElementById('openaiAPIs').value = openaiAPIId;
    document.getElementById('judgeModelFormButton').textContent = 'Save Changes';
    document.getElementById('cancelEditButton').style.display = 'inline';
}

function cancelEditJudgeModel() {
    editingJudgeModelId = null;
    document.getElementById('judgeModel').value = '';
    document.getElementById('stopTokens').value = '';
    document.getElementById('openaiAPIs').value = '';
    document.getElementById('judgeModelFormButton').textContent = 'Add Judge Model';
    document.getElementById('cancelEditButton').style.display = 'none';
}

function deleteJudgeModel(id) {
    fetch(`/admin/judgeModels/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) { throw new Error(data.error); }
        console.log(data);
        loadJudgeModels();  // Reload the judge models after deletion
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
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

function loadJudgeModels() {
    fetch('/admin/judgeModels')
    .then(response => response.json())
    .then(judgeModels => {
        const judgeModelsList = document.getElementById('judgeModelsList');
        // Clear existing judge models
        judgeModelsList.innerHTML = '';

        // Loop through each judge model and append it to the list
        judgeModels.forEach(judgeModel => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="flex-row-left">
                    <button type="button" class="delete-button delete small" data-id="${judgeModel.id}">Delete</button>
                    <button type="button" class="edit-button edit small" data-id="${judgeModel.id}" data-judgeModel="${judgeModel.judgeModel}" data-stopTokens="${escapeHtml(judgeModel.stopTokens)}" data-open-ai-api-id="${judgeModel.openaiAPIId}">Edit</button>
                </div>
                <div class="flex-row-left">
                    <span class="accent2-block width-120 margin-right-10">judge model</span>
                    <div class="word-break-break-word">${judgeModel.judgeModel}</div>
                </div>
                <div class="flex-row-left">
                    <span class="accent2-block width-120 margin-right-10">stop tokens</span>
                    <div class="word-break-break-word">${escapeHtml(judgeModel.stopTokens)}</div>
                </div>
                <div class="flex-row-left">                
                    <span class="accent2-block width-120 margin-right-10">OpenAI API</span>
                    <div class="word-break-break-word">${judgeModel.openaiAPIs_name} ⇢ ${judgeModel.openaiAPIs_url}</div>
                </div>
            `;
            judgeModelsList.appendChild(listItem);
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
            const judgeModel = this.getAttribute('data-judgeModel');
            const stopTokens = this.getAttribute('data-stopTokens');
            const openaiAPIId = this.getAttribute('data-open-ai-api-id');
            editJudgeModel(id, judgeModel, stopTokens, openaiAPIId);
        });
    });
}

function attachDeleteButtonEventListeners() {
    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteJudgeModel(id);
        });
    });
}


// Initial load of judge models
loadJudgeModels();