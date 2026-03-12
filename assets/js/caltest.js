// === CONFIG ===
const API_KEY = 'AIzaSyBdiJrrTi2ggVpp4vy-xC2e_qwZ-mmBuWU';               // ← Replace
const eventsSection = document.getElementById('events');
const CALENDAR_ID = eventsSection.dataset.calendarId;
if (!CALENDAR_ID) {
  throw new Error('Calendar ID not found');
}
const MAX_EVENTS = 30; // How many to show
// ==============

const container = document.getElementById('events-container');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');

function buildGoogleCalendarUrl(event) {
  const base = 'https://www.google.com/calendar/render?action=TEMPLATE';

  function formatDateForGoogle(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    // Convert to YYYYMMDDTHHMMSSZ (UTC, no dashes/colons)
    return date.toISOString().replace(/-|:|\.\d{3}/g, '');
  }

  let dates = '';
  if (event.start.dateTime && event.end.dateTime) {
    // Timed event
    const start = formatDateForGoogle(event.start.dateTime);
    const end = formatDateForGoogle(event.end.dateTime);
    dates = `&dates=${start}/${end}`;
  } else if (event.start.date) {
    // All-day event (use date only, extend end by 1 day if missing)
    const startDate = formatDateForGoogle(event.start.date).slice(0, 8); // YYYYMMDD
    let endDate = startDate;
    if (event.end.date) {
      endDate = formatDateForGoogle(event.end.date).slice(0, 8);
    } else {
      // Single all-day → make it span to next day
      const nextDay = new Date(event.start.date);
      nextDay.setDate(nextDay.getDate() + 1);
      endDate = nextDay.toISOString().slice(0, 10).replace(/-/g, '');
    }
    dates = `&dates=${startDate}/${endDate}`;
  }

  const params = new URLSearchParams({
    text: event.summary || 'Untitled Event',
    details: event.description || '',
    location: event.location || '',
    // ctz: 'America/New_York',  // Optional: add if events are in a specific timezone and not UTC
  });

  let url = base;
  if (dates) url += dates;
  const paramStr = params.toString();
  if (paramStr) url += (dates ? '&' : '?') + paramStr;

  return url;
}

async function fetchEvents() {
  try {
    const timeMin = new Date().toISOString();
    const monthsIntoTheFutureAttr = eventsSection.dataset.monthsIntoFuture;
    const monthsIntoTheFuture = monthsIntoTheFutureAttr ? parseInt(monthsIntoTheFutureAttr, 10) : 1;

    // Format dates for query (n months from now)
    const timeMaxDate = new Date();
	timeMaxDate.setMonth(timeMaxDate.getMonth() + monthsIntoTheFuture);
	const timeMax = timeMaxDate.toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?` +
                `key=${API_KEY}&` +
                `timeMin=${timeMin}&` +
                `timeMax=${timeMax}&` +
                `maxResults=${MAX_EVENTS}&` +
                `singleEvents=true&` +          // Expand recurring events
                `orderBy=startTime`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    loading.style.display = 'none';

    if (!data.items || data.items.length === 0) {
      container.innerHTML = '<p>No upcoming events found.</p>';
      return;
    }

data.items.forEach(event => {
  const card = document.createElement('div');
  card.className = 'event-card';

  // Title
  const header = document.createElement('div');
  header.className = 'event-header';
  header.textContent = event.summary || '(No title)';
  card.appendChild(header);

  // Featured check (unchanged)
  if (event.description && event.description.includes("njboardgames.com")) {
    header.classList.add("event-header-featured");
    card.classList.add('event-card-featured');
  }

  const body = document.createElement('div');
  body.className = 'event-body';

  // Time (unchanged)
  let timeStr = '';
  if (event.start.dateTime) {
    const start = new Date(event.start.dateTime);
    const end = event.end.dateTime ? new Date(event.end.dateTime) : null;
    timeStr = start.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    if (end) {
      const sameDay = start.toDateString() === end.toDateString();
      if (sameDay) {
        timeStr += ` – ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      } else {
        timeStr += ` – ${end.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
      }
    }
  } else if (event.start.date) {
    const start = new Date(event.start.date);
    const end = event.end.date ? new Date(event.end.date) : null;
    if (end && start.toDateString() !== end.toDateString()) {
      timeStr = `${start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} – ` +
                `${end.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} (All day)`;
    } else {
      timeStr = start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' (All day)';
    }
  }
  const timeEl = document.createElement('div');
  timeEl.className = 'event-time';
  timeEl.textContent = timeStr;
  body.appendChild(timeEl);

  // Description
  if (event.description) {
    const desc = document.createElement('div');
    desc.className = 'event-desc';
    desc.innerHTML = event.description.replace(/\n/g, '<br>');
    body.appendChild(desc);
  }

  // Location
  if (event.location) {
    const loc = document.createElement('div');
    loc.className = 'event-location';
    loc.textContent = `Location: ${event.location}`;
    body.appendChild(loc);
  }

  card.appendChild(body);

  /*
  // === NEW: Make the whole card clickable ===
  const link = document.createElement('a');
  link.href = buildGoogleCalendarUrl(event);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.textDecoration = 'none';
  link.style.color = 'inherit';
  link.style.display = 'block';           // Ensures full card is clickable
  link.style.height = '100%';

  link.appendChild(card);                  // Wrap card inside link
  */

    // NEW: Add to Google Calendar button
    const addButton = document.createElement('a');
    addButton.href = buildGoogleCalendarUrl(event);
    addButton.target = '_blank';
    addButton.rel = 'noopener noreferrer';
    addButton.className = 'add-to-google-btn';  // For styling
    addButton.textContent = '📅 Add to Google Calendar';
    addButton.style.display = 'inline-block';
    addButton.style.marginTop = '12px';  // Space above button
    addButton.style.padding = '8px 16px';
    addButton.style.backgroundColor = '#4285f4';  // Google blue
    addButton.style.color = 'white';
    addButton.style.textDecoration = 'none';
    addButton.style.borderRadius = '4px';
    addButton.style.fontWeight = 'bold';
    addButton.style.fontSize = '14px';
    addButton.style.cursor = 'pointer';

    const buttonWrapper = document.createElement('div');
    buttonWrapper.style.textAlign = 'center';  // Center it, or 'left'/'right'
    buttonWrapper.appendChild(addButton);

    card.appendChild(buttonWrapper);

  container.appendChild(card);             // Append link (not card)
});
  } catch (err) {
    loading.style.display = 'none';
    errorDiv.style.display = 'block';
    errorDiv.textContent = `Failed to load events: ${err.message}. Check API key, calendar ID, and that the calendar is public.`;
    console.error(err);
  }
}

/** If the URL has a hash (e.g. #oldBridgeLibrary), scroll that element into view. Call after DOM changes (e.g. calendar load) to avoid layout shift. */
function scrollToHash() {
  var hash = window.location.hash;
  if (!hash) return;
  var el = document.getElementById(hash.slice(1));
  if (el) {
    requestAnimationFrame(function () {
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }
}

// Run on page load
fetchEvents().then(scrollToHash).catch(function () { scrollToHash(); });
