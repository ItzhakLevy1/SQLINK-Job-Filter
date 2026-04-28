/*************************************************
 * SQLINK – content.js
 * Filter jobs to show only positions requiring
 * 3 years of experience or less, and mark applied jobs
 *************************************************/

/*************************************************
 * Banner
 *************************************************/
let bannerClosed = false;

function ensureExtensionBanner() {
  if (!document.body) return;
  if (bannerClosed) return;
  if (document.querySelector('.my-extension-banner')) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'my-extension-banner';

  const textSpan = document.createElement('span');

  const messageHTML = `
    <div>
      🟢 התוסף שלי לסינון המשרות פעיל.
      <hr>
      <br>
      בתפריט משמאל:
      <br><br>
      1️⃣ בחר 'תחום' וסמן:<br><br>
      'WEB פיתוח'
      <br><br><hr><br>
      2️⃣ בחר 'מקצוע' וסמן:<br><br>
      'Front end'<br>+<br>'Full stack'
      <br><br><hr><br>
      3️⃣ בחר 'אזור' וסמן:<br><br>
      'ת"א והמרכז'<br>+<br>'השרון'<br>+<br>'שפלה'
      <br><br><hr>
      ✅ בסיום הקלק על 'חפש'
    </div>
  `;

  textSpan.innerHTML = messageHTML;

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.className = 'my-extension-close';

  closeBtn.addEventListener('click', () => {
    bannerClosed = true;
    messageDiv.remove();
  });

  messageDiv.appendChild(textSpan);
  messageDiv.appendChild(closeBtn);
  document.body.appendChild(messageDiv);
}

/*************************************************
 * Filtering logic & Hebrew NLP
 *************************************************/

const HEBREW_NUMBERS_MAP = {
  'אחד': 1, 'אחת': 1,
  'שני': 2, 'שתיים': 2, 'שתי': 2,
  'שלוש': 3, 'שלושה': 3,
  'ארבע': 4, 'ארבעה': 4,
  'חמש': 5, 'חמישה': 5,
  'שש': 6, 'שישה': 6,
  'שבע': 7, 'שבעה': 7,
  'שמונה': 8, 'שמונעה': 8,
  'תשע': 9, 'תשעה': 9,
  'עשר': 10, 'עשרה': 10
};

/**
 * Extracts the maximum years of experience mentioned in a string.
 * Now handles '4+', '4 ומעלה', and standalone digit patterns.
 */
function extractExperienceYears(text) {
  let maxYears = 0;
  const wordKeys = Object.keys(HEBREW_NUMBERS_MAP).join('|');

  // 1. Match digits with modifiers: '4+', '4 ומעלה', '4 שנות'
  // Captures: '4+', '4 ומעלה', '4 שנות', '4 שנים'
  const digitPattern = /(\d+)(?:\s*\+|\s+ומעלה|\s*שנה|\s*שנות|\s*שנים)/g;
  let match;
  while ((match = digitPattern.exec(text)) !== null) {
    maxYears = Math.max(maxYears, parseInt(match[1], 10));
  }

  // 2. Match Hebrew words with modifiers: 'ארבע ומעלה', 'חמש שנים'
  const wordPattern = new RegExp(`(${wordKeys})(?:\\s+ומעלה|\\s+שנה|\\s+שנות|\\s+שנים)`, 'g');
  while ((match = wordPattern.exec(text)) !== null) {
    maxYears = Math.max(maxYears, HEBREW_NUMBERS_MAP[match[1]]);
  }

  // 3. Fallback for 'ניסיון של X' where X is a word or digit
  const fallbackPattern = new RegExp(`ניסיון\\s+(?:של\\s+)?(${wordKeys}|\\d+)`, 'g');
  while ((match = fallbackPattern.exec(text)) !== null) {
    const val = match[1];
    const num = HEBREW_NUMBERS_MAP[val] || parseInt(val, 10);
    if (!isNaN(num)) maxYears = Math.max(maxYears, num);
  }

  return maxYears;
}

function filterJobsByExperience() {
  const jobs = document.querySelectorAll('.positionItem');
  const appliedJobIds = JSON.parse(
    localStorage.getItem('appliedJobIds') || '[]'
  );

  jobs.forEach((job) => {
    const requirements = job.querySelector('.requirements');
    if (!requirements) return;

    const text = requirements.innerText;
    const yearsFound = extractExperienceYears(text);

    // Hide if years found is 3 or more
    job.style.display = yearsFound >= 3 ? 'none' : '';

    const jobIdElement = job.querySelector('.description.number');
    if (jobIdElement) {
      const jobIdMatch = jobIdElement.innerText.match(/\d+/);
      if (jobIdMatch && appliedJobIds.includes(jobIdMatch[0])) {
        job.classList.add('applied-job');
      } else {
        job.classList.remove('applied-job');
      }
    }
  });
}

/*************************************************
 * Track applied jobs
 *************************************************/
function addApplyButtonListeners() {
  const applyLinks = document.querySelectorAll('a.sendPopupCVinner');

  applyLinks.forEach((link) => {
    if (link.getAttribute('data-listener-added')) return;
    
    link.addEventListener('click', (event) => {
      const jobContainer = event.target.closest('.positionItem');
      if (!jobContainer) return;

      const jobIdElement = jobContainer.querySelector('.description.number');
      if (!jobIdElement) return;

      const jobIdMatch = jobIdElement.innerText.match(/\d+/);
      if (!jobIdMatch) return;

      const jobId = jobIdMatch[0];

      let appliedJobIds = JSON.parse(
        localStorage.getItem('appliedJobIds') || '[]'
      );
      if (!appliedJobIds.includes(jobId)) {
        appliedJobIds.push(jobId);
        localStorage.setItem('appliedJobIds', JSON.stringify(appliedJobIds));
      }

      jobContainer.classList.add('applied-job');
    });

    link.setAttribute('data-listener-added', 'true');
  });
}

/*************************************************
 * Bootstrap & observers
 *************************************************/
function runExtension() {
  ensureExtensionBanner();
  filterJobsByExperience();
  addApplyButtonListeners();
}

const bootInterval = setInterval(() => {
  if (document.body) {
    runExtension();
    clearInterval(bootInterval);
  }
}, 100);

const observer = new MutationObserver(() => {
  runExtension();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});