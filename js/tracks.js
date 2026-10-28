let currentSeason = 'all';
let currentVoice = 'all';
let allTracks = [];

async function loadTracks() {
  const container = document.getElementById('track-list');
  if (!container) return;

  container.innerHTML = '<div class="no-results">Loading practice tracks...</div>';

  try {
    const response = await fetch('data/tracks.json');
    if (!response.ok) throw new Error('tracks.json not found');
    const rawData = await response.json();

    allTracks = rawData.map(item => {
      // If item is a grouped song with a title
      if (typeof item === 'object' && item.title) {
        return {
          isGrouped: true,
          title: item.title,
          composer: item.composer || '',
          voicing: item.voicing || '',
          liturgicalUse: item.liturgicalUse || '',
          season: item.season || 'Ordinary Time',
          youtubeUrl: item.youtubeUrl || null,
          parts: item.parts || {}
        };
      }

      // Legacy flat track structure
      const filename = typeof item === 'string' ? item : (item.name || 'Untitled');
      const season = typeof item === 'object' && item.season ? item.season : 'Ordinary Time';

      return {
        isGrouped: false,
        name: filename,
        cleanName: filename.replace(/\.mp3$/i, ''),
        category: getCategory(filename),
        season: season,
        path: `./Media/${encodeURIComponent(filename)}`
      };
    });

    applyFilters();
  } catch (err) {
    console.error('Error loading tracks:', err);
    container.innerHTML = '<div class="no-results" style="color:#dc2626;">Failed to load tracks. Ensure tracks.json exists in data directory.</div>';
  }
}

function getCategory(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('soprano') || lower.includes('sop2')) return 'soprano';
  if (lower.includes('alto')) return 'alto';
  if (lower.includes('tenor')) return 'tenor';
  if (lower.includes('bass')) return 'bass';
  return 'full';
}

function renderTracks(tracks) {
  const container = document.getElementById('track-list');
  if (!container) return;

  container.innerHTML = '';

  if (tracks.length === 0) {
    container.innerHTML = '<div class="no-results">No practice tracks match your search filters.</div>';
    return;
  }

  tracks.forEach(track => {
    const card = document.createElement('div');
    card.className = 'track-card';

    if (track.isGrouped) {
      // Render Grouped Song with Metadata & Voice Parts
      const parts = track.parts;
      card.innerHTML = `
        <div class="track-header" style="flex-direction: column; align-items: flex-start; gap: 4px;">
          <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
            <span class="track-title" style="font-size: 1.2rem; font-weight: 700;">${track.title}</span>
            <div class="tag-container">
              <span class="tag tag-season">${track.season}</span>
              ${track.voicing ? `<span class="tag">${track.voicing}</span>` : ''}
            </div>
          </div>
          ${track.composer ? `<div style="font-size: 0.85rem; color: #64748b; font-style: italic;">by ${track.composer}</div>` : ''}
        </div>

        ${track.youtubeUrl ? `
          <div style="margin: 10px 0;">
            <a href="${track.youtubeUrl}" target="_blank" rel="noopener" class="link-btn youtube-btn" style="background: #ff0000; color: #fff; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-weight: 600; font-size: 0.85rem; display: inline-block;">
              ▶ Listen to Full Recording on YouTube
            </a>
          </div>
        ` : ''}

        <div class="parts-list" style="display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
          ${parts.soprano ? `
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="tag tag-soprano" style="min-width: 70px; text-align: center;">Soprano</span>
              <audio controls preload="none" onplay="onTrackPlay(this)" onpause="onTrackPause(this)" style="flex: 1;">
                <source src="./Media/${encodeURIComponent(parts.soprano)}" type="audio/mpeg">
              </audio>
            </div>
          ` : ''}

          ${parts.alto ? `
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="tag tag-alto" style="min-width: 70px; text-align: center;">Alto</span>
              <audio controls preload="none" onplay="onTrackPlay(this)" onpause="onTrackPause(this)" style="flex: 1;">
                <source src="./Media/${encodeURIComponent(parts.alto)}" type="audio/mpeg">
              </audio>
            </div>
          ` : ''}

          ${parts.tenor ? `
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="tag tag-tenor" style="min-width: 70px; text-align: center;">Tenor</span>
              <audio controls preload="none" onplay="onTrackPlay(this)" onpause="onTrackPause(this)" style="flex: 1;">
                <source src="./Media/${encodeURIComponent(parts.tenor)}" type="audio/mpeg">
              </audio>
            </div>
          ` : ''}

          ${parts.bass ? `
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="tag tag-bass" style="min-width: 70px; text-align: center;">Bass</span>
              <audio controls preload="none" onplay="onTrackPlay(this)" onpause="onTrackPause(this)" style="flex: 1;">
                <source src="./Media/${encodeURIComponent(parts.bass)}" type="audio/mpeg">
              </audio>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      // Legacy Single Track Rendering
      card.innerHTML = `
        <div class="track-header">
          <span class="track-title">${track.cleanName}</span>
          <div class="tag-container">
            <span class="tag tag-season">${track.season}</span>
            <span class="tag tag-${track.category}">${track.category}</span>
          </div>
        </div>
        <audio controls preload="none" onplay="onTrackPlay(this)" onpause="onTrackPause(this)">
          <source src="${track.path}" type="audio/mpeg">
        </audio>
      `;
    }

    container.appendChild(card);
  });
}

function setSeason(season, buttonEl) {
  currentSeason = season;
  document.querySelectorAll('.season-btn').forEach(btn => btn.classList.remove('active'));
  if (buttonEl) buttonEl.classList.add('active');
  applyFilters();
}

function setVoice(voice, buttonEl) {
  currentVoice = voice;
  document.querySelectorAll('.voice-btn').forEach(btn => btn.classList.remove('active'));
  if (buttonEl) buttonEl.classList.add('active');
  applyFilters();
}

function applyFilters() {
  const searchInput = document.getElementById('searchInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  // Active Liturgical Season key (e.g. 2026-27 or Ordinary Time)
  const ACTIVE_SEASON = '2026-27';

  const filtered = allTracks.filter(track => {
    let matchesSeason = false;
    
    if (currentSeason === 'all') {
      matchesSeason = true;
    } else if (currentSeason === 'current') {
      matchesSeason = (track.season === ACTIVE_SEASON || track.season === 'Ordinary Time');
    } else {
      matchesSeason = (track.season === currentSeason);
    }

    let matchesVoice = true;
    if (currentVoice !== 'all') {
      if (track.isGrouped) {
        matchesVoice = Boolean(track.parts[currentVoice]);
      } else {
        matchesVoice = (track.category === currentVoice);
      }
    }

    let matchesQuery = true;
    if (query) {
      if (track.isGrouped) {
        matchesQuery = track.title.toLowerCase().includes(query) || track.composer.toLowerCase().includes(query);
      } else {
        matchesQuery = track.cleanName.toLowerCase().includes(query);
      }
    }

    return matchesSeason && matchesVoice && matchesQuery;
  });

  renderTracks(filtered);
}
window.addEventListener('DOMContentLoaded', () => {
  loadTracks();

  document.querySelectorAll('.season-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const seasonValue = e.target.getAttribute('onclick')
        ? e.target.getAttribute('onclick').match(/'([^']+)'/)?.[1]
        : e.target.getAttribute('data-season');

      setSeason(seasonValue || 'all', e.target);
    });
  });
});
