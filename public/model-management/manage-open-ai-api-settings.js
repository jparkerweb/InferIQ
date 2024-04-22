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

document.getElementById('openaiAPISettingsForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const temperatureInput = document.getElementById('temperature');
    let   temperature = temperatureInput.value;

    const maxResponseTokensInput = document.getElementById('maxResponseTokens');
    let   maxResponseTokens = maxResponseTokensInput.value;

    const rateLimitInput = document.getElementById('rateLimit');
    let   rateLimit = rateLimitInput.value;
    
    const method = 'PUT';
    const url = '/admin/openaiAPISettings';
    const feedback = document.getElementById('feedback');

    // trim fileds
    temperature = temperature.trim();
    maxResponseTokens = maxResponseTokens.trim();
    rateLimit = rateLimit.trim();

    if (!/^[-+]?\d*\.?\d+([eE][-+]?\d+)?$/.test(temperature)) {
        setFeedback('Please enter a valid number for temperature');
        return;
    }
    if (!/^\d+$/.test(maxResponseTokens)) {
        setFeedback('Please enter a valid integer for max response tokens');
        return;
    }
    if (!/^\d+$/.test(rateLimit)) {
        setFeedback('Please enter a valid integer for rate limit');
        return;
    }

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature, maxResponseTokens, rateLimit })
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) { throw new Error(data.error); }

        console.log(data);
        feedback.innerHTML = '';
        document.getElementById('openaiAPISettingsFormButton').textContent = 'Update OpenAI API Settings';
        getOpenaiAPISettings();
        setFeedback(data.feedback);
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
    })
});


function getOpenaiAPISettings() {
    fetch('/admin/openaiAPISettings')
    .then(response => response.json())
    .then(openaiAPISettings => {
        document.getElementById('temperature').value = openaiAPISettings[0].temperature;
        document.getElementById('maxResponseTokens').value = openaiAPISettings[0].maxResponseTokens;
        document.getElementById('rateLimit').value = openaiAPISettings[0].rateLimit;
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
    })
}


// Initial load of OpenAI API Settings
getOpenaiAPISettings();