let currentIndex = 0;

function updateDisplay() {
  const cards = document.querySelectorAll('.mass-card');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const counter = document.getElementById('blockCounter');

  if (!cards.length) return;

  // Make sure index stays within bounds
  if (currentIndex < 0) currentIndex = 0;
  if (currentIndex >= cards.length) currentIndex = cards.length - 1;

  cards.forEach((card, index) => {
    if (index === currentIndex) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });

  if (counter) {
    counter.textContent = `Block ${currentIndex + 1} of ${cards.length}`;
  }
  if (prevBtn) {
    prevBtn.disabled = currentIndex === 0;
  }
  if (nextBtn) {
    nextBtn.disabled = currentIndex === cards.length - 1;
  }
}

function changeBlock(direction) {
  currentIndex += direction;
  updateDisplay();
}

document.addEventListener('DOMContentLoaded', () => {
  updateDisplay();
});
