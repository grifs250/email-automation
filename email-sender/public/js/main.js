// public/js/main.js

// Function to confirm and process the deletion of a record
function confirmDeletion(recordId) {
    if (confirm('Are you sure you want to delete this record?')) {
        fetch(`/dashboard/${recordId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                location.reload(); // Refresh the page to update the list
            } else {
                alert('Failed to delete record');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while deleting the record.');
        });
    }
}

// // Function to toggle between light and dark mode
// function toggleTheme() {
//     document.body.classList.toggle('dark-mode');
//     const newTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
//     localStorage.setItem('theme', newTheme);
// }

// // Initialize the theme based on localStorage
// (function() {
//     const currentTheme = localStorage.getItem('theme') || 'light';
//     if (currentTheme === 'dark') {
//         document.body.classList.add('dark-mode');
//     }
// })();