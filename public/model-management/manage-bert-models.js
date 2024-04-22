let editingOnnxBERTModelId = null; // Track the editing onnxBERTModel ID

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

document.getElementById('onnxBERTModelForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const onnxBERTModel = document.getElementById('onnxBERTModel').value.trim();
    const onnxBERTModelQuantized = document.getElementById('onnxBERTModelQuantized').value;
    const url = editingOnnxBERTModelId ? `/admin/onnxBERTModels/${editingOnnxBERTModelId}` : '/admin/onnxBERTModels';
    const method = editingOnnxBERTModelId ? 'PUT' : 'POST';

    if (!onnxBERTModelQuantized || !onnxBERTModel ) {
        setFeedback('All fields are required');
        return;
    }

    const onnxBERTModelData = { onnxBERTModel, onnxBERTModelQuantized };

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onnxBERTModelData)
    })
    .then(response => response.json())
    .then(data => {
        setFeedback(data.feedback);
        document.getElementById('onnxBERTModel').value = '';
        document.getElementById('onnxBERTModelQuantized').selectedIndex = 0;
        editingOnnxBERTModelId = null; // Reset editing mode
        loadOnnxBERTModels(); // Reload the list
        cancelEdit(); // Reset form to "add" mode
    })
    .catch(error => console.error('Error:', error));
});

function cancelEdit() {
    editingOnnxBERTModelId = null;
    document.getElementById('onnxBERTModel').value = '';
    document.getElementById('onnxBERTModelQuantized').value = '1'; // Or your default type
    document.getElementById('onnxBERTModelFormButton').textContent = 'Add BERT Model';
    document.getElementById('cancelEditButton').style.display = 'none';
}

function editOnnxBERTModel(id, onnxBERTModel, onnxBERTModelQuantized) {
    editingOnnxBERTModelId = id;
    document.getElementById('onnxBERTModelQuantized').value = onnxBERTModelQuantized;
    document.getElementById('onnxBERTModel').value = onnxBERTModel;
    document.getElementById('onnxBERTModelFormButton').textContent = 'Save Changes';
    document.getElementById('cancelEditButton').style.display = 'inline';
}

function deleteOnnxBERTModel(id) {
    fetch(`/admin/onnxBERTModels/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        if(data.error) { throw new Error(data.error); }
        console.log(data);
        loadOnnxBERTModels();  // Reload the onnxBERTModels after deletion
    })
    .catch(error => {
        console.error('Error:', error);
        setFeedback(error);
    })
}

function loadOnnxBERTModels() {
    fetch('/admin/onnxBERTModels')
    .then(response => response.json())  // Parse the response as JSON
    .then(onnxBERTModels => {
        const onnxBERTModelsList = document.getElementById('onnxBERTModelsList');
        // Clear existing questions
        onnxBERTModelsList.innerHTML = '';

        // Loop through each question and append it to the list
        onnxBERTModels.forEach(onnxBERTModel => {
            const listItem = document.createElement('li');
            const quantized = onnxBERTModel.onnxBERTModelQuantized ? 'yes' : 'no';
            listItem.innerHTML = `
                <div class="flex-row-left">
                    <button type="button" class="delete-button delete small" data-id="${onnxBERTModel.id}">Delete</button>
                    <button type="button" class="edit-button edit small" data-id="${onnxBERTModel.id}" data-onnxBERTModel="${onnxBERTModel.onnxBERTModel}" data-onnxBERTModelQuantized="${onnxBERTModel.onnxBERTModelQuantized}">Edit</button>
                </div>
                <div class="flex-row-left">
                    <span class="accent2-block width-120 margin-right-10">BERT model</span>
                    <div class="word-break-break-word">${onnxBERTModel.onnxBERTModel}</div>
                </div>
                <div class="flex-row-left">
                    <span class="accent2-block width-120 margin-right-10">quantized</span>
                    <div class="word-break-break-word">${quantized}</div>
                </div>
            `;
            onnxBERTModelsList.appendChild(listItem);
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
            const onnxBERTModel = this.getAttribute('data-onnxBERTModel');
            const onnxBERTModelQuantized = this.getAttribute('data-onnxBERTModelQuantized');
            editOnnxBERTModel(id, onnxBERTModel, onnxBERTModelQuantized);
        });
    });
}

function attachDeleteButtonEventListeners() {
    const deleteButtons = document.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteOnnxBERTModel(id);
        });
    });
}


// Initial load of onnxBERTModels
loadOnnxBERTModels();