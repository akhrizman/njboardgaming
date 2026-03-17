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

const ENABLE_ICS_DOWNLOAD = true;
const ENABLE_GOOGLE_CAL_LINK = true;

function buildGoogleMapsUrl(location) {
  if (!location) return '#'; // Fallback
  // Encode the location string for URL safety
  const encoded = encodeURIComponent(location.trim());
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

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

      // Add event ID (instance ID for recurring events)
      if (event.id) {
        card.id = event.id;
      }

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
        timeStr = start.toLocaleString([], {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
        if (end) {
          const sameDay = start.toDateString() === end.toDateString();
          if (sameDay) {
            timeStr += ` – ${end.toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}`;
          } else {
            timeStr += ` – ${end.toLocaleString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}`;
          }
        }
      } else if (event.start.date) {
        const start = new Date(event.start.date);
        const end = event.end.date ? new Date(event.end.date) : null;
        if (end && start.toDateString() !== end.toDateString()) {
          timeStr = `${start.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'})} – ` +
              `${end.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'})} (All day)`;
        } else {
          timeStr = start.toLocaleDateString([], {weekday: 'short', month: 'short', day: 'numeric'}) + ' (All day)';
        }
      }

      const timeRow = document.createElement('div');
      timeRow.className = 'event-time-row';

      const timeEl = document.createElement('div');
      timeEl.className = 'event-time';
      timeEl.textContent = timeStr;

      timeRow.appendChild(timeEl);

      body.appendChild(timeRow);

      // Description
      if (event.description) {
        const desc = document.createElement('div');
        desc.className = 'event-desc';
        desc.innerHTML = event.description.replace(/\n/g, '<br>');
        body.appendChild(desc);
      }

      // Location – now clickable
      if (event.location) {
        const loc = document.createElement('div');
        loc.className = 'event-location';

        // Add pin emoji + clickable link
        const link = document.createElement('a');
        link.href = buildGoogleMapsUrl(event.location);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.textDecoration = 'none'; // Optional: remove underline, or style in CSS
        link.style.color = 'inherit';       // Keep original text color
        link.style.display = 'inline-flex';
        link.style.alignItems = 'center';
        link.style.gap = '6px';             // Space between emoji and text

        const text = document.createElement('span');
        text.textContent = '📍 ' + event.location;
        link.appendChild(text);

        loc.appendChild(link);
        body.appendChild(loc);
      }

      // Calendar Links Footer
      const calendarLinks = document.createElement('div');
      calendarLinks.className = 'calendar-links';

      // Google Calendar icon
      if (ENABLE_GOOGLE_CAL_LINK) {
        const googleLink = document.createElement('img');
        googleLink.src = '/assets/images/gCalLogo.png';
        googleLink.alt = 'Add to Google Calendar';
        googleLink.title = 'Add to Google Calendar';
        googleLink.className = 'calendar-icon';

        googleLink.addEventListener('click', (e) => {
          e.stopPropagation();
          window.open(buildGoogleCalendarUrl(event), '_blank');
        });

        calendarLinks.appendChild(googleLink);
      }

      // ICS download icon (Apple/Generic calendar)
      if (ENABLE_ICS_DOWNLOAD) {
        const icsLink = document.createElement('img');
        icsLink.src = '/assets/images/iCalLogo.png';
        icsLink.alt = 'Download Calendar Event';
        icsLink.title = 'Download Calendar Event';
        icsLink.className = 'calendar-icon';

        icsLink.addEventListener('click', (e) => {
          e.stopPropagation();
          downloadICS(event);
        });

        calendarLinks.appendChild(icsLink);
      }

      // Share button (mobile devices) with fallback for desktops
      const shareIcon = document.createElement('img');
      const supportsShare = !!navigator.share;

      shareIcon.src = supportsShare
          ? '/assets/images/share.png'       // mobile icon
          : '/assets/images/copy-link.png';  // desktop icon

      shareIcon.alt = supportsShare ? 'Share Event' : 'Copy Event Link';
      shareIcon.title = supportsShare ? 'Share Event' : 'Copy Event Link';

      shareIcon.className = 'calendar-icon';

      shareIcon.addEventListener('click', async (e) => {
        e.stopPropagation();

        const shareUrl = window.location.href.split('#')[0] + '#' + (event.id || '');

        if (navigator.share) {
          try {
            await navigator.share({
              title: event.summary || 'Event',
              text: event.summary || '',
              url: shareUrl
            });
          } catch (err) {
            console.log('Share cancelled');
          }
        } else {
          await navigator.clipboard.writeText(shareUrl);
          showCopyToast('Event link copied');
          // showCopyToast(`"${event.summary}" link copied`);
        }
      });

      calendarLinks.appendChild(shareIcon);

      if (calendarLinks.children.length > 0) {
        body.appendChild(calendarLinks);
      }

      card.appendChild(body);

      container.appendChild(card);             // Append link (not card)
    });
  } catch (err) {
    loading.style.display = 'none';
    errorDiv.style.display = 'block';
    errorDiv.textContent = `Failed to load events: ${err.message}. Check API key, calendar ID, and that the calendar is public.`;
    console.error(err);
  }
}

function downloadICS(event) {

  function formatICSDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  let start = '';
  let end = '';

  if (event.start.dateTime) {
    start = formatICSDate(event.start.dateTime);
    end = formatICSDate(event.end?.dateTime);
  } else if (event.start.date) {
    const s = new Date(event.start.date);
    const e = event.end?.date ? new Date(event.end.date) : new Date(s);

    if (!event.end?.date) e.setDate(e.getDate() + 1);

    start = s.toISOString().slice(0, 10).replace(/-/g, '');
    end = e.toISOString().slice(0, 10).replace(/-/g, '');
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${event.summary || ''}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || ''}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\n");

  const blob = new Blob([ics], {type: 'text/calendar'});
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${(event.summary || 'event').replace(/[^a-z0-9]/gi, '_')}.ics`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function showCopyToast(message = 'Link copied') {
  const toast = document.getElementById('copy-toast');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

/** If the URL has a hash (e.g. #oldBridgeLibrary), scroll that element into view. Call after DOM changes (e.g. calendar load) to avoid layout shift. */
function scrollToHash() {
  var hash = window.location.hash;
  if (!hash) return;
  var el = document.getElementById(hash.slice(1));
  if (el) {
    requestAnimationFrame(function () {
      el.scrollIntoView({behavior: 'instant', block: 'start'});
    });
  }
}

// Run on page load
fetchEvents().then(scrollToHash).catch(function () {
  scrollToHash();
});
