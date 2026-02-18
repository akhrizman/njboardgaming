/**
 * Ensures links to njboardgames.com open in the same window.
 * Strips target="_blank" from same-site links (including relative paths and anchors).
 */
(function () {
  function isSameSite(href) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) return true;
    try {
      const a = document.createElement('a');
      a.href = href;
      return !a.hostname || a.hostname === 'njboardgames.com' || a.hostname === 'www.njboardgames.com' || a.hostname === window.location.hostname;
    } catch {
      return true;
    }
  }

  function fixLinks(root) {
    (root || document).querySelectorAll('a[target="_blank"]').forEach(function (a) {
      const href = a.getAttribute('href');
      if (href && isSameSite(href)) {
        a.removeAttribute('target');
      }
    });
  }

  function init() {
    fixLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-run when calendar.js adds event cards (async content)
  const eventsContainer = document.getElementById('events-container');
  if (eventsContainer && typeof MutationObserver !== 'undefined') {
    const obs = new MutationObserver(function () {
      fixLinks(eventsContainer);
    });
    obs.observe(eventsContainer, { childList: true, subtree: true });
  }
})();
