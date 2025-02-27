// Update your form submission URL to use the edge function
const form = document.querySelector('form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/submit.edge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: form.email.value,
        name: form.name?.value || '',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Submission failed');
    }

    // Handle success
    alert('Thank you for subscribing!');
    form.reset();

  } catch (error) {
    // Handle error
    alert('Sorry, there was an error. Please try again later.');
    console.error('Submission error:', error);
  }
}); 