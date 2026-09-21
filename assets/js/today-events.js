// === CONFIG ===
const API_KEY = 'AIzaSyBdiJrrTi2ggVpp4vy-xC2e_qwZ-mmBuWU';               // ← Replace

const MAX_EVENTS_PER_CALENDAR = 10;
// ==============

const container = document.getElementById('events-container');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const featuredOnlyInput = document.getElementById('filter-featured-only');
const searchInput = document.getElementById('filter-events-search');
const resetFiltersBtn = document.getElementById('filter-events-reset');
const emptyFilterMsg = document.getElementById('events-filter-empty');
const todayDateLabel = document.getElementById('today-date-label');

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

function normalizeText(value) {
  return (value || '').toString().toLowerCase();
}

function applyFilters() {
  if (!container) return;

  const onlyFeatured = featuredOnlyInput ? featuredOnlyInput.checked : false;
  const searchTerm = searchInput ? normalizeText(searchInput.value).trim() : '';
  const cards = Array.from(container.querySelectorAll('.event-card'));
  let visibleCount = 0;

  cards.forEach((card) => {
    const isFeatured = card.classList.contains('event-card-featured');
    const haystack = normalizeText(card.dataset.searchText);
    const matchesFeatured = !onlyFeatured || isFeatured;
    const matchesSearch = !searchTerm || haystack.includes(searchTerm);
    const isVisible = matchesFeatured && matchesSearch;

    card.style.display = isVisible ? '' : 'none';
    if (isVisible) visibleCount += 1;
  });

  if (emptyFilterMsg) {
    emptyFilterMsg.style.display = visibleCount === 0 && cards.length > 0 ? 'block' : 'none';
  }
}

function setupEventFilters() {
  if (featuredOnlyInput) {
    featuredOnlyInput.addEventListener('change', applyFilters);
  }
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (featuredOnlyInput) featuredOnlyInput.checked = false;
      if (searchInput) searchInput.value = '';
      applyFilters();
    });
  }
}

/** Local start/end of "today" as ISO strings for the Calendar API */
function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    label: start.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };
}

function eventOccursToday(event, dayStart, dayEnd) {
  // Timed event
  if (event.start.dateTime) {
    const start = new Date(event.start.dateTime);
    const end = event.end?.dateTime ? new Date(event.end.dateTime) : start;
    return start <= dayEnd && end >= dayStart;
  }
  // All-day: start.date is YYYY-MM-DD (exclusive end in Google Calendar)
  if (event.start.date) {
    const start = new Date(event.start.date + 'T00:00:00');
    let end = event.end?.date
      ? new Date(event.end.date + 'T00:00:00')
      : new Date(start.getTime() + 86400000);
    // All-day end is exclusive; treat as covering [start, end)
    return start < dayEnd && end > dayStart;
  }
  return false;
}

function getEventSortKey(event) {
  if (event.start.dateTime) return new Date(event.start.dateTime).getTime();
  if (event.start.date) return new Date(event.start.date + 'T00:00:00').getTime();
  return 0;
}

async function fetchCalendarEvents(calendarId, timeMin, timeMax) {
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
    `key=${API_KEY}&` +
    `timeMin=${encodeURIComponent(timeMin)}&` +
    `timeMax=${encodeURIComponent(timeMax)}&` +
    `maxResults=${MAX_EVENTS_PER_CALENDAR}&` +
    `singleEvents=true&` +
    `orderBy=startTime`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API ${response.status} for ${calendarId}`);
  }
  const data = await response.json();
  return data.items || [];
}

function renderEventCard(event, countyName) {
  const card = document.createElement('div');
  card.className = 'event-card';
  if (event.id) card.id = event.id;

  const header = document.createElement('div');
  header.className = 'event-header';
  header.textContent = event.summary || '(No title)';
  card.appendChild(header);

  if (event.description && event.description.includes('njboardgames.com')) {
    header.classList.add('event-header-featured');
    card.classList.add('event-card-featured');
  }

  const body = document.createElement('div');
  body.className = 'event-body';

  // County badge
  if (countyName) {
    const countyEl = document.createElement('div');
    countyEl.className = 'event-county';
    countyEl.textContent = countyName;
    countyEl.style.cssText =
      'font-size:0.85rem;font-weight:600;color:#2563eb;margin-bottom:0.35rem;';
    body.appendChild(countyEl);
  }

  // Time (same logic as calendar.js)
  let timeStr = '';
  if (event.start.dateTime) {
    const start = new Date(event.start.dateTime);
    const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
    timeStr = start.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    if (end) {
      const sameDay = start.toDateString() === end.toDateString();
      timeStr += sameDay
        ? ` – ${end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
        : ` – ${end.toLocaleString([], {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}`;
    }
  } else if (event.start.date) {
    const start = new Date(event.start.date);
    const end = event.end?.date ? new Date(event.end.date) : null;
    if (end && start.toDateString() !== end.toDateString()) {
      timeStr =
        `${start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} – ` +
        `${end.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} (All day)`;
    } else {
      timeStr =
        start.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) +
        ' (All day)';
    }
  }

  const timeRow = document.createElement('div');
  timeRow.className = 'event-time-row';
  const timeEl = document.createElement('div');
  timeEl.className = 'event-time';
  timeEl.textContent = timeStr;
  timeRow.appendChild(timeEl);
  body.appendChild(timeRow);

  if (event.description) {
    const desc = document.createElement('div');
    desc.className = 'event-desc';
    desc.innerHTML = event.description.replace(/\n/g, '<br>');
    body.appendChild(desc);
  }

  if (event.location) {
    const loc = document.createElement('div');
    loc.className = 'event-location';
    const link = document.createElement('a');
    link.href = buildGoogleMapsUrl(event.location);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.cssText = 'text-decoration:none;color:inherit;display:inline-flex;align-items:center;gap:6px;';
    link.innerHTML = `<span>📍 ${event.location}</span>`;
    loc.appendChild(link);
    body.appendChild(loc);
  }

  card.dataset.searchText = [
    event.summary || '',
    event.description || '',
    event.location || '',
    countyName || '',
  ].join(' ');

  // Calendar / share icons (same as calendar.js)
  const calendarLinks = document.createElement('div');
  calendarLinks.className = 'calendar-links';

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

  const shareIcon = document.createElement('img');
  const supportsShare = !!navigator.share;
  shareIcon.src = supportsShare ? '/assets/images/share.png' : '/assets/images/copy-link.png';
  shareIcon.alt = supportsShare ? 'Share Event' : 'Copy Event Link';
  shareIcon.title = shareIcon.alt;
  shareIcon.className = 'calendar-icon';
  shareIcon.addEventListener('click', async (e) => {
    e.stopPropagation();
    const shareUrl = window.location.href.split('#')[0] + '#' + (event.id || '');
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.summary || 'Event',
          text: event.summary || '',
          url: shareUrl,
        });
      } catch (_) {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showCopyToast('Event link copied');
    }
  });
  calendarLinks.appendChild(shareIcon);

  if (calendarLinks.children.length > 0) body.appendChild(calendarLinks);
  card.appendChild(body);
  return card;
}

function downloadICS(event) {
  function formatICSDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
  let start = '', end = '';
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
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${event.summary || ''}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || ''}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
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
  setTimeout(() => toast.classList.remove('show'), 2000);
}

async function fetchAllTodayEvents() {
  const dataEl = document.getElementById('all-calendars-data');
  if (!dataEl) {
    throw new Error('Calendar list not found on page');
  }
  const calendars = JSON.parse(dataEl.textContent);
  const { timeMin, timeMax, label } = getTodayRange();
  if (todayDateLabel) todayDateLabel.textContent = label;

  const dayStart = new Date(timeMin);
  const dayEnd = new Date(timeMax);

  const results = await Promise.allSettled(
    calendars.map(async (c) => {
      const items = await fetchCalendarEvents(c.calendar_id, timeMin, timeMax);
      return items
        .filter((ev) => eventOccursToday(ev, dayStart, dayEnd))
        .map((ev) => ({ event: ev, countyName: c.name }));
    })
  );

  const all = [];
  let failCount = 0;
  results.forEach((r) => {
    if (r.status === 'fulfilled') {
      all.push(...r.value);
    } else {
      failCount += 1;
      console.warn('Calendar fetch failed:', r.reason);
    }
  });

  // Sort by start time
  all.sort((a, b) => getEventSortKey(a.event) - getEventSortKey(b.event));

  loading.style.display = 'none';

  if (all.length === 0) {
    container.innerHTML =
      '<p>No events found for today across the county calendars. Check back tomorrow or browse individual counties!</p>';
    if (failCount > 0) {
      errorDiv.style.display = 'block';
      errorDiv.textContent = `Note: ${failCount} calendar(s) could not be loaded.`;
    }
    return;
  }

  all.forEach(({ event, countyName }) => {
    container.appendChild(renderEventCard(event, countyName));
  });

  if (failCount > 0) {
    errorDiv.style.display = 'block';
    errorDiv.style.color = '#b45309';
    errorDiv.textContent = `Showing available events. ${failCount} calendar(s) failed to load.`;
  }

  applyFilters();
}

// Boot
setupEventFilters();
fetchAllTodayEvents().catch((err) => {
  loading.style.display = 'none';
  errorDiv.style.display = 'block';
  errorDiv.textContent = `Failed to load events: ${err.message}`;
  console.error(err);
});
