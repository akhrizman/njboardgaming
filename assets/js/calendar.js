// === CONFIG ===
const API_KEY = 'AIzaSyBdiJrrTi2ggVpp4vy-xC2e_qwZ-mmBuWU';               // ← Replace
const eventsSection = document.getElementById('events');
const CALENDAR_ID = eventsSection.dataset.calendarId;
if (!CALENDAR_ID) {
  throw new Error('Calendar ID not found');
}
const MAX_EVENTS = 20;                             // How many to show
// ==============

const container = document.getElementById('events-container');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');

async function fetchEvents() {
  try {
    // Format dates for query (next year from now, adjust as needed)
    const timeMin = new Date().toISOString();
    const timeMax = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString();

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

      const body = document.createElement('div');
      body.className = 'event-body';

      // Time
      let timeStr = '';
      if (event.start.dateTime) {
        const start = new Date(event.start.dateTime);
        const end = event.end.dateTime ? new Date(event.end.dateTime) : null;
        timeStr = start.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        if (end) timeStr += ` – ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      } else if (event.start.date) {
        timeStr = new Date(event.start.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' (All day)';
      }
      const timeEl = document.createElement('div');
      timeEl.className = 'event-time';
      timeEl.textContent = timeStr;
      body.appendChild(timeEl);

      // Description
      if (event.description) {
        const desc = document.createElement('div');
        desc.className = 'event-desc';
        desc.innerHTML = event.description.replace(/\n/g, '<br>'); // Basic formatting
        body.appendChild(desc);
      }

      // Location
      if (event.location) {
        const loc = document.createElement('div');
        loc.className = 'event-location';
        loc.textContent = `📍 ${event.location}`;
        body.appendChild(loc);
      }

      card.appendChild(body);
      container.appendChild(card);
    });
  } catch (err) {
    loading.style.display = 'none';
    errorDiv.style.display = 'block';
    errorDiv.textContent = `Failed to load events: ${err.message}. Check API key, calendar ID, and that the calendar is public.`;
    console.error(err);
  }
}

// Run on page load
fetchEvents();