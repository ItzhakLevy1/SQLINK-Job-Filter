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
  if (document.querySelector(".my-extension-banner")) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = "my-extension-banner";

  const textSpan = document.createElement("span");

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

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.className = "my-extension-close";

  closeBtn.addEventListener("click", () => {
    bannerClosed = true;
    messageDiv.remove();
  });

  messageDiv.appendChild(textSpan);
  messageDiv.appendChild(closeBtn);
  document.body.appendChild(messageDiv);
}


/*************************************************
 * Filtering logic (based on actual DOM structure)
 *************************************************/
const EXPERIENCE_REGEX = /(\d+)\+?\s*(שנות|שנה)/g;

function filterJobsByExperience() {
  const jobs = document.querySelectorAll(".positionItem");
  const appliedJobIds = JSON.parse(
    localStorage.getItem("appliedJobIds") || "[]"
  );

  jobs.forEach((job) => {
    const requirements = job.querySelector(".requirements");
    if (!requirements) return;

    const text = requirements.innerText;
    let maxYears = 0;
    let match;

    while ((match = EXPERIENCE_REGEX.exec(text)) !== null) {
      const years = parseInt(match[1], 10);
      if (!isNaN(years)) {
        maxYears = Math.max(maxYears, years);
      }
    }

    job.style.display = maxYears >= 4 ? "none" : "";

    // Check if job has been applied for
    const jobIdElement = job.querySelector(".description.number");
    if (jobIdElement) {
      const jobIdMatch = jobIdElement.innerText.match(/\d+/);
      if (jobIdMatch && appliedJobIds.includes(jobIdMatch[0])) {
        job.classList.add("applied-job");
      } else {
        job.classList.remove("applied-job");
      }
    }
  });
}

/*************************************************
 * Track applied jobs
 *************************************************/
function addApplyButtonListeners() {
  const applyLinks = document.querySelectorAll("a.sendPopupCVinner");

  applyLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const jobContainer = event.target.closest(".positionItem");
      if (!jobContainer) return;

      const jobIdElement = jobContainer.querySelector(".description.number");
      if (!jobIdElement) return;

      const jobIdMatch = jobIdElement.innerText.match(/\d+/);
      if (!jobIdMatch) return;

      const jobId = jobIdMatch[0];

      let appliedJobIds = JSON.parse(
        localStorage.getItem("appliedJobIds") || "[]"
      );
      if (!appliedJobIds.includes(jobId)) {
        appliedJobIds.push(jobId);
        localStorage.setItem("appliedJobIds", JSON.stringify(appliedJobIds));
      }

      jobContainer.classList.add("applied-job");
    });
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

// Initial load (document_start safety)
const bootInterval = setInterval(() => {
  if (document.body) {
    runExtension();
    clearInterval(bootInterval);
  }
}, 100);

// Observe SPA / dynamic DOM changes
const observer = new MutationObserver(() => {
  runExtension();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
