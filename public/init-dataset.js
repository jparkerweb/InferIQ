let eventSource;

// Initialize the dataset on button click
document.getElementById('initBtn').addEventListener('click', function() {
    const initButton = document.getElementById('initBtn');
    const cancelButton = document.getElementById('cancelBtn');
    const loaderElement = document.getElementById('loader');
    const statusElement = document.getElementById('status');
    const feedbackMessageElement = document.getElementById('feedbackMessage');
    const messageIdElement = document.getElementById('messageId');
    const modelElement = document.getElementById('model');
    const questionLabelElement = document.getElementById('questionLabel');
    
    initButton.disabled = true;
    initButton.classList.add('hidden');
    cancelButton.classList.remove('hidden');
    loaderElement.classList.remove('hidden');
    statusElement.textContent = 'Initialization started...';

    eventSource = new EventSource('/init-dataset');

    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);

        if (data.progress !== undefined) {
            statusElement.innerHTML = `<span class="accent">${data.progress}%</span>`;
            feedbackMessageElement.innerHTML = data.feedback;
            messageIdElement.innerHTML= `message id <span class="accent">${data.messageId}</span>`;
            modelElement.innerHTML = `model: <span class="accent">${data.model}</span>`;
            questionLabelElement.innerHTML = `<span class="accent2">${data.questionLabel}</span>`;
        } else {
            statusElement.textContent = data.message;
        }

        if (data.message === 'Datase Initialization complete') {
            feedbackMessageElement.innerHTML = '';
            messageIdElement.innerHTML = '';
            modelElement.innerHTML = '';
            questionLabelElement.innerHTML = '';
            eventSource.close();
            initButton.disabled = false;  // Re-enable the button
            initButton.classList.remove('hidden');
            cancelButton.classList.add('hidden');
            loaderElement.classList.add('hidden');
        }
    };

    eventSource.onerror = function() {
        loaderElement.classList.add('hidden');
        statusElement.innerHTML = `
            <strong class="color-error">Error occurred during initialization</strong>
            <div class="accent2">Please reload the page and try again.</div>
            <button class="margin-top-20" onclick="window.location.reload();">Reload Page</button>
        `;
        feedbackMessageElement.innerHTML = '';
        messageIdElement.innerHTML = '';
        modelElement.innerHTML = '';
        questionLabelElement.innerHTML = '';
        eventSource.close();
        initButton.classList.add('hidden');
        cancelButton.classList.add('hidden');
        loaderElement.classList.add('hidden');
    };
});


document.getElementById('cancelBtn').addEventListener('click', function() {    
    const initButton = document.getElementById('initBtn');
    const cancelButton = document.getElementById('cancelBtn');
    const loaderElement = document.getElementById('loader');
    const statusElement = document.getElementById('status');
    const feedbackMessageElement = document.getElementById('feedbackMessage');
    const messageIdElement = document.getElementById('messageId');
    const modelElement = document.getElementById('model');
    const questionLabelElement = document.getElementById('questionLabel');


    if (eventSource) {
        eventSource.close();
    }
    
    statusElement.textContent = 'Dataset Initialization has been stopped...';
    feedbackMessageElement.innerHTML = '';
    messageIdElement.innerHTML = '';
    modelElement.innerHTML = '';
    questionLabelElement.innerHTML = '';

    initButton.disabled = false;
    initButton.classList.remove('hidden');
    cancelButton.classList.add('hidden');
    loaderElement.classList.add('hidden');

    sendStopSignal();
});

function sendStopSignal() {
    fetch('/stop-init-dataset', { method: 'POST' })
        .catch(err => console.error('Error sending stop signal', err));
}