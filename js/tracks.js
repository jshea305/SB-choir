
let currentSeason = 'all';
    let currentVoice = 'all';
    let allTracks = [];

    async function loadTracks() {
      const container = document.getElementById('track-list');
      container.innerHTML = '<div class="no-results">Loading practice tracks...</div>';

      try {
        const response = await fetch('data/tracks.json'); 
        if (!response.ok) throw new Error('tracks.json not found');
        const rawData = await response.json();

        allTracks = rawData.map(item => {
          const filename = typeof item === 'string' ? item : item.name;
          const season = typeof item === 'object' && item.season ? item.season : 'Ordinary Time';
          
          return {
            name: filename,
            cleanName: filename.replace(/\.mp3$/i, ''),
            category: getCategory(filename),
            season: season,
            path: `./Media/${encodeURIComponent(filename)}`
          };
        });

        renderTracks(allTracks);
      } catch (err) {
        console.error('Error loading tracks:', err);
        container.innerHTML = '<div class="no-results" style="color:#dc2626;">Failed to load tracks. Ensure tracks.json exists in root.</div>';
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
      container.innerHTML = '';

      if (tracks.length === 0) {
        container.innerHTML = '<div class="no-results">No practice tracks match your search filters.</div>';
        return;
      }

      tracks.forEach(track => {
        const card = document.createElement('div');
        card.className = 'track-card';

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
            Your browser does not support the audio element.
          </audio>
        `;
        container.appendChild(card);
      });
    }

    function setSeason(season, buttonEl) {
      currentSeason = season;
      document.querySelectorAll('.season-btn').forEach(btn => btn.classList.remove('active'));
      buttonEl.classList.add('active');
      applyFilters();
    }

    function setVoice(voice, buttonEl) {
      currentVoice = voice;
      document.querySelectorAll('.voice-btn').forEach(btn => btn.classList.remove('active'));
      buttonEl.classList.add('active');
      applyFilters();
    }

    function applyFilters() {
      const query = document.getElementById('searchInput').value.toLowerCase().trim();

      const filtered = allTracks.filter(track => {
        const matchesSeason = (currentSeason === 'all' || track.season === currentSeason);
        const matchesVoice = (currentVoice === 'all' || track.category === currentVoice);
        const matchesQuery = track.cleanName.toLowerCase().includes(query);
        return matchesSeason && matchesVoice && matchesQuery;
      });

      renderTracks(filtered);
    }

    function onTrackPlay(audioEl) {
      document.querySelectorAll('audio').forEach(other => {
        if (other !== audioEl) other.pause();
      });
      document.querySelectorAll('.track-card').forEach(card => card.classList.remove('playing'));
      audioEl.closest('.track-card').classList.add('playing');
    }

    function onTrackPause(audioEl) {
      audioEl.closest('.track-card').classList.remove('playing');
    }

    window.addEventListener('DOMContentLoaded', loadTracks);

   
  async function loadChoirMedia() {
    try {
      const response = await fetch('media.json'); // or 'Media/media.json' depending on your path
      const data = await response.json();

      // Filter for the 2026-27 season
      const currentSeasonData = data.filter(item => item.season === "2026-27");

      const container = document.getElementById('media-container'); // ensure this ID matches your HTML container
      if (!container) return;
      
      container.innerHTML = '';

      currentSeasonData.forEach(song => {
        const card = document.createElement('div');
        card.className = 'song-card';
        
        card.innerHTML = `
          <h3>${song.title}</h3>
          <div class="audio-links">
            ${song.parts.soprano ? `<p><strong>Soprano:</strong> <audio controls src="Media/${song.parts.soprano}"></audio></p>` : ''}
            ${song.parts.alto ? `<p><strong>Alto:</strong> <audio controls src="Media/${song.parts.alto}"></audio></p>` : ''}
            ${song.parts.tenor ? `<p><strong>Tenor:</strong> <audio controls src="Media/${song.parts.tenor}"></audio></p>` : ''}
            ${song.parts.bass ? `<p><strong>Bass:</strong> <audio controls src="Media/${song.parts.bass}"></audio></p>` : ''}
          </div>
        `;
        container.appendChild(card);
      });
    } catch (err) {
      console.error('Error loading media JSON:', err);
    }
  }

  // Call the function once the page loads
  document.addEventListener('DOMContentLoaded', loadChoirMedia);
