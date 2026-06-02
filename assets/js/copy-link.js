document.addEventListener('DOMContentLoaded', function() {
  // Target all 🔗 links
  const copyLinks = document.querySelectorAll('a[href^="#"]');

  copyLinks.forEach(link => {
    // Only process links that have the copy emoji or are event anchors
    if (link.textContent.includes('🔗')) {

      link.style.cursor = 'pointer';

      link.addEventListener('click', function(e) {
        e.preventDefault();

        // Build the full URL to this specific event
        const anchor = this.getAttribute('href'); // e.g. "#oldBridgeLibrary"
        const fullUrl = window.location.origin + window.location.pathname + anchor;

        navigator.clipboard.writeText(fullUrl).then(() => {
          // Visual feedback
          const originalText = this.textContent;
          this.textContent = '✅ Copied!';

          setTimeout(() => {
            this.textContent = originalText;
          }, 2000);

        }).catch(err => {
          console.error('Copy failed:', err);
          alert('Failed to copy link. Please try again.');
        });
      });
    }
  });
});
