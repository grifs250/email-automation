document.addEventListener('DOMContentLoaded', function () {
    // Check if we're on the dashboard page by looking for a unique element
    if (document.querySelector('.dashboard-list')) {
        initDashboardPage();
    }

    // Check if we're on the bulk email page by looking for a unique element
    if (document.querySelector('.centered-form')) {
        initBulkEmailPage();
    }

    // Add other conditions for different pages here
    // if (document.querySelector('.some-other-page-class')) {
    //     initOtherPage();
    // }

    // Add a universal feature that can be used across multiple pages if needed
    initGlobalFeatures();
});

// Function to initialize dashboard page specific features
function initDashboardPage() {
    // Attach event listeners for delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function(event) {
            // Prevent the event from bubbling up to the card's click event
            event.stopPropagation();

            const recordId = this.getAttribute('data-id');
            confirmDeletion(recordId);
        });
    });

    // Card click event listener
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('click', function() {
            const url = this.getAttribute('data-url');
            window.location.href = url;
        });
    });
}

// Function to initialize bulk email page specific features
function initBulkEmailPage() {
    // Toggle custom content section visibility
    document.getElementById('emailTemplate').addEventListener('change', function() {
        const customContentSection = document.getElementById('customContentSection');
        customContentSection.style.display = this.value === 'custom' ? 'block' : 'none';
    });

    // Toggle custom email section visibility
    document.getElementById('emailList').addEventListener('change', function() {
        const customEmailSection = document.getElementById('customEmailSection');
        customEmailSection.style.display = this.value === 'custom' ? 'block' : 'none';
    });

    // Toggle schedule time visibility
    document.getElementById('scheduleToggle').addEventListener('change', function() {
        const scheduleTimeWrapper = document.getElementById('scheduleTimeWrapper');
        scheduleTimeWrapper.style.display = this.checked ? 'block' : 'none';
    });

    // Add another scheduled email
    document.getElementById('addScheduleBtn').addEventListener('click', function() {
        const form = document.querySelector('form.centered-form');
        const scheduleSection = document.querySelector('.section:nth-child(5)').cloneNode(true);
        form.insertBefore(scheduleSection, document.querySelector('.large-btn'));
    });
}

// Universal features that run on every page
function initGlobalFeatures() {
    // Toggle theme or any other global feature
    // toggleTheme();
}

// DELETION
function confirmDeletion(recordId) {
    showCustomConfirmationDialog('Are you sure you want to delete this record?', (confirmed) => {
        if (confirmed) {
            fetch(`/dashboard/${recordId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    showSuccessMessage(data.message);
                    setTimeout(() => location.reload(), 2000);
                } else {
                    showErrorMessage('Failed to delete record');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while deleting the record.');
            });
        }
    });
}

function showSuccessMessage(message) {
    const successMessageDiv = document.getElementById('successMessage');
    successMessageDiv.textContent = message;
    successMessageDiv.style.display = 'block';
    successMessageDiv.scrollIntoView();
}

function showErrorMessage(message) {
    alert(message);
}

function showCustomConfirmationDialog(message, callback) {
    const modal = document.createElement('div');
    modal.classList.add('custom-modal');

    modal.innerHTML = `
        <div class="modal-content">
            <p>${message}</p>
            <button id="confirmBtn" class="btn btn-danger">Yes</button>
            <button id="cancelBtn" class="btn btn-secondary">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('confirmBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
        callback(true);
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
        callback(false);
    });
}
