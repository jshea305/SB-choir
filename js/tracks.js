// Helper to get display title regardless of whether track is MP3 or YouTube
function getTrackTitle(track) {
  if (track.title) return track.title;
  if (track.name) return track.name.replace(/\.mp3$/i, '').trim();
  return '';
}

async function loadAndRenderTracks() {
  try {
    const response = await fetch('./tracks.json');
    const tracks = await response.json();

    // 1. Sort all tracks alphabetically by title
    tracks.sort((a, b) => getTrackTitle(a).localeCompare(getTrackTitle(b)));

    // 2. Separate into Current Rehearsal vs Archived Library
    const currentTracks = tracks.filter(t => t.status === 'current');
    const archivedTracks = tracks.filter(t => t.status === 'archived');

    // 3. Render Top "Current Rehearsal" Block
    renderCurrentSection(currentTracks);

    // 4. Render Main Archive Library
    renderArchiveSection(archivedTracks);

  } catch (err) {
    console.error('Failed to load tracks.json:', err);
  }
}

// Render helper for line items (handles both MP3 play buttons and YouTube links)
function renderTrackRow(track) {
  const title = getTrackTitle(track);
  let actionButton = '';

  if (track.youtubeUrl) {
    // Red YouTube Link Button
    actionButton = `
      <a href="${track.youtubeUrl}" target="_blank" rel="noopener noreferrer" 
         style="background: #dc2626; color: white; padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 0.85rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
        ▶ YouTube
      </a>
    `;
  } else if (track.name) {
    // Audio MP3 Play Button
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
        <span style="font-weight: 600; color: #1f2937;">${title}</span>
        <span style="font-size: 0.75rem; font-weight: 700; color: #6b7280; margin-left: 8px; text-transform: uppercase;">(${track.season})</span>
      </div>
      <div>
        ${actionButton}
      </div>
    </div>
  `;
}

// Run loader on page ready
document.addEventListener('DOMContentLoaded', loadAndRenderTracks);
