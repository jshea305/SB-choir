let allTracks = [];
let currentSeason = 'all';
let currentVoice = 'all';

// Helper to get display title regardless of MP3 or YouTube track
function getTrackTitle(track) {
  if (track.title) return track.title;
  if (track.name) return track.name.replace(/\.mp3$/i, '').trim();
  return '';
}

async function loadAndRenderTracks() {
  try {
    const response = await fetch('./data/tracks.json?v=' + Date.now());
    allTracks = await response.json();

    // 1. Sort all tracks alphabetically
   allTracks.sort((a, b) => getTrackTitle(a).localeCompare(getTrackTitle(b), undefined, { sensitivity: 'base' }));

   // Add this log line right above line 21:
console.log("Loaded tracks array:", allTracks); 
    // 2. Separate Current Rehearsal vs Archived Library
    const currentTracks = allTracks.filter(t => t.status === 'current');
    renderCurrentSection(currentTracks);

    // 3. Initial Render of Archive
    applyFilters();

  } catch (err) {
    console.error('Failed to load tracks.json:', err);
  }
}

function renderCurrentSection(tracks) {
  const header = `<h2 style="text-align: center; margin: 20px 0 10px 0; font-size: 1.3rem; font-weight: 600; color: #1e293b;">Current Songs to work on:</h2>`;
  const container = document.getElementById('current-tracks-list');
  if (!container) return;

  if (tracks.length === 0) {
    container.innerHTML = `<p style="padding: 14px; color: #6b7280; font-size: 0.9rem;">No active practice tracks set for this week.</p>`;
    return;
  }

 container.innerHTML = header + tracks.map(track => renderTrackRow(track)).join('');
}

function renderArchiveSection(tracks) {
  const container = document.getElementById('archive-tracks-list');
  if (!container) return;

  if (tracks.length === 0) {
    container.innerHTML = `<p style="padding: 14px; color: #6b7280; font-size: 0.9rem;">No archived tracks match your criteria.</p>`;
    return;
  }

  container.innerHTML = tracks.map(track => renderTrackRow(track)).join('');
}

function renderTrackRow(track) {
  const title = getTrackTitle(track);
  const fileLabel = track.name ? ` (${track.name.replace(/\.mp3$/i, '')})` : '';
  let actionButton = '';

  if (track.youtubeUrl) {
    actionButton = `
      <a href="${track.youtubeUrl}" target="_blank" rel="noopener noreferrer" 
         style="background: #dc2626; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
        ▶ YouTube
      </a>
    `;
  } else if (track.name) {
    actionButton = `
      <button onclick="playAudio('${track.name}')" 
              style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.85rem;">
        ▶ Play
      </button>
    `;
  }

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid #f3f4f6;">
      <div>
       <span style="font-weight: 600; color: #1f2937;">${title}${fileLabel}</span>
        ${track.season ? `<span style="font-size: 0.75rem; font-weight: 700; color: #6b7280; margin-left: 8px; text-transform: uppercase;">(${track.season})</span>` : ''}
      </div>
      <div>
        ${actionButton}
      </div>
    </div>
  `;
}

// Global Handlers bound to window for HTML onclick attributes
window.setSeason = function(season, btnElement) {
  currentSeason = season;
  document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  applyFilters();
};

window.setVoice = function(voice, btnElement) {
  currentVoice = voice;
  document.querySelectorAll('.voice-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  applyFilters();
};

window.applyFilters = function() {
  const searchVal = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

  const filtered = allTracks.filter(track => {
    if (track.status === 'current') return false; // Archive section hides active lineup tracks

    const title = getTrackTitle(track).toLowerCase();
    const season = (track.season || '').toLowerCase();
    const filename = (track.name || '').toLowerCase();

    // 1. Text Search
    const matchesSearch = !searchVal || title.includes(searchVal) || filename.includes(searchVal);

    // 2. Season Filter
    let matchesSeason = true;
    if (currentSeason !== 'all') {
      const targetSeason = currentSeason.toLowerCase().replace('/', '');
      const trackSeasonClean = season.replace(/\s+/g, '').replace('/', '');
      matchesSeason = trackSeasonClean.includes(targetSeason);
    }

    // 3. Voice Filter
    let matchesVoice = true;
    if (currentVoice !== 'all') {
      if (currentVoice === 'full') {
        matchesVoice = !!track.youtubeUrl || filename.includes('full') || filename.includes('instrumental');
      } else {
        matchesVoice = filename.includes(currentVoice.toLowerCase());
      }
    }

    return matchesSearch && matchesSeason && matchesVoice;
  });

  renderArchiveSection(filtered);
};

// HTML5 Audio playback helper
let activeAudio = null;
window.playAudio = function(fileName) {
  if (activeAudio) {
    activeAudio.pause();
  }
  activeAudio = new Audio('./Media/' + encodeURIComponent(fileName));
  activeAudio.play().catch(e => console.error("Audio playback error:", e));
};

document.addEventListener('DOMContentLoaded', loadAndRenderTracks);
