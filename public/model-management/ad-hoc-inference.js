function setFeedback(message) {
    const feedback = document.getElementById('feedback');
    feedback.innerHTML = message;
    setTimeout(() => {
        feedback.innerHTML = '';
    }, 5000);
}

document.getElementById('randomQuestionButton').addEventListener('click', function(event) {
    setRandomQuestion();
    submitAdHocInference();
});

document.getElementById('reloadPageButton').addEventListener('click', function(event) {
    document.location.reload();
});

document.getElementById('feedback').addEventListener('click', function(event) {
    const feedback = document.getElementById('feedback');
    feedback.innerHTML = '';
});

document.addEventListener("DOMContentLoaded", function() {
    setupModelOptions();
    loadRandomQuestions();
});

document.getElementById('adHocInferenceForm').addEventListener('submit', function(event) {
    event.preventDefault();
    submitAdHocInference();
});

document.getElementById('prompt').addEventListener("keydown", function(event) {
    if (event.key === "Enter" && event.ctrlKey) {
        event.preventDefault();
        submitAdHocInference();
    }
});

function submitAdHocInference() {
    const model = JSON.parse(document.getElementById('model').value);
    const apiUrl = model.apiUrl;
    const apiKey = model.apiKey;
    const stopTokens = model.stopTokens;
    const modelName = model.model;
    const modelAPI = model.apiName;
    const prompt = document.getElementById('prompt').value.trim();
    let promptResponse = '';

    const feedback = document.getElementById('feedback');

    if(!model || !prompt) {
        setFeedback('All fields are required');
        return;
    }

    const loader = document.getElementById('loader');
    const buttons = document.getElementById('buttons');

    buttons.classList.add('hidden');
    loader.classList.remove('hidden');

    const startTime = performance.now();  // Start timing

    fetch('/ad-hoc-inference', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiUrl, apiKey, modelName, stopTokens, prompt })
    })
    .then(response => response.json())
    .then(data => {
        const endTime = performance.now();  // End timing
        const inferenceTime = `${endTime - startTime} milliseconds`;
        let inferenceTimeSeconds = (endTime - startTime) / 1000;
        inferenceTimeSeconds =  parseFloat(inferenceTimeSeconds.toFixed(2));

        console.log(data);
        feedback.innerHTML = '';
        promptResponse = data.feedback;
        setFeedback('ad hoc prompt successful');

        const inferenceHistoryList = document.getElementById('inferenceHistoryList');
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="flex-row-top-left">
                <div class="flex-column-top-left margin-right-20">
                    <div class="accent no-wrap">${modelAPI}</div>
                    <div class="accent2 no-wrap">${modelName}</div>
                </div>
                <div class="flex-column-top-left">
                    <div class="accent">time to first token: <span class="accent2">${promptResponse.inferenceTimeToFirstTokenSeconds} seconds</span> ⋅ total time: <span class="accent2">${inferenceTimeSeconds} seconds</span></div>
                    <div>${promptResponse.llmResponseText}</div>
                </div>
            </div>
        `;
        inferenceHistoryList.prepend(listItem);

        buttons.classList.remove('hidden');
        loader.classList.add('hidden');
    })
    .catch(error => console.error('Error:', error));
}

function setupModelOptions() {
    fetch('/ad-hoc-inference/models')
    .then(response => response.json())
    .then(models => {
        const selectBox = document.getElementById('model');

        // Loop through each model and append it to the select box
        models.forEach(model => {
            const option = document.createElement('option');
            const optionValue = {
                "model": model.model,
                "stopTokens": model.stopTokens,
                "apiName": model.apiName,
                "apiUrl": model.apiUrl,
                "apiKey": model.apiKey
            };
            option.value = JSON.stringify(optionValue);
            option.textContent = `${model.model} ⇢ ${model.apiName}`;
            selectBox.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
    })
}

// Load the random questions from the file
let randomQuestions;
async function loadRandomQuestions() {
    try {
        const response = await fetch('/model-management/ad-hoc-inference-questions.txt');
        const text = await response.text();
        randomQuestions = text.split('\n').filter(question => question.trim() !== '');
        setRandomQuestion();
    } catch (error) {
        console.error('Error loading random questions:', error);
    }
}


// Set a random question in the input box
function setRandomQuestion() {
    if (randomQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * randomQuestions.length);
        document.getElementById('prompt').value = randomQuestions[randomIndex].trim(); // Trim the question to remove any trailing newline
    }
}
