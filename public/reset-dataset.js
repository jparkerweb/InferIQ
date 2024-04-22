document.getElementById('deleteBtn').addEventListener('click', function() {
    const deleteBtn = document.getElementById('deleteBtn');
    const messageElement = document.getElementById('message');

    deleteBtn.disabled = true;

    fetch('/delete-db-dataset')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            } else {
                return response.text();
            }
        })
        .then(data => {
            console.log(data);
            deleteBtn.disabled = false;
            messageElement.textContent = data;
        })
        .catch(error => {
            console.error('There has been a problem with your delete operation:', error);
            deleteBtn.disabled = false;
            messageElement.textContent = error;
        })
});
