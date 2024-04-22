import { escapeHtml } from "./utils.js";
let editingQuestionId = null; // Track the editing question ID

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

document.getElementById('questionForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const questionType = document.getElementById('questionType').value;
    let questionLabel = document.getElementById('questionLabel').value.trim();
    let questionText = document.getElementById('questionInput').value.trim();
    const url = editingQuestionId ? `/admin/questions/${editingQuestionId}` : '/admin/questions';
    const method = editingQuestionId ? 'PUT' : 'POST';

    if (!questionType || !questionLabel || !questionText) {
        setFeedback('All fields are required');
        return;
    }

    const questionData = { questionType, questionLabel, question: questionText };

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('questionLabel').value = '';
        document.getElementById('questionInput').value = '';
        editingQuestionId = null; // Reset editing mode
        loadQuestions(); // Reload the list
        cancelEdit(); // Reset form to "add" mode
    })
    .catch(error => console.error('Error:', error));
});

function cancelEdit() {
    editingQuestionId = null;
    document.getElementById('questionType').value = 'qa'; // Or your default type
    document.getElementById('questionLabel').value = '';
    document.getElementById('questionInput').value = '';
    document.getElementById('questionFormButton').textContent = 'Add Question';
    document.getElementById('cancelEditButton').style.display = 'none';
}

function editQuestion(id, questionType, questionLabel, questionText) {
    editingQuestionId = id;
    document.getElementById('questionType').value = questionType;
    document.getElementById('questionLabel').value = questionLabel;
    document.getElementById('questionInput').value = questionText;
    document.getElementById('questionFormButton').textContent = 'Save Changes';
    document.getElementById('cancelEditButton').style.display = 'inline';
}

function deleteQuestion(id) {
    fetch(`/admin/questions/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) { throw new Error(data.error); }
        console.log(data);
        loadQuestions();  // Reload the questions after deletion
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
    })
}

function loadQuestions() {
    fetch('/admin/questions')
    .then(response => response.json())  // Parse the response as JSON
    .then(questions => {
        const questionsList = document.getElementById('questionsList');
        // Clear existing questions
        questionsList.innerHTML = '';

        // Loop through each question and append it to the list
        questions.forEach(question => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="flex-row-left">
                    <button type="button" class="delete-button delete small" data-id="${question.id}">Delete</button>
                    <button type="button" class="edit-button edit small" data-id="${question.id}" data-questionType="${question.questionType}" data-questionLabel="${escapeHtml(question.questionLabel)}" data-question="${escapeHtml(question.question)}">Edit</button>
                </div>
                <div class="flex-row-left">
                    <span class="accent2-block">type</span>
                    <div class="word-break-break-word">${question.questionType}</div>
                </div>
                <div class="flex-row-left">
                    <span class="accent2-block">label</span>
                    <div class="word-break-break-word">${question.questionLabel}</div>
                </div>
                <div class="flex-row-left margin-top-3">
                    <span class="accent2-block height-100pct flex-column-center">question</span>
                    <div class="word-break-break-word">${question.question}</div>
                </div>
            `;
            questionsList.appendChild(listItem);
            attachEditButtonEventListeners();
            attachDeleteButtonEventListeners();
        });
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
            const questionType = this.getAttribute('data-questionType');
            const questionLabel = this.getAttribute('data-questionLabel');
            const question = this.getAttribute('data-question');
            editQuestion(id, questionType, questionLabel, question);
        });
    });
}

function attachDeleteButtonEventListeners() {
    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteQuestion(id);
        });
    });
}


// Initial load of questions
loadQuestions();