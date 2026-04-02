(() => {
  const TAP_TARGET = document.querySelector('.app-shell');
  const REQUIRED_TAPS = 10;
  const LOG_KEY = 'mangro_user_actions_v1';
  let tapCount = 0;
  let resetTimer;

  if (!TAP_TARGET) {
    return;
  }

  const readLogs = () => {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  };

  const writeLogs = (logs) => {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-100)));
  };

  const logAction = (action, detail = '') => {
    const logs = readLogs();
    logs.push({
      at: new Date().toISOString(),
      action,
      detail,
    });
    writeLogs(logs);
  };

  const resetTapCount = () => {
    tapCount = 0;
  };

  TAP_TARGET.addEventListener('click', () => {
    tapCount += 1;

    clearTimeout(resetTimer);
    resetTimer = setTimeout(resetTapCount, 3500);

    if (tapCount >= REQUIRED_TAPS) {
      logAction('Secret admin gesture', '10 taps detected');
      resetTapCount();
      window.location.href = 'admin.html';
    }
  });

  const searchInput = document.querySelector('.search-wrap input');
  if (searchInput) {
    searchInput.addEventListener('change', () => {
      const value = searchInput.value.trim();
      if (value) {
        logAction('Search', value);
      }
    });
  }

  const heroButton = document.querySelector('.hero-card button');
  if (heroButton) {
    heroButton.addEventListener('click', () => {
      logAction('Hero CTA', 'Order now clicked');
    });
  }

  document.querySelectorAll('.cat').forEach((button) => {
    button.addEventListener('click', () => {
      logAction('Category', button.textContent.trim());
    });
  });

  document.querySelectorAll('.bottom-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      const section = link.textContent.replace(/\s+/g, ' ').trim();
      logAction('Navigation', section);
    });
  });
})();
