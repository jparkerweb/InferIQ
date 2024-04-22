let eventSource;

document.getElementById('judgeBtn').addEventListener('click', function() {
    const judgeButton = document.getElementById('judgeBtn');
    const cancelButton = document.getElementById('cancelBtn');
    const loaderElement = document.getElementById('loader');
    const statusElement = document.getElementById('status');
    const feedbackMessageElement = document.getElementById('feedbackMessage');
    const currentMessageCountElement = document.getElementById('currentMessageCount');
    const modelElement = document.getElementById('model');
    const judgeModelElement = document.getElementById('judgeModel');
    const questionLabelElement = document.getElementById('questionLabel');
    
    // Disable the button
    judgeButton.disabled = true;
    judgeButton.classList.add('hidden');
    cancelButton.classList.remove('hidden');
    loaderElement.classList.remove('hidden');
    statusElement.textContent = 'Judging started...';

    eventSource = new EventSource('/judge-dataset-answers');  // Initialize eventSource here

    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);

        if (data.progress !== undefined) {
            statusElement.innerHTML = `<span class="accent">${data.progress}%</span>`;
            feedbackMessageElement.innerHTML = data.message;
            currentMessageCountElement.innerHTML = `message <span class="accent">#${data.currentMessageCount}</span>`;
            modelElement.innerHTML = `chat model: <span class="accent">${data.model}</span>`;
            judgeModelElement.innerHTML = `judge model: <span class="accent">${data.judgeModel}</span>`;
            questionLabelElement.innerHTML = `<span class="accent2">${data.questionLabel}</span>`;
        } else {
            statusElement.textContent = data.message;
        }

        if (data.message === 'Judging complete') {
            feedbackMessageElement.innerHTML = '';
            currentMessageCountElement.innerHTML = '';
            modelElement.innerHTML = '';
            judgeModelElement.innerHTML = '';
            questionLabelElement.innerHTML = '';
            eventSource.close();
            judgeButton.disabled = false;
            judgeButton.classList.remove('hidden');
            cancelButton.classList.add('hidden');
            loaderElement.classList.add('hidden');
        }
    };

    eventSource.onerror = function() {
        statusElement.innerHTML = `
            <strong class="color-error">Error occurred while Juding</strong>
            <div class="accent2">Please reload the page and try again.</div>
            <button class="margin-top-20" onclick="window.location.reload();">Reload Page</button>
        `;
        feedbackMessageElement.innerHTML = '';
        currentMessageCountElement.innerHTML = '';
        modelElement.innerHTML = '';
        judgeModelElement.innerHTML = '';
        questionLabelElement.innerHTML = '';

        judgeButton.classList.add('hidden');
        cancelButton.classList.add('hidden');
        loaderElement.classList.add('hidden');
        
        eventSource.close();
    };
});

document.getElementById('cancelBtn').addEventListener('click', function() {
    const judgeButton = document.getElementById('judgeBtn');
    const cancelButton = document.getElementById('cancelBtn');
    const loaderElement = document.getElementById('loader');
    const statusElement = document.getElementById('status');
    const feedbackMessageElement = document.getElementById('feedbackMessage');
    const currentMessageCountElement = document.getElementById('currentMessageCount');
    const modelElement = document.getElementById('model');
    const judgeModelElement = document.getElementById('judgeModel');
    const questionLabelElement = document.getElementById('questionLabel');


    if (eventSource) {
        eventSource.close();
    }
    
    statusElement.textContent = 'Judging has been stopped...';
    feedbackMessageElement.innerHTML = '';
    currentMessageCountElement.innerHTML = '';
    modelElement.innerHTML = '';
    judgeModelElement.innerHTML = '';
    questionLabelElement.innerHTML = '';

    judgeButton.disabled = false;
    judgeButton.classList.remove('hidden');
    cancelButton.classList.add('hidden');
    loaderElement.classList.add('hidden');

    sendStopSignal();
});

function sendStopSignal() {
    fetch('/stop-judging-generated-dataset', { method: 'POST' })
        .catch(err => console.error('Error sending stop signal', err));
}