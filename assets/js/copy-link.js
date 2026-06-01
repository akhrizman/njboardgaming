document.querySelector('.copy-link').addEventListener('click', function(e) {
    e.preventDefault(); // Prevent default navigation

    const url = this.getAttribute('href');

    navigator.clipboard.writeText(url).then(() => {
    const feedback = document.getElementById('feedback');
    feedback.textContent = '✅ Link copied to clipboard!';

    // Reset message after 3 seconds
    setTimeout(() => {
        feedback.textContent = '';
    }, 3000);
    }).catch(err => {
    console.error('Failed to copy: ', err);
    alert('Failed to copy link');
    });
});
