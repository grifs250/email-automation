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

async function initBulkEmailPage() {
    const emailList = document.getElementById("emailList");
    const customEmailSection = document.getElementById("customEmailSection");
    const emailTemplate = document.getElementById("emailTemplate");
    const customContentSection = document.getElementById("customContentSection");
    const scheduleToggle = document.getElementById("scheduleToggle");
    const scheduleTimeWrapper = document.getElementById("scheduleTimeWrapper");

    // Fetch email lists and templates from the server
    // await renderEmailForm();

    // Set initial visibility based on current selections
    if (emailList.value === "custom") {
        customEmailSection.style.display = "block";
    } else {
        customEmailSection.style.display = "none";
    }

    if (emailTemplate.value === "custom") {
        customContentSection.style.display = "block";
    } else {
        customContentSection.style.display = "none";
    }

    if (scheduleToggle.checked) {
        scheduleTimeWrapper.style.display = "block";
    } else {
        scheduleTimeWrapper.style.display = "none";
    }

    // Toggle custom email section visibility on change
    emailList.addEventListener("change", function() {
        customEmailSection.style.display = emailList.value === "custom" ? "block" : "none";
    });

    // Toggle custom content section visibility on change
    emailTemplate.addEventListener("change", function() {
        customContentSection.style.display = emailTemplate.value === "custom" ? "block" : "none";
    });

    // Toggle schedule time visibility on change
    scheduleToggle.addEventListener("change", function() {
        scheduleTimeWrapper.style.display = scheduleToggle.checked ? "block" : "none";
    });

    // Add another scheduled email section
    // Mybe later
    // document.getElementById('addScheduleBtn').addEventListener('click', function() {
    //     const form = document.querySelector('form.centered-form');
    //     const scheduleSection = document.querySelector('.section:nth-child(5)').cloneNode(true);
    //     form.insertBefore(scheduleSection, document.querySelector('.large-btn'));
    // });
}

// Function to fetch email lists and templates, and populate the form
// async function renderEmailForm() {
//     try {
//         // Fetch email lists and templates from the server
//         const response = await fetch('/');
//         const data = await response.json();

//         const emailListSelect = document.getElementById('emailList');
//         const emailTemplateSelect = document.getElementById('emailTemplate');

//         // POPULATE email lists dropdown
//         data.emailLists.forEach(list => {
//             const option = document.createElement('option');
//             option.value = list.email; // Assuming email is the field you want to use
//             option.textContent = list.email;
//             emailListSelect.appendChild(option);
//         });

//         // POPULATE email templates dropdown
//         data.templates.forEach(template => {
//             const option = document.createElement('option');
//             option.value = template;
//             option.textContent = template.replace('.html', ''); // Remove .html extension for display
//             emailTemplateSelect.appendChild(option);
//         });
//     } catch (error) {
//         console.error('Error fetching email form data:', error);
//         alert('Failed to load email form data.');
//     }
// }

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
