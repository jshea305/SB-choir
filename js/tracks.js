// 1. Create a single shared audio instance globally for iOS WebKit
const globalAudio = new Audio();
let currentlyPlayingBtn = null;

// 2. Unlock the WebKit audio context on the user's very first tap on the page
function unlockIOSAudio() {
    globalAudio.play().then(() => {
        globalAudio.pause(); // Immediately pause after unlocking
    }).catch(() => {});
    
    document.removeEventListener('touchstart', unlockIOSAudio);
    document.removeEventListener('click', unlockIOSAudio);
}

document.addEventListener('touchstart', unlockIOSAudio);
document.addEventListener('click', unlockIOSAudio);

// 3. Play / Pause toggle function routing through globalAudio
function playTrack(trackUrl, buttonEl) {
    if (!trackUrl) return;

    // Convert relative path if needed
    const fullUrl = trackUrl.startsWith('.') || trackUrl.startsWith('/') 
        ? trackUrl 
        : `./Media/${encodeURIComponent(trackUrl)}`;

    // If tapping the active track, toggle play/pause
    if (globalAudio.src.endsWith(encodeURIComponent(trackUrl)) || globalAudio.src === fullUrl) {
        if (!globalAudio.paused) {
            globalAudio.pause();
            if (buttonEl) buttonEl.innerText = buttonEl.innerText.replace('⏸', '▶');
            return;
        }
    }

    // Reset previous button UI if another track was playing
    if (currentlyPlayingBtn && currentlyPlayingBtn !== buttonEl) {
        currentlyPlayingBtn.innerText = currentlyPlayingBtn.innerText.replace('⏸', '▶');
        currentlyPlayingBtn.classList.remove('playing');
    }

    // Assign source and stream via globalAudio
    globalAudio.src = fullUrl;
    globalAudio.load();
    
    const playPromise = globalAudio.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            currentlyPlayingBtn = buttonEl;
            if (buttonEl) {
                buttonEl.innerText = buttonEl.innerText.replace('▶', '⏸');
                buttonEl.classList.add('playing');
            }
        }).catch(error => console.error("iOS Playback error:", error));
    }
}

// Global listener to clean up UI when track finishes playing
globalAudio.addEventListener('ended', () => {
    if (currentlyPlayingBtn) {
        currentlyPlayingBtn.innerText = currentlyPlayingBtn.innerText.replace('⏸', '▶');
        currentlyPlayingBtn.classList.remove('playing');
        currentlyPlayingBtn = null;
    }
});


let currentSeason = 'all';
let currentVoice = 'all';
let allTracks = [];

async function loadTracks() {
  const currentContainer = document.getElementById('current-tracks-list');
  const archiveContainer = document.getElementById('archive-tracks-list');

  if (currentContainer) {
    currentContainer.innerHTML = '<div class="no-results">Loading practice tracks...</div>';
  }

  try {
    const response = await fetch('data/tracks.json');
    if (!response.ok) throw new Error('tracks.json not found');
    const rawData = await response.json();

    allTracks = rawData.map(item => {
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

    const currentTracks = allTracks.filter(t => {
      const s = (t.season || '').toString();
      return s === 'current';
    });
    renderTracksToContainer(currentTracks, 'current-tracks-list');

    applyFilters();

  } catch (err) {
    console.error('Error loading tracks:', err);
    if (currentContainer) {
      currentContainer.innerHTML = '<div class="no-results" style="color:#dc2626;">Failed to load tracks. Ensure tracks.json exists in data directory.</div>';
    }
  }
}

function getCategory(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('soprano') || lower.includes('sop2') || lower.includes('sop')) return 'soprano';
  if (lower.includes('alto')) return 'alto';
  if (lower.includes('tenor')) return 'tenor';
  if (lower.includes('bass')) return 'bass';
  return 'full';
}

function renderTracksToContainer(tracks, containerId) {
  const container = document.getElementById(containerId);
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
          ${parts.soprano ? renderAudioRow('Soprano', parts.soprano, 'soprano') : ''}
          ${parts.alto ? renderAudioRow('Alto', parts.alto, 'alto') : ''}
          ${parts.tenor ? renderAudioRow('Tenor', parts.tenor, 'tenor') : ''}
          ${parts.bass ? renderAudioRow('Bass', parts.bass, 'bass') : ''}
          ${parts.full ? renderAudioRow('Full / Harm', parts.full, 'full') : ''}
        </div>
      `;
    } else {
      card.innerHTML = `
        <div class="track-header">
          <span class="track-title">${track.cleanName}</span>
          <div class="tag-container">
            <span class="tag tag-season">${track.season}</span>
            <span class="tag tag-${track.category}">${track.category}</span>
          </div>
        </div>
        <button class="voice-play-btn tag-${track.category}" onclick="playTrack('${track.path}', this)" style="padding: 8px 16px; font-weight: 600; cursor: pointer; border-radius: 4px; border: none;">
          ▶ Play Track
        </button>
      `;
    }

    container.appendChild(card);
  });
}

function renderAudioRow(label, filename, typeClass) {
  return `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span class="tag tag-${typeClass}" style="min-width: 80px; text-align: center;">${label}</span>
      <button class="voice-play-btn tag-${typeClass}" onclick="playTrack('${filename}', this)" style="flex: 1; padding: 8px 12px; text-align: left; font-weight: 600; cursor: pointer; border-radius: 4px; border: none;">
        ▶ Play ${label}
      </button>
    </div>
  `;
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

  const archiveTracks = allTracks.filter(track => {
    const s = (track.season || '').toString();
    const isCurrent = s.includes('2026') || s === 'current';

    if (isCurrent) return false;

    let matchesSeason = false;
    if (currentSeason === 'all') {
      matchesSeason = true;
    } else {
      matchesSeason = (s === currentSeason);
    }

    let matchesVoice = true;
    if (currentVoice !== 'all') {
      matchesVoice = track.isGrouped 
        ? Boolean(track.parts && track.parts[currentVoice]) 
        : (track.category === currentVoice);
    }

    let matchesQuery = true;
    if (query) {
      matchesQuery = track.isGrouped
        ? ((track.title && track.title.toLowerCase().includes(query)) || (track.composer && track.composer.toLowerCase().includes(query)))
        : (track.cleanName && track.cleanName.toLowerCase().includes(query));
    }

    return matchesSeason && matchesVoice && matchesQuery;
  });

  renderTracksToContainer(archiveTracks, 'archive-tracks-list');
}

function checkUrlSearchQuery() {
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  if (searchParam) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = searchParam;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  checkUrlSearchQuery();
  loadTracks();
});

function hidePastEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  document.querySelectorAll('[data-date]').forEach(item => {
    const eventDateStr = item.getAttribute('data-date');
    if (!eventDateStr) return;

    const eventDate = new Date(eventDateStr + 'T00:00:00');

    const dayAfterEvent = new Date(eventDate);
    dayAfterEvent.setDate(dayAfterEvent.getDate() + 1);

    if (today >= dayAfterEvent) {
      item.style.display = 'none';
    }
  });
}

window.addEventListener('DOMContentLoaded', hidePastEvents);
