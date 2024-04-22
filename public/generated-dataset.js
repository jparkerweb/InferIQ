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

function getColorByJudgeRating(score) {
    // Array of colors corresponding to scores 1 to 10
    const colorData = [
        { bg: '#FF0000', text: '#FFFFFF' }, // 1 - red
        { bg: '#FF3300', text: '#FFFFFF' }, // 2 - red
        { bg: '#FF6600', text: '#000000' }, // 3 - orange
        { bg: '#FF9900', text: '#000000' }, // 4 - orange
        { bg: '#FFCC00', text: '#000000' }, // 5 - yellow
        { bg: '#FFFF00', text: '#000000' }, // 6 - yellow
        { bg: '#CCFF00', text: '#000000' }, // 7 - blue
        { bg: '#99FF00', text: '#000000' }, // 8 - blue
        { bg: '#66FF00', text: '#000000' }, // 9 - green
        { bg: '#00FF00', text: '#000000' }  // 10 - green
    ];

    // Check if the score is within the valid range
    if (score < 1 || score > 10) {
        return { bg: '#FF0000', text: '#FFFFFF' };  // Return red with white text for 'Invalid score'
    }

    // Return the color object corresponding to the score
    return colorData[score - 1];
}


function getColorByBERTScore(score) {
    // Ensure the score is within the expected range
    if (score < -1 || score > 1) {
        return { bg: '#FF0000', text: '#FFFFFF' };  // Red for 'Invalid score' with white text
    }

    let r, g;

    // Calculate the red and green components based on the score
    r = 255 * (1 - score);  // Red decreases from 255 to 0 as score increases from -1 to 1
    g = 255 * (1 + score);  // Green increases from 0 to 255 as score increases from -1 to 1

    // Convert each component to an integer and clamp within the range 0-255
    r = Math.min(255, Math.max(0, Math.round(r)));
    g = Math.min(255, Math.max(0, Math.round(g)));

    // Convert to hex using the corrected rgbToHex function
    let bg = rgbToHex(r, g, 0);

    // Determine the best text color for readability
    let text = getReadableTextColor(r, g, 0);

    // Return the colors in an object format
    return { bg: bg, text: text };
}

function rgbToHex(r, g, b) {
    // Convert RGB values to hexadecimal string, ensuring each is properly clamped and converted
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function getReadableTextColor(r, g, b) {
    // Calculate luminance
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    // Return white (#FFFFFF) for dark backgrounds and black (#000000) for light backgrounds
    return luminance < 128 ? '#FFFFFF' : '#000000';
}



function loadGeneratedDataset(page) {
    currentPage = page;
    fetch(`/admin/generatedDataset?page=${page}`)
    .then(response => response.json())
    .then(data => {
        const generatedDataset = data.generatedDataset;
        const total = data.total;
        const totalPages = Math.ceil(total / 10); // Assuming 10 messages per page

        const generatedDatasetTableBody = document.getElementById('generatedDatasetTableBody');
        generatedDatasetTableBody.innerHTML = '';

        // Loop through each dataset entry and append it to the list
        generatedDataset.forEach(dataset => {
            const tr = document.createElement('tr');
            const colorSettingJudgeRating = dataset.judgeRating !== null ? getColorByJudgeRating(dataset.judgeRating) : null;
            const colorSettingBERTScore = dataset.onnxBERTScore !== null ? getColorByBERTScore(dataset.onnxBERTScore) : null;
            const colorSettingBERTGroundedTruthScore = dataset.onnxBERTGroundedTruthScore !== null ? getColorByBERTScore(dataset.onnxBERTGroundedTruthScore) : null;

            let score = '';
            if (colorSettingJudgeRating) {
                score += `<span class="score-badge" style="background-color: ${colorSettingJudgeRating.bg}; color: ${colorSettingJudgeRating.text};">Judge ${dataset.judgeRating}</span>`;
            }
            if (colorSettingBERTScore) {
                score += `<span class="score-badge" style="background-color: ${colorSettingBERTScore.bg}; color: ${colorSettingBERTScore.text};">BERT ${dataset.onnxBERTScore}</span>`;
            }
            if (colorSettingBERTGroundedTruthScore) {
                score += `<span class="score-badge" style="background-color: ${colorSettingBERTGroundedTruthScore.bg}; color: ${colorSettingBERTGroundedTruthScore.text};">BERT GT ${dataset.onnxBERTGroundedTruthScore}</span>`;
            }

            tr.onclick = function() { openDatasetModal(dataset.id) };
            tr.innerHTML = `
                <td><span class="modal-trigger">${dataset.id}</span></td>
                <td>${dataset.questionLabel}</td>
                <td>${dataset.message.substring(0, 77)} ... ${dataset.message.substring(dataset.message.length - 77)}</td>
                <td>${dataset.chatModel}</td>
                <td>${dataset.judgeModel || dataset.onnxBERTModel}</td>
                <td>${score}</td>
            `;
            generatedDatasetTableBody.appendChild(tr);
        });

        // Enable/Disable Previous button
        document.querySelector('#prevButton').disabled = currentPage <= 1;
        // Enable/Disable Next button
        document.querySelector('#nextButton').disabled = currentPage >= totalPages;

        if (total === 0) {
            document.getElementById('pagination').classList.add('display-none');
            document.getElementById('generatedDatasetTable').classList.add('display-none');
            document.getElementById('noGeneratedDataset').classList.remove('display-none');
        } else {
            document.getElementById('noGeneratedDataset').classList.add('display-none');
            document.getElementById('pagination').classList.remove('display-none');
            document.getElementById('generatedDatasetTable').classList.remove('display-none');
        }
    })
    .catch(error => console.error('Error:', error));
}


function openDatasetModal(id) {    
    fetch(`/admin/generatedDataset/${id}`)
    .then(response => response.json())
    .then(data => {
        const dataset = data.dataset;
        const modal = document.getElementById('datasetModal');
        const modalBackdrop = document.getElementById('datasetModalBackdrop');
        const modalContent = document.getElementById('datasetDetails');
        const hiddenMessage = document.getElementById('hiddenMessage');
        const hiddenGroundedTruth = document.getElementById('hiddenGroundedTruth');
        hiddenMessage.innerHTML = dataset.message;
        hiddenGroundedTruth.innerHTML = dataset.groundedTruthSummary;
        
        const colorSettingJudgeRating = dataset.judgeRating !== null ? getColorByJudgeRating(dataset.judgeRating) : null;
        const colorSettingBERTScore = dataset.onnxBERTScore !== null ? getColorByBERTScore(dataset.onnxBERTScore) : null;
        const colorSettingBERTGroundedTruthScore = dataset.onnxBERTGroundedTruthScore !== null ? getColorByBERTScore(dataset.onnxBERTGroundedTruthScore) : null;

        let judgeScore = '';
        if (colorSettingJudgeRating) {
            judgeScore += `<span class="score-badge" style="background-color: ${colorSettingJudgeRating.bg}; color: ${colorSettingJudgeRating.text};">Judge ${dataset.judgeRating}</span>`;
        }
        let BERTScore = '';
        if (colorSettingBERTScore) {
            BERTScore += `<span class="score-badge" style="background-color: ${colorSettingBERTScore.bg}; color: ${colorSettingBERTScore.text};">BERT ${dataset.onnxBERTScore}</span>`;
        }
        if (colorSettingBERTGroundedTruthScore) {
            BERTScore += `<span class="score-badge" style="background-color: ${colorSettingBERTGroundedTruthScore.bg}; color: ${colorSettingBERTGroundedTruthScore.text};">BERT GT ${dataset.onnxBERTGroundedTruthScore}</span>`;
        }

        let HTMLContent = '';
        HTMLContent += `
            <div class="grid-container">
                <div class="grid-item">
                    <span class="label">chat model &nbsp; 🤖</span>
                    <span class="content">${dataset.chatModel}</span>
                </div>
                <div class="grid-item">
                    <span class="label">message &nbsp; 📄</span>
                    <span class="content" id="showHiddenMessage">
                        ${dataset.message.substring(0, 200)} <a href="#" onclick="document.getElementById('showHiddenMessage').innerHTML=document.getElementById('hiddenMessage').innerHTML; document.getElementById('showHiddenMessage').classList.add('message--displayed')">◀______________________▶</a> ${dataset.message.substring(dataset.message.length - 200)}
                    </span>
                </div>
                <div class="grid-item">
                    <span class="label">question &nbsp; ❔</span>
                    <span class="content">${dataset.questionLabel} ⇢ ${dataset.question}</span>
                </div>
        `;

        if (dataset.onnxBERTGroundedTruthScore !== null && dataset.questionType === 'summary') {
            HTMLContent += `
                <div class="grid-item">
                    <span class="label">grounded truth &nbsp; ✅</span>
                    <span class="content" id="showHiddenGroundedTruth">
                        ${dataset.groundedTruthSummary.substring(0, 200)} <a href="#" onclick="document.getElementById('showHiddenGroundedTruth').innerHTML=document.getElementById('hiddenGroundedTruth').innerHTML; document.getElementById('showHiddenGroundedTruth').classList.add('grounded-truth--displayed')">◀______________________▶</a> ${dataset.groundedTruthSummary.substring(dataset.groundedTruthSummary.length - 200)}
                    </span>
                </div>
            `;
        }

        HTMLContent += `
                <div class="grid-item">
                    <span class="label">answer &nbsp; 💬</span>
                    <span class="content">${dataset.answer}</span>
                </div>
        `;

        if (dataset.judgeFullResponse !== null) {

            HTMLContent += `
                <div class="grid-item">
                    <span class="label">judge rating &nbsp; 🏆</span>
                    <div>${judgeScore}</div>
                </div>
                <div class="grid-item">
                    <span class="label">judge model &nbsp; 🧑‍⚖️</span>
                    <span class="content">${dataset.judgeModel}</span>
                </div>
                <div class="grid-item">
                    <span class="label">judge reasoning &nbsp; 🧪</span>
                    <span class="content">${dataset.judgeReasoning}</span>
                </div>
                <div class="grid-item">
                    <span class="label">judge full response &nbsp; 📰</span>
                    <span class="content">${dataset.judgeFullResponse}</span>
                </div>
            `;
        }

        if (dataset.onnxBERTScore !== null) {
            HTMLContent += `
                <div class="grid-item">
                    <span class="label">BERT score &nbsp; 🏆</span>
                    <div>${BERTScore}</div>
                </div>
                <div class="grid-item">
                    <span class="label">BERT model &nbsp; 🪣</span>
                    <span class="content">${dataset.onnxBERTModel}</span>
                </div>
            `;
        }

        HTMLContent += `
            </div>
        `;
        modalContent.innerHTML = HTMLContent;

        modal.classList.add('modal--open');
        modalBackdrop.classList.add('modal--open');
    })
    .catch(error => console.error('Error:', error));
}

function closeDatasetModal() {
    const modal = document.getElementById('datasetModal');
    const modalBackdrop = document.getElementById('datasetModalBackdrop');
    modal.classList.remove('modal--open');
    modalBackdrop.classList.remove('modal--open');
}



// Initial load of generated dataset
loadGeneratedDataset(currentPage);