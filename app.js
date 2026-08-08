/**
 * Aradhana Premier League (APL) 2026 - Client Application Logic
 * Implements offline-first tracking, localStorage persistence, 
 * Google Sheets synchronization, localization, and scoring.
 */

// Configuration
const CONFIG = {
  // PASTE YOUR PUBLISHED GOOGLE APPS SCRIPT WEB APP URL HERE:
  apiEndpoint: "https://script.google.com/macros/s/AKfycbzsRysOhynpm6CIs-FxsEeuf9gr4-ajEtxssDvzbBQS3LUCBdUv3Xcv-pBSxcduHEdg/exec", // Placeholder for deployment
  startDate: "2026-08-09",
  endDate: "2026-09-15",
};

// Application State
let state = {
  currentLanguage: "hi", // 'hi' or 'en'
  currentDate: "2026-08-09", // active selected date
  user: null, // { mobile, name, teamName, role, age, fatherHusbandName }
  trackerData: {}, // YYYY-MM-DD -> { activityId: value (1 or count) }
  syncStatus: "synced", // 'synced', 'syncing', 'error'
  isDirty: false // true if local changes are not synced to cloud
};

// Activity Definitions
const ACTIVITIES = [
  // === 1 RUN QUICK SINGLE ===
  { id: "run1_item1", category: "run1", index: 1, score: 1, circled: true, textHi: "तीन बार गुरु वंदन करने पर", textEn: "Doing Guru Vandan three times" },
  { id: "run1_item2", category: "run1", index: 2, score: 1, circled: false, textHi: "रोज उठने पर 11 बार नवकार मंत्र बोलना", textEn: "Chanting Namokar Mantra 11 times upon waking up" },
  { id: "run1_item3", category: "run1", index: 3, score: 1, circled: false, textHi: "पारिवारिक जन से मिलने पर जय जिनेन्द्र बोलना", textEn: "Saying Jai Jinendra upon meeting family members" },
  { id: "run1_item4", category: "run1", index: 4, score: 1, circled: true, textHi: "किसी व्यक्ति का 1 गुण लिखना (Notebook में)", textEn: "Writing 1 good quality of someone in a notebook" },
  { id: "run1_item5", category: "run1", index: 5, score: 1, circled: true, textHi: "किसी व्यक्ति को जाकर एक उनका गुण बताना", textEn: "Going and telling someone one of their good qualities" },
  { id: "run1_item6", category: "run1", index: 6, score: 1, circled: false, textHi: "कोई भी प्रकार का Social Media use नहीं करना (after 10:00 PM)", textEn: "Not using any social media after 10:00 PM" },
  { id: "run1_item7", category: "run1", index: 7, score: 1, circled: false, textHi: "1 Dress/साड़ी से ज्यादा नहीं पहनना (except सामायिक dress)", textEn: "Not wearing more than 1 dress/saree (excluding Samayik dress)" },
  { id: "run1_item8", category: "run1", index: 8, score: 1, circled: false, textHi: "उपवास करने पर*", textEn: "Doing Upvas (Fasting)*" },
  { id: "run1_item9", category: "run1", index: 9, score: 1, circled: false, textHi: "1 विगय का त्याग करने पर*", textEn: "Giving up 1 Vigay (curd, milk, oil, ghee, sugar, etc.)*" },
  { id: "run1_item10", category: "run1", index: 10, score: 1, circled: false, textHi: "\"मानव का शुभ तन मन पाया, व्रतधारी बनो व्रतधारी बनो\" (11 बार बोलना)", textEn: "Chanting 'Manav ka shubh tan man paya...' 11 times" },
  { id: "run1_item11", category: "run1", index: 11, score: 1, circled: false, textHi: "लोगस्स की एक गाथा याद करना", textEn: "Memorizing one gatha of Logassa" },
  { id: "run1_item12", category: "run1", index: 12, score: 1, circled: false, textHi: "11 बजे के उपरांत भोजन नहीं लेना", textEn: "No eating/drinking after 11:00 PM" },
  { id: "run1_item13", category: "run1", index: 13, score: 1, circled: false, textHi: "बाजार की मिठाई नमकीन का त्याग", textEn: "Renouncing market sweets and namkeen" },

  // === 4 RUNS MANAGEMENT BOUNDARY ===
  { id: "run4_item1", category: "run4", index: 1, score: 4, circled: false, textHi: "बियासना करना*", textEn: "Doing Biyasna (eating twice a day in one sitting)*" },
  { id: "run4_item2", category: "run4", index: 2, score: 4, circled: false, textHi: "जमीकंद का त्याग करना*", textEn: "Giving up underground vegetables (potatoes, onions, etc.)*" },
  { id: "run4_item3", category: "run4", index: 3, score: 4, circled: true, textHi: "14 नियमों में से कोई भी 2 नियम ग्रहण करने पर*", textEn: "Accepting any 2 rules out of the Shravak's 14 rules*" },
  { id: "run4_item4", category: "run4", index: 4, score: 4, circled: false, textHi: "पूरे दिन में Lift का उपयोग नहीं करने पर", textEn: "Not using the elevator the whole day" },
  { id: "run4_item5", category: "run4", index: 5, score: 4, circled: false, textHi: "पूरे दिन में चप्पल का त्याग", textEn: "Renouncing footwear for the whole day" },
  { id: "run4_item6", category: "run4", index: 6, score: 4, circled: false, textHi: "पूरे दिन में संयोजना का त्याग*", textEn: "Renouncing food combinations (Samyojana) for the whole day*" },
  { id: "run4_item7", category: "run4", index: 7, score: 4, circled: false, textHi: "2 विगय का त्याग करने पर", textEn: "Giving up 2 types of Vigay" },
  { id: "run4_item8", category: "run4", index: 8, score: 4, circled: false, textHi: "रामामृतम का ध्यान करने पर (प्रथम चरण)*", textEn: "Practicing Ramaamritam Meditation (first stage)*" },
  { id: "run4_item9", category: "run4", index: 9, score: 4, circled: false, textHi: "1 दिन पूर्ण रूप से ब्रह्मचर्य का पालन करना", textEn: "Observing complete celibacy (Brahmacharya) for 1 full day" },
  { id: "run4_item10", category: "run4", index: 10, score: 4, circled: false, textHi: "\"शरीर की सुंदरता में सुख नहीं है\" (11 बार बोलना)", textEn: "Chanting 'Shareer ki sundarta mein sukh nahi hai' 11 times" },
  { id: "run4_item11", category: "run4", index: 11, score: 4, circled: false, textHi: "पूरे दिन में दर्पण (Mirror) नहीं देखने पर", textEn: "Not looking in the mirror for the whole day" },
  { id: "run4_item12", category: "run4", index: 12, score: 4, circled: false, textHi: "रात्रि भोजन त्याग करने पर", textEn: "Giving up food after sunset (Ratri Bhojan Tyag)" },
  { id: "run4_item13", category: "run4", index: 13, score: 4, circled: false, textHi: "धार्मिक पुस्तक का एक पेज पढ़ने पर", textEn: "Reading one page of a religious book" },

  // === 6 RUNS IT'S A SIXER ===
  { id: "run6_item1", category: "run6", index: 1, score: 6, circled: false, textHi: "पूरा दिन Angry / गुस्सा नहीं करने पर", textEn: "Not getting angry the whole day" },
  { id: "run6_item2", category: "run6", index: 2, score: 6, circled: true, textHi: "1 सामायिक करने पर [घर में भी मान्य]*", textEn: "Doing 1 Samayik [even at home]*" },
  { id: "run6_item3", category: "run6", index: 3, score: 6, circled: false, textHi: "णमो नाणस्स की 1 माला फेरने पर", textEn: "Chanting 1 mala of 'Namo Nanam'" },
  { id: "run6_item4", category: "run6", index: 4, score: 6, circled: true, textHi: "2 लोगस्स करने पर [तीर्थंकर भगवान की स्तुति है]*", textEn: "Doing 2 Logassa [Tirthankar Stuti]*" },
  { id: "run6_item5", category: "run6", index: 5, score: 6, circled: true, textHi: "2 णमोत्थुणं करने पर (तीर्थंकर भगवंतों के गुणाणुवाद)", textEn: "Chanting 2 Namutthunam (Tirthankar praises)" },
  { id: "run6_item6", category: "run6", index: 6, score: 6, circled: false, textHi: "एकासन करने पर*", textEn: "Doing Ekasan (eating once a day in one sitting)*" },
  { id: "run6_item7", category: "run6", index: 7, score: 6, circled: false, textHi: "\"क्रोध को क्षमा से, मान को नम्रता से, लोभ को संतोष से मैं जीतूं\" (11 बार बोलना)", textEn: "Chanting 'Krodh ko kshama se...' 11 times" },
  { id: "run6_item8", category: "run6", index: 8, score: 6, circled: false, textHi: "एक भजन गाना", textEn: "Singing one bhajan" },
  { id: "run6_item9", category: "run6", index: 9, score: 6, circled: false, textHi: "रात्रि चौविहार करने पर", textEn: "Observing Ratri Chouvihaar (no food/water after sunset)" },
  { id: "run6_item10", category: "run6", index: 10, score: 6, circled: false, textHi: "भक्तांबर की 2 गाथाएं याद करना", textEn: "Memorizing 2 gathas of Bhaktamar Stotra" },
  { id: "run6_item11", category: "run6", index: 11, score: 6, circled: false, textHi: "पर्यूषण में एकांतर करना", textEn: "Doing Ekantar (alternate fasts) during Paryushan" },
  { id: "run6_item12", category: "run6", index: 12, score: 6, circled: false, textHi: "होटल का त्याग करना", textEn: "Renouncing hotel food" },

  // === ONE-TIME SPECIAL SCORES ===
  { id: "onetime_item1", category: "onetime", index: 2, score: 6, circled: false, textHi: "2 माह (month) तक संपूर्ण ब्रह्मचर्य का पालन करने पर", textEn: "Observing complete celibacy (Brahmacharya) for 2 months" },
  { id: "onetime_item2", category: "onetime", index: 3, score: 6, circled: false, textHi: "पूरी टीम के साथ दर्शन करने पर", textEn: "Doing temple darshan with the entire team" }
];

// UI Localization dictionary
const TRANSLATIONS = {
  hi: {
    appTitle: "आराधना प्रीमियर लीग - 2026",
    appSub: "चातुर्मास आराधना ट्रैकर (9 अगस्त से 15 सितम्बर)",
    loginTitle: "APL 2026 लॉगिन",
    loginSub: "अपनी प्रगति को सुरक्षित रखने के लिए मोबाइल नंबर से लॉगिन करें",
    mobileLabel: "मोबाइल नंबर",
    mobilePlaceholder: "10-अंकीय मोबाइल नंबर दर्ज करें",
    nameLabel: "आपका नाम",
    namePlaceholder: "अपना नाम दर्ज करें",
    teamLabel: "टीम का नाम",
    teamPlaceholder: "अपनी टीम का नाम दर्ज करें",
    roleLabel: "आपकी भूमिका",
    roleCaptain: "कैप्टन",
    roleMember: "टीम सदस्य",
    ageLabel: "आयु",
    agePlaceholder: "आयु दर्ज करें",
    fhLabel: "पिता/पति का नाम",
    fhPlaceholder: "पिता या पति का नाम दर्ज करें",
    loginBtn: "आगे बढ़ें",
    registerBtn: "पंजीकरण करें",
    registerTitle: "पंजीकरण",
    registerSub: "आराधना प्रीमियर लीग में भाग लेने के लिए विवरण भरें",
    logout: "लॉगआउट",
    totalRuns: "आपका कुल स्कोर",
    runsUnit: "रन",
    captainBonus: "कैप्टन बोनस सक्रिय (2x स्कोर)",
    selectDate: "दिन का चयन करें",
    runs1: "1 रन - क्विक सिंगल",
    runs4: "4 रन - मैनेजमेंट बाउंड्री",
    runs6: "6 रन - इट्स अ सिक्सर",
    runsOnetime: "विशेष एक-बार स्कोर (6 रन)",
    rulesRef: "पचक्खाण और धार्मिक संदर्भ",
    syncStatus: "सिंक्रोनाइजेशन",
    synced: "क्लाउड से सुरक्षित जुड़ा है",
    syncing: "प्रगति क्लाउड पर सहेज रहे हैं...",
    syncError: "ऑफ़लाइन मोड (स्थानीय रूप से सहेजा गया)",
    retry: "पुनः प्रयास करें",
    starDesc: "* चिह्नित आराधना का विवरण नीचे पचक्खाण अनुभाग में देखें।",
    backToLogin: "वापस लॉगिन पर जाएं",
    invalidMobile: "कृपया वैध 10-अंकीय मोबाइल नंबर दर्ज करें।",
    reportCardBtn: "🏆 रिपोर्ट कार्ड डाउनलोड / शेयर",
    reportTitle: "आराधना रिपोर्ट कार्ड",
    currentTitleLabel: "आपकी आध्यात्मिक पदवी:"
  },
  en: {
    appTitle: "Aradhana Premier League - 2026",
    appSub: "Chaturmas Aradhana Tracker (9th Aug to 15th Sep)",
    loginTitle: "APL 2026 Login",
    loginSub: "Login with your mobile number to secure your progress",
    mobileLabel: "Mobile Number",
    mobilePlaceholder: "Enter 10-digit mobile number",
    nameLabel: "Your Name",
    namePlaceholder: "Enter your name",
    teamLabel: "Team Name",
    teamPlaceholder: "Enter your team name",
    roleLabel: "Your Role",
    roleCaptain: "Captain",
    roleMember: "Team Member",
    ageLabel: "Age",
    agePlaceholder: "Enter age",
    fhLabel: "Father / Husband Name",
    fhPlaceholder: "Enter father or husband name",
    loginBtn: "Continue",
    registerBtn: "Register & Start",
    registerTitle: "Registration",
    registerSub: "Fill in details to participate in Chaturmas APL 2026",
    logout: "Logout",
    totalRuns: "Your Total Score",
    runsUnit: "Runs",
    captainBonus: "Captain Bonus Active (2x Score)",
    selectDate: "Select Day",
    runs1: "1 Run - Quick Single",
    runs4: "4 Runs - Management Boundary",
    runs6: "6 Runs - It's A Sixer",
    runsOnetime: "Special One-Time Scores (6 Runs)",
    rulesRef: "Pachkklan & Scriptures",
    syncStatus: "Synchronization",
    synced: "Secured & Synced to Cloud",
    syncing: "Saving progress to cloud...",
    syncError: "Offline Mode (Saved Locally)",
    retry: "Sync Now",
    starDesc: "* Read details of starred items in the scripture reference section below.",
    backToLogin: "Go back to Login",
    invalidMobile: "Please enter a valid 10-digit mobile number.",
    reportCardBtn: "🏆 Download / Share Report Card",
    reportTitle: "Aradhana Report Card",
    currentTitleLabel: "Your Spiritual Title:"
  }
};

// Generate list of dates from 2026-08-09 to 2026-09-15
function generateDateList() {
  const dates = [];
  const startParts = CONFIG.startDate.split("-");
  const endParts = CONFIG.endDate.split("-");
  let current = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
  
  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    
    dates.push({
      dateStr: dateStr,
      dayNum: current.getDate(),
      monthHi: current.getMonth() === 7 ? "अगस्त" : "सितम्बर",
      monthEn: current.getMonth() === 7 ? "Aug" : "Sep",
      dayNameHi: ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"][current.getDay()],
      dayNameEn: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][current.getDay()]
    });
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Calculate the total runs score
function calculateScore() {
  let totalScore = 0;
  
  // 1. Calculate Daily scores
  const dates = generateDateList();
  dates.forEach(d => {
    let dayScore = 0;
    const dayData = state.trackerData[d.dateStr] || {};
    
    ACTIVITIES.forEach(act => {
      if (act.category !== "onetime" && dayData[act.id]) {
        if (act.circled) {
          // Multiply run score by quantity marked
          const qty = dayData[act.id] || 0;
          dayScore += qty * act.score;
        } else {
          dayScore += act.score;
        }
      }
    });
    
    // Double the score if role is Captain
    if (state.user && state.user.role === "Captain") {
      dayScore = dayScore * 2;
    }
    
    totalScore += dayScore;
  });
  
  // 2. Add One-Time scores (not daily, not doubled by captain's daily role rules unless user wishes, but rule 10 says "captain who does aradhana, their score is double" so we double the total sum of their score!)
  let oneTimeScore = 0;
  const oneTimeData = state.trackerData["onetime"] || {};
  ACTIVITIES.forEach(act => {
    if (act.category === "onetime" && oneTimeData[act.id]) {
      oneTimeScore += act.score;
    }
  });
  
  if (state.user && state.user.role === "Captain") {
    oneTimeScore = oneTimeScore * 2;
  }
  
  totalScore += oneTimeScore;
  return totalScore;
}

// LocalStorage helpers
function saveToLocalStorage() {
  localStorage.setItem("apl_lang", state.currentLanguage);
  localStorage.setItem("apl_date", state.currentDate);
  if (state.user) {
    localStorage.setItem("apl_user", JSON.stringify(state.user));
    localStorage.setItem("apl_user_" + state.user.mobile, JSON.stringify(state.user));
    localStorage.setItem("apl_tracker_" + state.user.mobile, JSON.stringify(state.trackerData));
  } else {
    localStorage.removeItem("apl_user");
  }
}

function loadFromLocalStorage() {
  try {
    state.currentLanguage = localStorage.getItem("apl_lang") || "hi";
    state.currentDate = localStorage.getItem("apl_date") || "2026-08-09";
    
    const userStr = localStorage.getItem("apl_user");
    if (userStr && userStr !== "undefined" && userStr !== "null") {
      state.user = JSON.parse(userStr);
      if (state.user && state.user.mobile) {
        const trackerStr = localStorage.getItem("apl_tracker_" + state.user.mobile);
        state.trackerData = (trackerStr && trackerStr !== "undefined" && trackerStr !== "null") ? JSON.parse(trackerStr) : {};
      } else {
        state.user = null;
      }
    }
  } catch (e) {
    console.error("Local storage read error:", e);
    localStorage.removeItem("apl_user");
    state.user = null;
    state.trackerData = {};
  }
}

// REST Client for Google Apps Script Web App
async function sendRequest(url, data) {
  // Use no-cors mode if needed, but since our Apps Script sends CORS headers, we can fetch normally
  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8" // bypass simple request preflight checks
    },
    body: JSON.stringify(data)
  });
  return await response.json();
}

async function fetchRequest(url) {
  const response = await fetch(url, {
    method: "GET",
    mode: "cors"
  });
  return await response.json();
}

// Cloud synchronization logic
async function syncProgress() {
  if (!state.user || !CONFIG.apiEndpoint) return;
  
  setSyncStatus("syncing");
  
  const totalScore = calculateScore();
  const payload = {
    action: "saveUser",
    mobile: state.user.mobile,
    name: state.user.name,
    teamName: state.user.teamName,
    role: state.user.role,
    age: state.user.age,
    fatherHusbandName: state.user.fatherHusbandName,
    totalScore: totalScore,
    trackerData: JSON.stringify(state.trackerData)
  };
  
  try {
    const result = await sendRequest(CONFIG.apiEndpoint, payload);
    if (result && result.status === "success") {
      setSyncStatus("synced");
      state.isDirty = false;
    } else {
      throw new Error(result.message || "Failed saving on sheet");
    }
  } catch (error) {
    console.error("Sync error:", error);
    setSyncStatus("error");
    state.isDirty = true;
  }
}

function setSyncStatus(status) {
  state.syncStatus = status;
  const dot = document.getElementById("sync-dot");
  const text = document.getElementById("sync-text");
  const retryBtn = document.getElementById("sync-retry");
  
  if (!dot || !text) return;
  
  dot.className = "sync-dot " + status;
  retryBtn.style.display = status === "error" ? "inline-block" : "none";
  
  const translations = TRANSLATIONS[state.currentLanguage];
  if (status === "synced") {
    text.innerText = translations.synced;
  } else if (status === "syncing") {
    text.innerText = translations.syncing;
  } else if (status === "error") {
    text.innerText = translations.syncError;
  }
}

// UI Render helpers
function updateLanguageUI() {
  const translations = TRANSLATIONS[state.currentLanguage];
  
  // Update header text
  document.getElementById("lang-btn-text").innerText = state.currentLanguage === "hi" ? "English" : "हिन्दी";
  document.getElementById("app-title").innerText = translations.appTitle;
  document.getElementById("app-subtitle").innerText = translations.appSub;
  
  // Form tags
  const tKeys = [
    "loginTitle", "loginSub", "mobileLabel", "nameLabel", "teamLabel", 
    "roleLabel", "ageLabel", "fhLabel", "loginBtn", "registerBtn",
    "registerTitle", "registerSub", "totalRuns", "runsUnit", "selectDate",
    "runs1", "runs4", "runs6", "runsOnetime", "rulesRef", "starDesc", "backToLogin", "currentTitleLabel"
  ];
  
  tKeys.forEach(key => {
    const el = document.getElementById("t-" + key);
    if (el) {
      if (el.tagName === "INPUT") {
        el.placeholder = translations[key + "Placeholder"] || "";
      } else {
        el.innerText = translations[key];
      }
    }
  });
  
  const roleCap = document.getElementById("role-captain");
  const roleMem = document.getElementById("role-member");
  if (roleCap) roleCap.innerText = translations.roleCaptain;
  if (roleMem) roleMem.innerText = translations.roleMember;
  
  // Sync status
  setSyncStatus(state.syncStatus);
  
  // Bind user dynamic profile data to dashboard
  if (state.user) {
    document.getElementById("dashboard-user-name").innerText = state.user.name;
    document.getElementById("dashboard-user-team").innerText = (state.currentLanguage === "hi" ? "टीम: " : "Team: ") + state.user.teamName;
    const roleText = state.user.role === "Captain" 
      ? translations.roleCaptain 
      : translations.roleMember;
    document.getElementById("dashboard-user-role").innerText = roleText;

    renderCalendar();
    renderActivities();
    updateScoreUI();
  }
}

function updateScoreUI() {
  const score = calculateScore();
  document.getElementById("runs-display-val").innerText = score;
  
  const bonusEl = document.getElementById("captain-bonus-indicator");
  if (state.user && state.user.role === "Captain") {
    bonusEl.style.display = "block";
    bonusEl.innerText = TRANSLATIONS[state.currentLanguage].captainBonus;
  } else {
    bonusEl.style.display = "none";
  }
  
  // Update Spiritual Title & progress bar
  updateSpiritualTitle(score);
}

function renderCalendar() {
  const scrollbar = document.getElementById("days-scrollbar");
  if (!scrollbar) return;
  
  scrollbar.innerHTML = "";
  const dates = generateDateList();
  
  dates.forEach(d => {
    const card = document.createElement("div");
    card.className = "day-card";
    
    // Check if day is marked
    const hasData = state.trackerData[d.dateStr] && Object.keys(state.trackerData[d.dateStr]).length > 0;
    if (hasData) {
      card.classList.add("marked");
    }
    
    if (d.dateStr === state.currentDate) {
      card.classList.add("active");
    }
    
    const numEl = document.createElement("span");
    numEl.className = "day-card-number";
    numEl.innerText = d.dayNum;
    
    const lblEl = document.createElement("span");
    lblEl.className = "day-card-label";
    lblEl.innerText = state.currentLanguage === "hi" ? d.monthHi : d.monthEn;
    
    const dayName = document.createElement("span");
    dayName.style.fontSize = "9px";
    dayName.innerText = state.currentLanguage === "hi" ? d.dayNameHi : d.dayNameEn;
    
    const dot = document.createElement("div");
    dot.className = "day-dot";
    
    card.appendChild(numEl);
    card.appendChild(lblEl);
    card.appendChild(dayName);
    card.appendChild(dot);
    
    card.onclick = () => {
      // Deactivate old day
      const activeCard = scrollbar.querySelector(".day-card.active");
      if (activeCard) activeCard.classList.remove("active");
      
      card.classList.add("active");
      state.currentDate = d.dateStr;
      saveToLocalStorage();
      renderActivities();
    };
    
    scrollbar.appendChild(card);
  });
}

function renderActivities() {
  const renderCategory = (category, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = "";
    const items = ACTIVITIES.filter(a => a.category === category);
    
    // Get marked items for active day/category
    const isOneTime = category === "onetime";
    const activeKey = isOneTime ? "onetime" : state.currentDate;
    const markedData = state.trackerData[activeKey] || {};
    
    items.forEach(act => {
      const row = document.createElement("div");
      row.className = "activity-row";
      
      const isChecked = !!markedData[act.id];
      if (isChecked) {
        row.classList.add("checked");
      }
      
      // Info side (number + description)
      const infoSide = document.createElement("div");
      infoSide.className = "info-side activity-info-side";
      
      const numBadge = document.createElement("div");
      numBadge.className = "activity-index-badge";
      if (act.circled) {
        numBadge.classList.add("circled");
      }
      numBadge.innerText = act.index;
      
      const textDesc = document.createElement("span");
      textDesc.className = "activity-text-desc";
      textDesc.innerText = state.currentLanguage === "hi" ? act.textHi : act.textEn;
      
      infoSide.appendChild(numBadge);
      infoSide.appendChild(textDesc);
      row.appendChild(infoSide);
      
      // Control side (checkbox and optional quantity buttons)
      const ctrlSide = document.createElement("div");
      ctrlSide.className = "activity-control-side";
      
      const qty = markedData[act.id] || 0;
      
      // Circled items: show quantity adjustments if checked
      if (act.circled && isChecked) {
        const qtySelector = document.createElement("div");
        qtySelector.className = "qty-selector";
        
        const minusBtn = document.createElement("button");
        minusBtn.className = "qty-btn";
        minusBtn.innerText = "-";
        minusBtn.onclick = (e) => {
          e.stopPropagation();
          if (qty > 1) {
            updateMarkValue(activeKey, act.id, qty - 1);
          } else {
            // Uncheck if quantity drops to 0
            updateMarkValue(activeKey, act.id, 0);
          }
        };
        
        const qtyNum = document.createElement("span");
        qtyNum.className = "qty-number";
        qtyNum.innerText = qty;
        
        const plusBtn = document.createElement("button");
        plusBtn.className = "qty-btn";
        plusBtn.innerText = "+";
        plusBtn.onclick = (e) => {
          e.stopPropagation();
          updateMarkValue(activeKey, act.id, qty + 1);
        };
        
        qtySelector.appendChild(minusBtn);
        qtySelector.appendChild(qtyNum);
        qtySelector.appendChild(plusBtn);
        ctrlSide.appendChild(qtySelector);
      }
      
      // Main Checkbox
      const checkLabel = document.createElement("label");
      checkLabel.className = "custom-checkbox-wrapper";
      
      const checkInput = document.createElement("input");
      checkInput.type = "checkbox";
      checkInput.checked = isChecked;
      checkInput.onchange = (e) => {
        const checked = e.target.checked;
        if (checked) {
          // Circle items start with count=1, non-circled items count=1
          updateMarkValue(activeKey, act.id, 1);
        } else {
          updateMarkValue(activeKey, act.id, 0);
        }
      };
      
      const checkmark = document.createElement("span");
      checkmark.className = "checkmark";
      
      checkLabel.appendChild(checkInput);
      checkLabel.appendChild(checkmark);
      ctrlSide.appendChild(checkLabel);
      
      row.appendChild(ctrlSide);
      container.appendChild(row);
    });
  };
  
  renderCategory("run1", "run1-list");
  renderCategory("run4", "run4-list");
  renderCategory("run6", "run6-list");
  renderCategory("onetime", "onetime-list");
}

function updateMarkValue(dateKey, activityId, value) {
  if (!state.trackerData[dateKey]) {
    state.trackerData[dateKey] = {};
  }
  
  if (value <= 0) {
    delete state.trackerData[dateKey][activityId];
    // Clean up empty date keys
    if (Object.keys(state.trackerData[dateKey]).length === 0) {
      delete state.trackerData[dateKey];
    }
  } else {
    state.trackerData[dateKey][activityId] = value;
  }
  
  state.isDirty = true;
  saveToLocalStorage();
  renderActivities();
  updateScoreUI();
  
  // Highlight marked status on calendar day cards
  const datesContainer = document.getElementById("days-scrollbar");
  if (datesContainer && dateKey !== "onetime") {
    const activeCard = datesContainer.querySelector(".day-card.active");
    if (activeCard) {
      const hasData = state.trackerData[dateKey] && Object.keys(state.trackerData[dateKey]).length > 0;
      if (hasData) {
        activeCard.classList.add("marked");
      } else {
        activeCard.classList.remove("marked");
      }
    }
  }
  
  // Sync in background after change
  debouncedSync();
}

// Debounce helper to prevent heavy APIs
let syncTimeout = null;
function debouncedSync() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncProgress();
  }, 2000); // sync 2 seconds after final click
}

// Login and Registration flow
async function handleLogin(e) {
  e.preventDefault();
  const mobileInput = document.getElementById("login-mobile").value.trim();
  const loginErr = document.getElementById("login-error");
  const loginBtn = document.getElementById("login-btn-submit");
  
  if (mobileInput.length < 10 || !/^\d+$/.test(mobileInput)) {
    loginErr.innerText = TRANSLATIONS[state.currentLanguage].invalidMobile;
    return;
  }
  
  loginErr.innerText = "";
  loginBtn.disabled = true;
  const origBtnText = loginBtn.innerText;
  loginBtn.innerText = state.currentLanguage === "hi" ? "सत्यापित कर रहे हैं..." : "Verifying...";
  
  try {
    if (!CONFIG.apiEndpoint) {
      // Local demo mode if URL is missing
      alert("No Apps Script URL configured. Starting local demo mode.");
      loginLocalDemo(mobileInput);
      return;
    }
    
    const checkUrl = `${CONFIG.apiEndpoint}?action=checkUser&mobile=${mobileInput}`;
    const result = await fetchRequest(checkUrl);
    
    if (result && result.status === "success") {
      if (result.userExists) {
        // User exists, log them in and load their progress
        state.user = {
          mobile: result.userData.mobile,
          name: result.userData.name,
          teamName: result.userData.teamName,
          role: result.userData.role,
          age: result.userData.age,
          fatherHusbandName: result.userData.fatherHusbandName
        };
        state.trackerData = JSON.parse(result.userData.trackerData || "{}");
        state.isDirty = false;
        
        saveToLocalStorage();
        showScreen("dashboard");
        renderCalendar();
        renderActivities();
        updateScoreUI();
        setSyncStatus("synced");
      } else {
        // User does not exist, redirect to registration screen
        document.getElementById("reg-mobile").value = mobileInput;
        showScreen("registration");
      }
    } else {
      throw new Error(result.message || "Spreadsheet connection failed.");
    }
  } catch (error) {
    console.error("Login connection error:", error);
    loginErr.innerText = state.currentLanguage === "hi" 
      ? "क्लाउड से कनेक्शन विफल रहा। क्या आप स्थानीय मोड (ऑफ़लाइन) में जारी रखना चाहते हैं?" 
      : "Cloud connection failed. Would you like to continue in local-only mode?";
    
    // Provide offline-mode option
    const localContBtn = document.createElement("button");
    localContBtn.className = "btn-primary";
    localContBtn.style.marginTop = "10px";
    localContBtn.style.background = "var(--color-gold)";
    localContBtn.innerText = state.currentLanguage === "hi" ? "ऑफ़लाइन शुरू करें" : "Start Offline";
    localContBtn.onclick = () => {
      loginLocalDemo(mobileInput);
    };
    loginErr.appendChild(localContBtn);
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerText = origBtnText;
  }
}

function loginLocalDemo(mobile) {
  // Try to load existing user from local storage
  const savedUserStr = localStorage.getItem("apl_user");
  let savedUser = null;
  if (savedUserStr) {
    try {
      savedUser = JSON.parse(savedUserStr);
    } catch (e) {}
  }
  
  // If the saved user matches the entered mobile number, load their profile
  if (savedUser && savedUser.mobile === mobile) {
    state.user = savedUser;
  } else {
    // Check if we have any other profile stored for this mobile number
    const alternativeUserStr = localStorage.getItem("apl_user_" + mobile);
    if (alternativeUserStr) {
      try {
        state.user = JSON.parse(alternativeUserStr);
      } catch (e) {}
    }
  }
  
  // If we still don't have user details, redirect to registration
  if (!state.user || state.user.mobile !== mobile) {
    document.getElementById("reg-mobile").value = mobile;
    // Pre-fill name and other fields if previously filled to make it smooth
    document.getElementById("reg-name").value = "";
    document.getElementById("reg-team").value = "";
    document.getElementById("reg-age").value = "";
    document.getElementById("reg-fh").value = "";
    
    showScreen("registration");
    return;
  }
  
  const savedTracker = localStorage.getItem("apl_tracker_" + mobile);
  state.trackerData = savedTracker ? JSON.parse(savedTracker) : {};
  state.syncStatus = "error"; // Offline local indicator
  
  saveToLocalStorage();
  showScreen("dashboard");
  renderCalendar();
  renderActivities();
  updateScoreUI();
}

async function handleRegistration(e) {
  e.preventDefault();
  const regBtn = document.getElementById("reg-btn-submit");
  
  const regUser = {
    mobile: document.getElementById("reg-mobile").value.trim(),
    name: document.getElementById("reg-name").value.trim(),
    teamName: document.getElementById("reg-team").value.trim(),
    role: document.querySelector(".role-option.selected").dataset.role,
    age: document.getElementById("reg-age").value.trim(),
    fatherHusbandName: document.getElementById("reg-fh").value.trim()
  };
  
  regBtn.disabled = true;
  const origBtnText = regBtn.innerText;
  regBtn.innerText = state.currentLanguage === "hi" ? "दर्ज कर रहे हैं..." : "Submitting...";
  
  state.user = regUser;
  state.trackerData = {}; // Clear tracker data for new registration
  saveToLocalStorage();
  
  try {
    if (CONFIG.apiEndpoint) {
      const payload = {
        action: "saveUser",
        mobile: regUser.mobile,
        name: regUser.name,
        teamName: regUser.teamName,
        role: regUser.role,
        age: regUser.age,
        fatherHusbandName: regUser.fatherHusbandName,
        totalScore: 0,
        trackerData: "{}"
      };
      const result = await sendRequest(CONFIG.apiEndpoint, payload);
      if (result && result.status === "success") {
        setSyncStatus("synced");
        state.isDirty = false;
      } else {
        throw new Error(result.message);
      }
    }
  } catch (error) {
    console.error("Cloud registration failed, continuing in local mode:", error);
    setSyncStatus("error");
    state.isDirty = true;
  } finally {
    regBtn.disabled = false;
    regBtn.innerText = origBtnText;
    
    // Switch UI
    showScreen("dashboard");
    renderCalendar();
    renderActivities();
    updateScoreUI();
  }
}

function handleLogout() {
  localStorage.removeItem("apl_user");
  state.user = null;
  state.trackerData = {};
  showScreen("login");
}

function showScreen(screenId) {
  document.getElementById("screen-login").style.display = screenId === "login" ? "block" : "none";
  document.getElementById("screen-registration").style.display = screenId === "registration" ? "block" : "none";
  document.getElementById("screen-dashboard").style.display = screenId === "dashboard" ? "block" : "none";
  
  if (screenId === "login") {
    document.getElementById("login-mobile").value = "";
    document.getElementById("login-error").innerHTML = "";
  }
  
  if (screenId === "dashboard") {
    updateLanguageUI();
  }
}

// Scripture reference tab handlers
function initTabs() {
  const tabs = document.querySelectorAll(".ref-tab-btn");
  tabs.forEach(tab => {
    tab.onclick = () => {
      // Remove active classes
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".ref-tab-content").forEach(c => c.classList.remove("active"));
      
      // Set active
      tab.classList.add("active");
      const contentId = "tab-content-" + tab.dataset.tab;
      const content = document.getElementById(contentId);
      if (content) content.classList.add("active");
    };
  });
}

// Initial page load bootstrapping
window.addEventListener("load", () => {
  loadFromLocalStorage();
  initTabs();
  
  // Bind form submissions
  document.getElementById("login-form").onsubmit = handleLogin;
  document.getElementById("registration-form").onsubmit = handleRegistration;
  
  // Bind role selectors in registration
  const roles = document.querySelectorAll(".role-option");
  roles.forEach(opt => {
    opt.onclick = () => {
      roles.forEach(r => r.classList.remove("selected"));
      opt.classList.add("selected");
    };
  });
  
  // Bind Lang Switcher Button
  document.getElementById("lang-btn").onclick = () => {
    state.currentLanguage = state.currentLanguage === "hi" ? "en" : "hi";
    saveToLocalStorage();
    updateLanguageUI();
  };
  
  // Sync retry click
  document.getElementById("sync-retry").onclick = () => {
    syncProgress();
  };
  
  // Logout link
  document.getElementById("logout-link").onclick = handleLogout;
  
  // Report Card Bindings
  const btnReportCard = document.getElementById("btn-report-card");
  if (btnReportCard) {
    btnReportCard.onclick = openReportModal;
  }
  
  const closeReport = document.getElementById("close-report-modal");
  if (closeReport) {
    closeReport.onclick = closeReportModal;
  }
  
  // Close modal when clicking outside content
  window.addEventListener("click", (e) => {
    const modal = document.getElementById("report-modal");
    if (e.target === modal) {
      closeReportModal();
    }
  });
  
  const btnDownloadTxt = document.getElementById("btn-download-txt");
  if (btnDownloadTxt) {
    btnDownloadTxt.onclick = downloadReportTxt;
  }
  
  const btnCopyWa = document.getElementById("btn-copy-wa");
  if (btnCopyWa) {
    btnCopyWa.onclick = copyWhatsAppReport;
  }
  
  const btnPrintCard = document.getElementById("btn-print-card");
  if (btnPrintCard) {
    btnPrintCard.onclick = printReportCard;
  }
  
  // Check auth status
  if (state.user) {
    showScreen("dashboard");
    renderCalendar();
    renderActivities();
    updateScoreUI();
    updateLanguageUI();
    syncProgress(); // trigger background sync on startup
  } else {
    showScreen("login");
    updateLanguageUI();
  }
});

// ==========================================
// REPORT CARD SYSTEM
// ==========================================

function generateReportData() {
  const score = calculateScore();
  const dateList = [];
  const startParts = CONFIG.startDate.split("-");
  const endParts = CONFIG.endDate.split("-");
  let current = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);
  
  while (current <= end) {
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    dateList.push(`${yyyy}-${mm}-${dd}`);
    current.setDate(current.getDate() + 1);
  }
  
  let cat1Count = 0;
  let cat4Count = 0;
  let cat6Count = 0;
  let onetimeCount = 0;
  let activeDays = 0;
  
  dateList.forEach(dateStr => {
    const dayData = state.trackerData[dateStr] || {};
    let dayHasActivity = false;
    
    ACTIVITIES.forEach(act => {
      if (act.category !== "onetime" && dayData[act.id]) {
        dayHasActivity = true;
        const val = Number(dayData[act.id]) || 0;
        if (act.category === "run1") cat1Count += val;
        if (act.category === "run4") cat4Count += val;
        if (act.category === "run6") cat6Count += val;
      }
    });
    
    if (dayHasActivity) activeDays++;
  });
  
  // One-time scores
  const onetimeData = state.trackerData["onetime"] || {};
  ACTIVITIES.forEach(act => {
    if (act.category === "onetime" && onetimeData[act.id]) {
      const val = Number(onetimeData[act.id]) || 0;
      onetimeCount += val * 6; // 6 runs per item
    }
  });

  return {
    score,
    cat1Count,
    cat4Count,
    cat6Count,
    onetimeCount,
    activeDays,
    totalPossibleDays: dateList.length
  };
}

function getReportText() {
  const rep = generateReportData();
  const isHi = state.currentLanguage === "hi";
  const roleText = state.user.role === "Captain" 
    ? TRANSLATIONS[state.currentLanguage].roleCaptain 
    : TRANSLATIONS[state.currentLanguage].roleMember;
  
  let text = "";
  text += "=======================================\n";
  text += isHi ? "     आराधना प्रीमियर लीग - 2026\n" : "     Aradhana Premier League - 2026\n";
  text += isHi ? "           रिपोर्ट कार्ड\n" : "           REPORT CARD\n";
  text += "=======================================\n";
  text += (isHi ? "नाम (Name): " : "Name: ") + state.user.name + "\n";
  text += (isHi ? "पिता/पति (Father/Husband): " : "Father/Husband: ") + state.user.fatherHusbandName + "\n";
  text += (isHi ? "टीम (Team): " : "Team: ") + state.user.teamName + "\n";
  text += (isHi ? "भूमिका (Role): " : "Role: ") + roleText + "\n";
  text += (isHi ? "मोबाइल (Mobile): " : "Mobile: ") + state.user.mobile + "\n";
  text += (isHi ? "आयु (Age): " : "Age: ") + state.user.age + "\n";
  text += "---------------------------------------\n";
  text += isHi ? "       ★ स्कोर विवरण (Score) ★\n" : "       ★ SCORE DETAILS ★\n";
  text += "---------------------------------------\n";
  text += (isHi ? "कुल स्कोर (Total Runs): " : "Total Runs: ") + rep.score + " " + (isHi ? "रन" : "Runs") + "\n";
  text += (isHi ? "सक्रिय दिन (Active Days): " : "Active Days: ") + rep.activeDays + " / " + rep.totalPossibleDays + "\n\n";
  text += isHi ? "श्रेणी-वार स्कोर (Category-wise):\n" : "Category-wise Details:\n";
  text += (isHi ? "- क्विक सिंगल (1 रन): " : "- Quick Single (1 Run): ") + rep.cat1Count + " " + (isHi ? "रन" : "Runs") + "\n";
  text += (isHi ? "- मैनेजमेंट बाउंड्री (4 रन): " : "- Management Boundary (4 Runs): ") + rep.cat4Count + " " + (isHi ? "रन" : "Runs") + "\n";
  text += (isHi ? "- इट्स अ सिक्सर (6 रन): " : "- It's a Sixer (6 Runs): ") + rep.cat6Count + " " + (isHi ? "रन" : "Runs") + "\n";
  text += (isHi ? "- विशेष एक-बार स्कोर (6 रन): " : "- Special One-Time (6 Runs): ") + rep.onetimeCount + " " + (isHi ? "रन" : "Runs") + "\n";
  if (state.user.role === "Captain") {
    text += "\n* " + (isHi ? "कैप्टन बोनस 2x शामिल है" : "Captain Bonus 2x included") + "\n";
  }
  text += "---------------------------------------\n";
  text += isHi ? "        चातुर्मास आराधना लीग\n" : "        Chaturmas Aradhana League\n";
  text += isHi ? "    आस्था, संयम और तप का सुंदर पथ।\n" : "    Path of faith, self-control & penance.\n";
  text += "=======================================\n";
  return text;
}

function getWhatsAppText() {
  const rep = generateReportData();
  const roleText = state.user.role === "Captain" ? "कैप्टन (Captain)" : "टीम सदस्य (Member)";
  
  let text = "";
  text += "*🏆 आराधना प्रीमियर लीग - 2026 🏆*\n";
  text += "*📜 रिपोर्ट कार्ड (REPORT CARD) 📜*\n";
  text += "=========================\n";
  text += `👤 *नाम (Name):* ${state.user.name}\n`;
  text += `👴 *पिता/पति (Father/Husband):* ${state.user.fatherHusbandName}\n`;
  text += `👥 *टीम (Team):* ${state.user.teamName}\n`;
  text += `🎖️ *भूमिका (Role):* ${roleText}\n`;
  text += `📱 *मोबाइल (Mobile):* ${state.user.mobile}\n`;
  text += `🎂 *आयु (Age):* ${state.user.age}\n`;
  text += "=========================\n";
  text += `🏏 *कुल स्कोर (Total Runs):* ${rep.score} रन\n`;
  text += `📅 *सक्रिय दिन (Active Days):* ${rep.activeDays} / ${rep.totalPossibleDays}\n\n`;
  text += "*विवरण (Breakdown):*\n";
  text += `• क्विक सिंगल (1 रन): ${rep.cat1Count} रन\n`;
  text += `• मैनेजमेंट बाउंड्री (4 रन): ${rep.cat4Count} रन\n`;
  text += `• इट्स अ सिक्सर (6 रन): ${rep.cat6Count} रन\n`;
  text += `• विशेष स्कोर: ${rep.onetimeCount} रन\n`;
  if (state.user.role === "Captain") {
    text += "\n*(कैप्टन बोनस 2x स्कोर शामिल है)*\n";
  }
  text += "=========================\n";
  text += "_आस्था, संयम और तप का सुंदर चातुर्मास पथ।_";
  return text;
}

function printReportCard() {
  const rep = generateReportData();
  const roleText = state.user.role === "Captain" 
    ? TRANSLATIONS[state.currentLanguage].roleCaptain 
    : TRANSLATIONS[state.currentLanguage].roleMember;
  
  const printWindow = window.open('', '_blank', 'width=600,height=800');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>APL 2026 Report Card - ${state.user.name}</title>
      <style>
        body {
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background: #f4f6f8;
          color: #333;
          padding: 40px;
          margin: 0;
        }
        .card {
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border: 4px double #800000;
          padding: 40px;
          max-width: 500px;
          margin: 0 auto;
          position: relative;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #800000;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 26px;
          font-weight: bold;
          color: #800000;
          margin: 0;
        }
        .title {
          font-size: 20px;
          color: #b8860b;
          margin: 5px 0 0 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .profile-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 15px;
        }
        .label {
          font-weight: bold;
          color: #666;
        }
        .value {
          color: #111;
          font-weight: 600;
        }
        .score-box {
          background: #800000;
          color: #fff;
          border-radius: 16px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .score-val {
          font-size: 48px;
          font-weight: bold;
          margin: 0;
        }
        .score-lbl {
          font-size: 16px;
          opacity: 0.9;
          text-transform: uppercase;
        }
        .breakdown {
          margin-top: 20px;
        }
        .breakdown-title {
          font-weight: bold;
          color: #800000;
          border-bottom: 1px solid #800000;
          padding-bottom: 6px;
          margin-bottom: 12px;
          font-size: 16px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          font-size: 13px;
          color: #777;
          font-style: italic;
        }
        @media print {
          body { background: none; padding: 0; }
          .card { box-shadow: none; border-radius: 0; border: 4px double #800000; }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">आराधना प्रीमियर लीग - 2026</div>
          <div class="title">आराधना रिपोर्ट कार्ड</div>
        </div>
        
        <div class="profile-row">
          <span class="label">नाम / Name</span>
          <span class="value">${state.user.name}</span>
        </div>
        <div class="profile-row">
          <span class="label">पिता/पति / Father/Husband</span>
          <span class="value">${state.user.fatherHusbandName}</span>
        </div>
        <div class="profile-row">
          <span class="label">टीम / Team</span>
          <span class="value">${state.user.teamName}</span>
        </div>
        <div class="profile-row">
          <span class="label">भूमिका / Role</span>
          <span class="value">${roleText}</span>
        </div>
        <div class="profile-row">
          <span class="label">मोबाइल / Mobile</span>
          <span class="value">${state.user.mobile}</span>
        </div>
        <div class="profile-row">
          <span class="label">आयु / Age</span>
          <span class="value">${state.user.age}</span>
        </div>
        
        <div class="score-box">
          <div class="score-val">${rep.score}</div>
          <div class="score-lbl">कुल रन / TOTAL RUNS</div>
        </div>
        
        <div class="breakdown">
          <div class="breakdown-title">स्कोर विवरण / Runs Breakdown</div>
          <div class="profile-row">
            <span class="label">क्विक सिंगल (1 रन)</span>
            <span class="value">${rep.cat1Count} रन</span>
          </div>
          <div class="profile-row">
            <span class="label">मैनेजमेंट बाउंड्री (4 रन)</span>
            <span class="value">${rep.cat4Count} रन</span>
          </div>
          <div class="profile-row">
            <span class="label">इट्स अिक्सर (6 रन)</span>
            <span class="value">${rep.cat6Count} रन</span>
          </div>
          <div class="profile-row">
            <span class="label">विशेष एक-बार स्कोर</span>
            <span class="value">${rep.onetimeCount} रन</span>
          </div>
          <div class="profile-row">
            <span class="label">सक्रिय दिन / Active Days</span>
            <span class="value">${rep.activeDays} / ${rep.totalPossibleDays}</span>
          </div>
        </div>
        
        <div class="footer">
          चातुर्मास आराधना लीग 2026 - हनुमंत नगर चोरड़िया भवन
        </div>
      </div>
      <script>
        window.onload = function() {
          window.print();
        };
      </scrip` + `t>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

function openReportModal() {
  const modal = document.getElementById("report-modal");
  const preview = document.getElementById("report-preview");
  const translations = TRANSLATIONS[state.currentLanguage];
  
  // Set modal text translations
  document.getElementById("t-reportTitle").innerText = translations.reportTitle;
  
  // Set report preview
  preview.innerText = getReportText();
  
  // Show modal
  modal.style.display = "flex";
}

function closeReportModal() {
  document.getElementById("report-modal").style.display = "none";
}

function downloadReportTxt() {
  const text = getReportText();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `APL_2026_Report_Card_${state.user.name.replace(/\s+/g, '_')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function copyWhatsAppReport() {
  const text = getWhatsAppText();
  navigator.clipboard.writeText(text).then(() => {
    alert(state.currentLanguage === "hi" ? "व्हाट्सएप रिपोर्ट क्लिपबोर्ड पर कॉपी हो गई है!" : "WhatsApp report copied to clipboard!");
  }).catch(err => {
    console.error("Clipboard copy failed: ", err);
    // Fallback selection in preview element
    const preview = document.getElementById("report-preview");
    preview.innerText = text;
    alert(state.currentLanguage === "hi" ? "कॉपी करना विफल रहा। कृपया बॉक्स में दिए गए टेक्स्ट को मैन्युअल रूप से सिलेक्ट करके कॉपी करें।" : "Copy failed. Please manually copy the text in the preview box.");
  });
}

// ==========================================
// SPIRITUAL TITLE GAMIFICATION SYSTEM
// ==========================================

const SPIRITUAL_TITLES = [
  { min: 0, max: 100, titleHi: "श्रावक/श्राविका", titleEn: "Shravak/Shravika" },
  { min: 100, max: 300, titleHi: "आराधक", titleEn: "Aradhak" },
  { min: 300, max: 600, titleHi: "साधक", titleEn: "Sadhak" },
  { min: 600, max: 1000, titleHi: "धर्म वीर", titleEn: "Dharma Veer" },
  { min: 1000, max: 1500, titleHi: "तपस्वी", titleEn: "Tapasvi" },
  { min: 1500, max: Infinity, titleHi: "परम आराधक", titleEn: "Param Aradhak" }
];

function updateSpiritualTitle(score) {
  const isHi = state.currentLanguage === "hi";
  let currentTier = SPIRITUAL_TITLES[0];
  let nextTier = null;
  
  for (let i = 0; i < SPIRITUAL_TITLES.length; i++) {
    if (score >= SPIRITUAL_TITLES[i].min) {
      currentTier = SPIRITUAL_TITLES[i];
      nextTier = SPIRITUAL_TITLES[i + 1] || null;
    }
  }
  
  const currentTitleStr = isHi ? currentTier.titleHi : currentTier.titleEn;
  document.getElementById("user-spiritual-title").innerText = currentTitleStr;
  
  const progressBar = document.getElementById("title-progress-bar");
  const progressText = document.getElementById("title-progress-text");
  const nextTitleEl = document.getElementById("next-spiritual-title");
  
  if (nextTier) {
    const nextTitleStr = isHi ? nextTier.titleHi : nextTier.titleEn;
    const needed = nextTier.min - score;
    const range = nextTier.min - currentTier.min;
    const currentProgress = score - currentTier.min;
    const pct = Math.min(100, Math.max(0, (currentProgress / range) * 100));
    
    progressBar.style.width = pct + "%";
    nextTitleEl.innerText = `${nextTitleStr} (${nextTier.min})`;
    
    progressText.innerText = isHi 
      ? `अगली पदवी के लिए ${needed} और रनों की आवश्यकता है` 
      : `${needed} more runs to become ${nextTitleStr}`;
  } else {
    progressBar.style.width = "100%";
    nextTitleEl.innerText = isHi ? "शिखर पर!" : "At the Top!";
    progressText.innerText = isHi 
      ? "बधाई हो! आप उच्चतम आध्यात्मिक पदवी पर हैं।" 
      : "Congratulations! You have reached the highest title.";
  }
}
