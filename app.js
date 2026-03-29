/**
 * InstaScore - Vanilla JavaScript Application
 * ============================================
 * Full app.js (objective-based questions + text/number/choice + skip)
 */

// ============================================
// DATA
// ============================================
 

// ============================================
// APPEL IA
// ============================================
const API_BASE_URL = "https://instascore-production.up.railway.app";


async function getAIBenchmark() {
  const res = await fetch("${API_BASE_URL}/api/benchmark", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      niche: state.answers.niche,
      bio: state.answers.bio,
      caption1: state.answers.caption1,
      caption2: state.answers.caption2,
      objective: state.objective
    })
  });

  const data = await res.json();
  return data;
}


// ========================
  // niche
  // ========================
const nicheCards = [
  { key: "fitness", label: "Fitness / Sport", icon: "💪" },
  { key: "beauty", label: "Beauté / Mode", icon: "💄" },
  { key: "business", label: "Business / Entrepreneuriat", icon: "💼" },
  { key: "creator", label: "Créateur / Lifestyle", icon: "🎥" },
  { key: "art", label: "Art / Photo / Design", icon: "🎨" },
  { key: "food", label: "Food / Cuisine", icon: "🍜" },
  { key: "other", label: "Autre", icon: "✨" },
];

let nicheStep = "niche"; // "niche" | "subniche"

const subNicheMap = {
  business: [
    { key: "ofm", label: "OFM / Agence", icon: "📈" },
    { key: "dropshipping", label: "Dropshipping", icon: "📦" },
    { key: "formation", label: "Vendeur de formations", icon: "🎓" },
    { key: "coach", label: "Coach / Consultant", icon: "🧠" },
    { key: "ecommerce", label: "E-commerce (marque)", icon: "🛍️" },
    { key: "saas", label: "SaaS / App", icon: "💻" },
    { key: "local", label: "Business local", icon: "📍" },
    { key: "other", label: "Autre", icon: "✨" },
  ],
  fitness: [
    { key: "coach_fitness", label: "Coach fitness", icon: "🏋️" },
    { key: "nutrition", label: "Nutrition", icon: "🥗" },
    { key: "sport_team", label: "Club / Team", icon: "🏟️" },
    { key: "other", label: "Autre", icon: "✨" },
  ],
  beauty: [
    { key: "makeup", label: "Make-up", icon: "💄" },
    { key: "skincare", label: "Skincare", icon: "🧴" },
    { key: "fashion", label: "Mode", icon: "👗" },
    { key: "other", label: "Autre", icon: "✨" },
  ],
};


function renderNicheScreen() {
  const grid = document.getElementById("niche-grid");
  const title = document.querySelector("#screen-niche h2");
  const subtitle = document.querySelector("#screen-niche .subtitle");

  if (!grid) return;

  grid.innerHTML = "";

  // ===== Étape 1 : choisir la niche =====
  if (nicheStep === "niche") {
    if (title) title.textContent = "Choisis ta niche";
    if (subtitle) subtitle.textContent = "Pour un benchmark plus précis";

    nicheCards.forEach((n) => {
      const card = document.createElement("button");
      card.className = "niche-card";
      card.innerHTML = `
        <div class="niche-emoji">${n.icon}</div>
        <div class="niche-label">${n.label}</div>
      `;
      card.onclick = () => selectNiche(n.key);
      grid.appendChild(card);
    });

    return;
  }

  // ===== Étape 2 : choisir la sous-niche =====
  const parent = state.answers.niche || "other";
  const subs = subNicheMap[parent] || [{ key: "other", label: "Autre", icon: "✨" }];

  if (title) title.textContent = "Quel type exactement ?";
  if (subtitle) subtitle.textContent = "Plus c’est précis, plus l’analyse est utile";

  subs.forEach((s) => {
    const card = document.createElement("button");
    card.className = "niche-card";
    card.innerHTML = `
      <div class="niche-emoji">${s.icon}</div>
      <div class="niche-label">${s.label}</div>
    `;
    card.onclick = () => selectSubNiche(s.key);
    grid.appendChild(card);
  });
}

function selectNiche(nicheKey) {
  state.answers.niche = nicheKey;
  state.answers.subNiche = null;

  // Si on a des sous-niches pour cette niche → étape sous-niche
  if (subNicheMap[nicheKey]) {
    nicheStep = "subniche";
    renderNicheScreen();
    return;
  }

  // sinon on continue
  nicheStep = "niche";
  state.currentQuestionIndex = 0;
  goToScreen("questionnaire");
}

function selectSubNiche(subKey) {
  state.answers.subNiche = subKey;
  nicheStep = "niche";
  state.currentQuestionIndex = 0;
  goToScreen("questionnaire");
}

function goBackToObjective() {
  if (state.currentScreen === "niche" && nicheStep === "subniche") {
    // retour à la liste des niches
    nicheStep = "niche";
    renderNicheScreen();
    return;
  }
  goToScreen("objective");
}


const questions = [
  // ========================
  // COMMUNES (BOTH)
  // ========================
  {
    id: "bio",
    type: "textarea",
    text: "Colle ta bio Instagram (optionnel)",
    skippable: true,
    placeholder: "Ex: J’aide ... à ... | DM 'START' 🚀",
    objective: "both",
  },
  {
    id: "caption1",
    type: "textarea",
    text: "Colle une légende (caption) récente (1)",
    skippable: true,
    placeholder: "Colle ici la légende d’un post récent…",
    objective: "both",
  },
  {
    id: "caption2",
    type: "textarea",
    text: "Colle une légende (caption) récente (2) (optionnel)",
    skippable: true,
    placeholder: "Optionnel si tu en as une 2ème…",
    objective: "both",
  },
  {
    id: "followers",
    type: "number",
    text: "Combien d’abonnés as-tu ?",
    skippable: false,
    placeholder: "ex: 1250",
    objective: "both",
  },
  {
    id: "likes",
    type: "number",
    text: "Combien de likes moyens par post ?",
    skippable: false,
    placeholder: "ex: 85",
    objective: "both",
  },
  {
  id: "comments",
  type: "number",
  text: "Combien de commentaires moyens par post ?",
  skippable: false,
  placeholder: "ex: 6",
  objective: "both",
  },

  // ========================
  // PERSONAL (ATTIRANT)
  // ========================
  {
    id: "photo_quality",
    type: "choice",
    text: "Ta photo de profil est-elle claire et lisible ?",
    objective: "personal",
    options: [
      { value: 4, label: "Oui, très claire" },
      { value: 3, label: "Plutôt correcte" },
      { value: 2, label: "Moyenne" },
      { value: 1, label: "Floue / peu lisible" },
    ],
  },
  {
    id: "feed_coherence",
    type: "choice",
    text: "Ton feed est-il cohérent visuellement ?",
    objective: "personal",
    options: [
      { value: 4, label: "Oui, très harmonieux" },
      { value: 3, label: "Assez cohérent" },
      { value: 2, label: "Un peu désorganisé" },
      { value: 1, label: "Pas cohérent du tout" },
    ],
  },
  {
    id: "highlights_quality",
    type: "choice",
    text: "As-tu des stories à la une bien organisées ?",
    objective: "personal",
    options: [
      { value: 4, label: "Oui, très bien organisées" },
      { value: 3, label: "Oui, mais basiques" },
      { value: 2, label: "Très peu" },
      { value: 1, label: "Aucune" },
    ],
  },
  {
    id: "posting_frequency_personal",
    type: "choice",
    text: "À quelle fréquence publies-tu ?",
    objective: "personal",
    options: [
      { value: 4, label: "Plusieurs fois par semaine" },
      { value: 3, label: "1 fois par semaine" },
      { value: 2, label: "Quelques fois par mois" },
      { value: 1, label: "Très rarement" },
    ],
  },
  {
    id: "first_impression",
    type: "choice",
    text: "Ton profil donne-t-il envie de s’abonner en 3 secondes ?",
    objective: "personal",
    options: [
      { value: 4, label: "Oui, clairement" },
      { value: 3, label: "Plutôt oui" },
      { value: 2, label: "Moyen" },
      { value: 1, label: "Non pas vraiment" },
    ],
  },

  // ========================
  // PROFESSIONAL (PRO / BUSINESS)
  // ========================
  
  
  {
    id: "offer_clarity",
    type: "choice",
    text: "Ton offre est-elle compréhensible en 3 secondes sur ton profil ?",
    objective: "professional",
    options: [
      { value: 4, label: "Oui, très claire" },
      { value: 3, label: "Assez claire" },
      { value: 2, label: "Un peu floue" },
      { value: 1, label: "Pas claire du tout" },
    ],
  },
  {
    id: "cta_presence",
    type: "choice",
    text: "Ta bio contient-elle un appel à l’action (CTA) clair ?",
    objective: "professional",
    options: [
      { value: 4, label: "Oui (DM, lien, offre...)" },
      { value: 3, label: "Oui mais pas optimisé" },
      { value: 2, label: "Très léger" },
      { value: 1, label: "Aucun CTA" },
    ],
  },
  {
    id: "social_proof",
    type: "choice",
    text: "Montres-tu des preuves sociales (résultats, avis, clients) ?",
    objective: "professional",
    options: [
      { value: 4, label: "Oui, régulièrement" },
      { value: 3, label: "Parfois" },
      { value: 2, label: "Rarement" },
      { value: 1, label: "Jamais" },
    ],
  },
  {
    id: "content_value",
    type: "choice",
    text: "Ton contenu apporte-t-il de la valeur (éducation, conseils, expertise) ?",
    objective: "professional",
    options: [
      { value: 4, label: "Oui, beaucoup" },
      { value: 3, label: "Assez utile" },
      { value: 2, label: "Peu de valeur" },
      { value: 1, label: "Surtout basique" },
    ],
  },
  {
    id: "conversion_optimization",
    type: "choice",
    text: "Ton profil est-il optimisé pour convertir (clients / leads) ?",
    objective: "professional",
    options: [
      { value: 4, label: "Oui, optimisé" },
      { value: 3, label: "Partiellement" },
      { value: 2, label: "Pas vraiment" },
      { value: 1, label: "Pas du tout" },
    ],
  },
];

const tips = [
  "La bio = première impression",
  "La cohérence visuelle attire l'œil",
  "L'authenticité crée la connexion",
  "La régularité bat l'algorithme",
  "Les stories renforcent la confiance",
  "Un bon positionnement te démarque",
  "L'engagement vaut plus que les likes",
  "La qualité prime sur la quantité",
];

const loadingTexts = [
  "Analyse de ta bio...",
  "Évaluation visuelle...",
  "Calcul de l'engagement...",
  "Génération des recommandations...",
];

const funFacts = [
  "Les profils avec une bio claire obtiennent plus de clics.",
  "Une cohérence visuelle augmente la mémorisation.",
  "Un CTA simple peut doubler les DM.",
  "Les stories régulières renforcent la confiance.",
];

const nicheBenchmarks = {
  fitness: {
    name: "Fitness / Sport",
    goodEngagement: 3.5,
    greatEngagement: 5.0,
    mustHave: ["Reels réguliers", "Avant/Après", "Preuve sociale", "CTA DM / lien"],
  },
  beauty: {
    name: "Beauté / Mode",
    goodEngagement: 2.8,
    greatEngagement: 4.5,
    mustHave: ["Visuels cohérents", "UGC / avis", "Routines", "Reels courts"],
  },
  business: {
    name: "Business / Entrepreneuriat",
    goodEngagement: 2.2,
    greatEngagement: 3.5,
    mustHave: ["Offre claire", "CTA", "Preuve sociale", "Contenu éducatif"],
  },
  creator: {
    name: "Créateur / Lifestyle",
    goodEngagement: 3.0,
    greatEngagement: 4.5,
    mustHave: ["Storytelling", "Face-cam", "Authenticité", "Reels trends"],
  },
  art: {
    name: "Art / Photo / Design",
    goodEngagement: 2.5,
    greatEngagement: 4.0,
    mustHave: ["Portfolio clair", "Carrousels process", "Avant/Après", "Signature visuelle"],
  },
  food: {
    name: "Food / Cuisine",
    goodEngagement: 3.2,
    greatEngagement: 5.0,
    mustHave: ["Recettes courtes", "Plans serrés", "Reels hooks", "Séries (formats récurrents)"],
  },
  other: {
    name: "Autre",
    goodEngagement: 2.8,
    greatEngagement: 4.2,
    mustHave: ["Bio claire", "CTA", "Cohérence", "Reels réguliers"],
  },
};

const axisIcons = {
  bio: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
  photos: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
  coherence: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  positioning: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
};

// ============================================
// STATE
// ============================================

let state = {
  currentScreen: "welcome",
  objective: null, // "personal" | "professional"
  answers: {},
  currentQuestionIndex: 0,
  result: null,
  selectedPlan: "monthly",
  isPremium: false,
  premiumToken: null,
};

// ============================================
// DOM ELEMENTS/ screen
// ============================================

const screens = {
  welcome: document.getElementById("screen-welcome"),
  objective: document.getElementById("screen-objective"),
  niche: document.getElementById('screen-niche'),
  questionnaire: document.getElementById("screen-questionnaire"),
  loading: document.getElementById("screen-loading"),
  result: document.getElementById("screen-result"),
  paywall: document.getElementById("screen-paywall"),
  premium: document.getElementById("screen-premium"),
};

// ============================================
// HELPERS
// ============================================

function getActiveQuestions() {
  return questions.filter(
    (q) => q.objective === "both" || q.objective === state.objective
  );
}

// ============================================
// NAVIGATION
// ============================================
// ============================================
// NAVIGATION
// ============================================

function goToScreen(screenName) {

  // sécurité premium
  if (screenName === "premium" && !state.isPremium) {
    screenName = "paywall";
  }

  Object.values(screens).forEach((screen) => {
    if (screen) screen.classList.remove("active");
  });

  const target = screens[screenName];

  if (!target) {
    console.error("Screen introuvable:", screenName);
    return;
  }

  target.classList.add("active");
  state.currentScreen = screenName;
  

  if (screenName === "questionnaire") renderQuestion();
  if (screenName === "loading") startLoading();
  if (screenName === "result") renderResult();
  if (screenName === "paywall") startCountdown();
  if (screenName === "premium") renderPremium();
}
// ============================================
// OBJECTIVE SCREEN
// ============================================

function selectObjective(objective) {
  state.objective = objective;
  state.answers = {};
  state.currentQuestionIndex = 0;

  // ✅ Niche seulement si "pro"
  if (objective === "professional") {
    goToScreen("niche");
    renderNicheScreen();
  } else {
    // personal → pas besoin de niche
    state.answers.niche = "other"; // valeur par défaut
    goToScreen("questionnaire");
  }
}

// ============================================
// QUESTIONNAIRE SCREEN
// ============================================

function renderQuestion() {
  const active = getActiveQuestions();
  const question = active[state.currentQuestionIndex];

  if (!question) {
    // fallback safety
    calculateResult();
    goToScreen("loading");
    return;
  }

  const progress = ((state.currentQuestionIndex + 1) / active.length) * 100;

  document.getElementById("current-q").textContent =
    state.currentQuestionIndex + 1;
  document.getElementById("total-q").textContent = active.length;

  document.getElementById("progress-fill").style.width = `${progress}%`;
  document.getElementById("progress-percent").textContent = `${Math.round(
    progress
  )}%`;
  document.getElementById("questions-left").textContent = `${
    active.length - state.currentQuestionIndex - 1
  } questions restantes`;

  document.getElementById(
    "tip-text"
  ).textContent = `Astuce : ${tips[state.currentQuestionIndex % tips.length]}`;

  const themeIcon = document.getElementById("theme-icon");
  if (state.objective === "personal") {
    themeIcon.style.background = "rgba(255, 107, 157, 0.2)";
    themeIcon.style.color = "#FF6B9D";
  } else {
    themeIcon.style.background = "rgba(78, 205, 196, 0.2)";
    themeIcon.style.color = "#4ECDC4";
  }

  document.getElementById("question-text").textContent = question.text;

  const optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = "";

  // ===== TEXTAREA / NUMBER =====
  if (question.type === "textarea" || question.type === "number") {
    const wrap = document.createElement("div");
    wrap.style.display = "grid";
    wrap.style.gap = "12px";

    const input = document.createElement(
      question.type === "textarea" ? "textarea" : "input"
    );
    input.id = "free-input";
    input.placeholder = question.placeholder || "";
    input.className = "free-input";
    if (question.type === "number") input.type = "number";

    const saved = state.answers[question.id];
    input.value = saved && saved !== "__SKIP__" ? saved : "";

    // Skip checkbox (bio/captions)
    if (question.skippable) {
      const skipRow = document.createElement("label");
      skipRow.className = "skip-row";
      skipRow.innerHTML = `
        <input type="checkbox" id="skipCheck" />
        <span>Je n’en ai pas</span>
      `;

      wrap.appendChild(skipRow);

      const skipCheck = skipRow.querySelector("#skipCheck");
      skipCheck.checked = state.answers[question.id] === "__SKIP__";

      const applySkip = () => {
        const isSkip = skipCheck.checked;
        if (isSkip) {
          state.answers[question.id] = "__SKIP__";
          input.value = "";
          input.disabled = true;
          input.style.opacity = "0.6";
        } else {
          if (state.answers[question.id] === "__SKIP__")
            delete state.answers[question.id];
          input.disabled = false;
          input.style.opacity = "1";
          input.focus();
        }
      };

      skipCheck.addEventListener("change", applySkip);
      applySkip();
    }

    wrap.appendChild(input);

    const error = document.createElement("div");
    error.id = "q-error";
    error.style.color = "#fb7185";
    error.style.display = "none";
    error.textContent = "Merci de répondre avant de continuer.";
    wrap.appendChild(error);

    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent =
      state.currentQuestionIndex === active.length - 1
        ? "Lancer l’analyse"
        : "Suivant";
    btn.onclick = () => submitFreeAnswer();
    wrap.appendChild(btn);

    optionsContainer.appendChild(wrap);
    return;
  }

  // ===== CHOICE (QCM) =====
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.innerHTML = `
      <div class="option-radio"></div>
      <span>${option.label}</span>
    `;
    button.onclick = () => selectAnswer(option.value);

    button.style.opacity = "0";
    button.style.transform = "translateY(20px)";
    setTimeout(() => {
      button.style.transition = "all 0.3s ease";
      button.style.opacity = "1";
      button.style.transform = "translateY(0)";
    }, index * 50);

    optionsContainer.appendChild(button);
  });
}

function selectAnswer(value) {
  const active = getActiveQuestions();
  const q = active[state.currentQuestionIndex];
  state.answers[q.id] = value;
  nextQuestion();
}

function submitFreeAnswer() {
  const active = getActiveQuestions();
  const q = active[state.currentQuestionIndex];

  // Skip = valide
  if (state.answers[q.id] === "__SKIP__") {
    nextQuestion();
    return;
  }

  const input = document.getElementById("free-input");
  const error = document.getElementById("q-error");
  const raw = (input?.value ?? "").toString().trim();

  let ok = true;

  if (q.type === "number") {
    const n = Number(raw);
    if (q.id === "followers") ok = Number.isFinite(n) && n > 0;
    else ok = Number.isFinite(n) && n >= 0;
  } else {
    ok = raw.length >= 5;
  }

  if (!ok) {
    if (error) error.style.display = "block";
    return;
  }

  if (error) error.style.display = "none";
  state.answers[q.id] = q.type === "number" ? Number(raw) : raw;
  nextQuestion();
}

function nextQuestion() {
  const active = getActiveQuestions();
  if (state.currentQuestionIndex < active.length - 1) {
    state.currentQuestionIndex++;
    renderQuestion();
  } else {
    calculateResult();
    goToScreen("loading");
  }
}

function prevQuestion() {
  const active = getActiveQuestions();

  if (state.currentQuestionIndex > 0) {
    const currentQ = active[state.currentQuestionIndex];
    delete state.answers[currentQ.id];

    state.currentQuestionIndex--;
    renderQuestion();
  } else {
    goToScreen("objective");
  }
}

// ============================================
// LOADING SCREEN
// ============================================

let loadingInterval;
let factInterval;

function startLoading() {
  let textIndex = 0;
  let factIndex = 0;

  const loadingText = document.getElementById("loading-text");
  const factText = document.getElementById("fact-text");
  const dots = document.querySelectorAll(".loading-dots .dot");

  if (loadingInterval) clearInterval(loadingInterval);
  if (factInterval) clearInterval(factInterval);

  loadingText.textContent = loadingTexts[0];
  if (factText) factText.textContent = funFacts[0];

  loadingInterval = setInterval(() => {
    textIndex = (textIndex + 1) % loadingTexts.length;
    loadingText.textContent = loadingTexts[textIndex];

    dots.forEach((dot, i) => dot.classList.toggle("active", i === textIndex));
  }, 600);

  factInterval = setInterval(() => {
    factIndex = (factIndex + 1) % funFacts.length;
    if (!factText) return;

    factText.style.opacity = "0";
    setTimeout(() => {
      factText.textContent = funFacts[factIndex];
      factText.style.opacity = "1";
    }, 300);
  }, 3000);

  setTimeout(() => {
    clearInterval(loadingInterval);
    clearInterval(factInterval);
    goToScreen("result");
  }, 3500);
}


// ============================================
// RESULT CALCULATION / benchmark
// ============================================

// ===== Benchmark "Attractif" (personal) =====
const attractifBenchmarks = {
  default: {
    name: "Attractif / Lifestyle",
    goodEngagement: 3.0,
    greatEngagement: 4.5,
    mustHave: [
      "Photo de profil claire (visage visible)",
      "Bio simple (3 lignes max) + 2-3 mots clés",
      "Feed cohérent (couleurs / style)",
      "Stories régulières + highlights propres",
      "Reels courts (1-3 / semaine)"
    ],
  }
};

function generateBenchmarkInsights() {
  const nicheKey = state.answers.niche || "other";
  const bm = nicheBenchmarks[nicheKey] || nicheBenchmarks.other;

  const followers = Number(state.answers.followers || 0);
  const likes = Number(state.answers.likes || 0);
  const engagement = followers > 0 ? (likes / followers) * 100 : 0;

  const bio = String(state.answers.bio || "").trim();
  const caption1 = String(state.answers.caption1 || "").trim();
  const caption2 = String(state.answers.caption2 || "").trim();
  const captionsProvided = (caption1 && caption1 !== "__SKIP__") || (caption2 && caption2 !== "__SKIP__");

  const insights = [];
  const sub = state.answers.subNiche;
  if (sub && sub !== "other") {
  insights.unshift(`Benchmark orienté ${sub.toUpperCase()} (dans ${bm.name}).`);
  }

  // Engagement vs benchmark
  if (engagement >= bm.greatEngagement) {
    insights.push(`Ton engagement (${engagement.toFixed(2)}%) est au-dessus des comptes performants en ${bm.name}.`);
  } else if (engagement >= bm.goodEngagement) {
    insights.push(`Ton engagement (${engagement.toFixed(2)}%) est dans la moyenne haute en ${bm.name}.`);
  } else {
    insights.push(`Ton engagement (${engagement.toFixed(2)}%) est sous les standards observés en ${bm.name} (souvent ${bm.goodEngagement}%+).`);
  }

  // Bio benchmark
  if (!bio || bio === "__SKIP__" || bio.length < 20) {
    insights.push("Les profils qui performent ont une bio ultra claire : qui tu aides + résultat + preuve/CTA.");
  } else {
    insights.push("Ta bio est présente : pour benchmarker, assure-toi d’avoir une promesse + un CTA visible.");
  }

  // Captions benchmark
  if (!captionsProvided) {
    insights.push("Les comptes performants utilisent des captions structurées : hook → valeur → CTA (question / DM).");
  } else {
    insights.push("Tu utilises des captions : pense à ajouter plus de hooks et d’appels à l’action pour booster l’engagement.");
  }

  // Must-have list (safe)
  insights.push(`Dans ${bm.name}, les “bons comptes” ont souvent : ${bm.mustHave.join(", ")}.`);

  return insights.slice(0, 4); // max 4 lignes premium
}

function generateAttractifBenchmarkInsights() {
  const bm = attractifBenchmarks.default;

  const followers = Number(state.answers.followers || 0);
  const likes = Number(state.answers.likes || 0);

  // 💡 Engagement simple (ton compromis) : likes / followers * 100
  const engagement = followers > 0 ? (likes / followers) * 100 : 0;

  const bio = String(state.answers.bio || "").trim();
  const caption1 = String(state.answers.caption1 || "").trim();
  const caption2 = String(state.answers.caption2 || "").trim();

  const photoQ = Number(state.answers.photo_quality ?? 4); // 1..4
  const feedQ = Number(state.answers.feed_coherence ?? 4);
  const highlightsQ = Number(state.answers.highlights_quality ?? 4);
  const freqQ = Number(state.answers.posting_frequency_personal ?? 4);
  const firstImpressionQ = Number(state.answers.first_impression ?? 4);

  const insights = [];

  // 1) Engagement vs benchmark
  if (engagement >= bm.greatEngagement) {
    insights.push(`✅ Engagement ${engagement.toFixed(2)}% : au-dessus des profils attirants (top).`);
  } else if (engagement >= bm.goodEngagement) {
    insights.push(`🟡 Engagement ${engagement.toFixed(2)}% : bon, mais améliorable pour être “très attractif”.`);
  } else {
    insights.push(`❌ Engagement ${engagement.toFixed(2)}% : sous la moyenne des profils attirants (${bm.goodEngagement}%+).`);
  }

  // 2) Photo de profil
  if (photoQ <= 2) {
    insights.push("📸 Photo de profil : trop faible. Les profils attirants ont une photo claire avec visage visible.");
  } else {
    insights.push("📸 Photo de profil : OK. Pour “wow”, vise lumière + cadrage visage + fond simple.");
  }

  // 3) Feed
  if (feedQ <= 2) {
    insights.push("🎨 Feed : manque de cohérence. Les comptes attirants ont un style reconnaissable (couleurs/ambiance).");
  } else {
    insights.push("🎨 Feed : plutôt cohérent. Garde 1 style et évite les posts “hors thème”.");
  }

  // 4) Stories / highlights
  if (highlightsQ <= 2) {
    insights.push("📌 Stories à la une : à améliorer. Les profils attirants montrent leur lifestyle + highlights propres.");
  } else {
    insights.push("📌 Stories à la une : OK. Ajoute 2-3 highlights “vibes” (daily, travel, gym, etc.).");
  }

  // 5) Fréquence
  if (freqQ <= 2) {
    insights.push("⚡ Fréquence : trop faible. Les profils attractifs postent souvent 1–3 fois / semaine.");
  } else {
    insights.push("⚡ Fréquence : correcte. Passe sur un rythme stable pour rester visible.");
  }

  // Bonus bio/captions (sans rallonger)
  const bioProvided = bio && bio !== "__SKIP__";
  const captionsProvided =
    (caption1 && caption1 !== "__SKIP__") || (caption2 && caption2 !== "__SKIP__");

  if (!bioProvided) {
    insights.push("📝 Bio : absente. Les profils attirants mettent 2-3 mots clés + ville/emoji.");
  } else if (bio.length < 15) {
    insights.push("📝 Bio : trop courte. Mets 2-3 mots clés (lifestyle) + emoji.");
  }

  if (!captionsProvided) {
    insights.push("💬 Captions : absentes. Une simple question en fin de post booste l’engagement.");
  }

  // Must-have final (safe)
  insights.push(`✨ Les profils attirants “top” ont souvent : ${bm.mustHave.join(", ")}.`);

  // On limite à 5 lignes max pour pas spam
  return insights.slice(0, 5);
}

function engagementRating(eng) {
  if (eng >= 5) return { label: "Excellent", color: "#22c55e" };
  if (eng >= 3) return { label: "Bon", color: "#a3e635" };
  if (eng >= 1.5) return { label: "Moyen", color: "#f59e0b" };
  return { label: "Faible", color: "#fb7185" };
}

// petit helper pour “pertes” d’interactions/post
function computeLostInteractionsPerPost({ followers, likes, comments }) {
  const f = Number(followers || 0);
  if (!f) return 0;

  const l = Number(likes || 0);
  const c = Number(comments || 0);

  // ton compromis : (likes + comments*2)/followers*100
  const eng = ((l + c * 2) / f) * 100;

  // cible “raisonnable” selon taille (simple, crédible)
  // <2k : 4% ; <10k : 3% ; sinon 2%
  let target = 2;
  if (f < 2000) target = 4;
  else if (f < 10000) target = 3;

  // interactions attendues = target% * followers
  const targetInteractions = (target / 100) * f;
  const currentInteractions = (l + c * 2);

  return Math.max(0, Math.round(targetInteractions - currentInteractions));
}

function buildImprovementPlan() {
  const objective = state.objective; // "personal" | "professional"
  const a = state.answers || {};

  const followers = Number(a.followers || 0);
  const likes = Number(a.likes || 0);
  const comments = Number(a.comments || 0); // si tu n’as pas “comments”, ça reste 0

  const bio = (a.bio && a.bio !== "__SKIP__") ? String(a.bio).trim() : "";
  const caption1 = (a.caption1 && a.caption1 !== "__SKIP__") ? String(a.caption1).trim() : "";
  const caption2 = (a.caption2 && a.caption2 !== "__SKIP__") ? String(a.caption2).trim() : "";

  const eng = followers > 0 ? ((likes + comments * 2) / followers) * 100 : 0;
  const lost = computeLostInteractionsPerPost({ followers, likes, comments });
  const rating = engagementRating(eng);

  const plan = [];

  // ====== BLOCS COMMUNS (pour tout le monde)
  // 1) Bio
  if (!bio || bio.length < 20) {
    plan.push({
      title: "Bio qui convertit (10 min)",
      why: `Ta bio est trop faible → tu perds des abonnements/leads. À ce niveau d’engagement (${eng.toFixed(2)}% • ${rating.label}), tu “perds” ~${lost} interactions/post faute de clarté.`,
      steps: [
        "Ligne 1 : qui tu es + pour qui",
        "Ligne 2 : résultat/promesse (très simple)",
        "Ligne 3 : preuve (chiffre/avis/niche) ou différenciation",
        "Ligne 4 : CTA unique (DM “START” ou lien)",
      ],
    });
  } else {
    plan.push({
      title: "Bio à optimiser (7 min)",
      why: `Ta bio existe, mais elle peut convertir +. Objectif : compréhension en 3 secondes.`,
      steps: [
        "Ajoute un résultat concret (avant/après, bénéfice clair)",
        "Ajoute un CTA unique (1 action)",
        "Ajoute 1 preuve (témoignage/chiffre)",
      ],
    });
  }

  // 2) Captions / Hooks
  const hasCaptions = (caption1 && caption1.length > 10) || (caption2 && caption2.length > 10);
  if (!hasCaptions) {
    plan.push({
      title: "Captions qui font réagir (10 min)",
      why: "Sans captions, tu perds des commentaires → donc l’algorithme te montre moins.",
      steps: [
        "Hook (phrase choc) en 1 ligne",
        "2–3 lignes de valeur (conseil concret)",
        "CTA : 1 question OU “réponds par DM”",
        "1 emoji max si tu veux (pas obligatoire)",
      ],
    });
  } else {
    plan.push({
      title: "Upgrade captions (8 min)",
      why: `Tu as déjà des captions. Le levier #1 = hook + CTA pour doubler les commentaires.`,
      steps: [
        "Mets le hook en 1ère ligne (sans bla-bla)",
        "Ajoute un CTA clair (question/DM) sur chaque post",
        "Teste 1 format “série” (ex: “Astuce #1/7”)",
      ],
    });
  }

  // 3) Engagement (actions)
  plan.push({
    title: "Booster l’engagement (15 min)",
    why: `Ton engagement est ${eng.toFixed(2)}% • ${rating.label}. Objectif : +0,5 à +1,5 points en 7 jours.`,
    steps: [
      "1 post = 1 CTA (question ou DM) → pas les deux",
      "Réponds à tous les commentaires dans l’heure",
      "Stories : 1 sondage + 1 question par jour (rapide)",
      "1 Reel/semaine : hook < 1 seconde + texte à l’écran",
    ],
  });

  // ====== SPÉCIFIQUE PRO
  if (objective === "professional") {
    const offer = Number(a.offer_clarity || 0);
    const cta = Number(a.cta_presence || 0);
    const proof = Number(a.social_proof || 0);
    const value = Number(a.content_value || 0);

    if (offer <= 2) {
      plan.push({
        title: "Offre claire (10 min)",
        why: "Si ton offre est floue, personne n’achète même si ton contenu est bon.",
        steps: [
          "Écris 1 phrase : « J’aide [cible] à [résultat] en [méthode] »",
          "Ajoute-la dans la bio + en story à la une",
          "1 post épinglé = “Voici comment je peux t’aider”",
        ],
      });
    }

    if (cta <= 2) {
      plan.push({
        title: "CTA qui convertit (8 min)",
        why: "Sans CTA, tu as des vues mais zéro leads.",
        steps: [
          "Choisis 1 CTA : DM “START” OU lien",
          "Répète le CTA dans tes stories 3x/semaine",
          "Ajoute le CTA à la fin de tes captions",
        ],
      });
    }

    if (proof <= 2) {
      plan.push({
        title: "Preuve sociale (20 min)",
        why: "La preuve sociale transforme la confiance en ventes.",
        steps: [
          "1 story témoignage (même simple)",
          "1 post résultat/étude de cas",
          "1 highlight “Avis” + 3 screens minimum",
        ],
      });
    }

    if (value <= 2) {
      plan.push({
        title: "Contenu valeur (15 min)",
        why: "Si ton contenu est trop “basique”, tu n’es pas mémorable.",
        steps: [
          "Fais 1 carrousel : erreur → solution → exemple",
          "1 Reel : “3 erreurs que je vois chez…”",
          "1 post : “Check-list” téléchargeable (lead magnet simple)",
        ],
      });
    }
  }

  // ====== SPÉCIFIQUE ATTRACTIF
  if (objective === "personal") {
    const photo = Number(a.photo_quality || 0);
    const feed = Number(a.feed_coherence || 0);
    const hl = Number(a.highlights_quality || 0);
    const freq = Number(a.posting_frequency_personal || 0);
    const first = Number(a.first_impression || 0);

    if (photo <= 2) {
      plan.push({
        title: "Photo de profil (10 min)",
        why: "C’est le premier filtre. Si elle est floue, les gens scrollent.",
        steps: [
          "Visage proche + lumière naturelle",
          "Fond simple, pas d’objets derrière",
          "1 seule vibe (sérieux / fun / luxe), pas mélange",
        ],
      });
    }

    if (first <= 2) {
      plan.push({
        title: "1ère impression (12 min)",
        why: "En 3 secondes, l’utilisateur décide : follow ou non.",
        steps: [
          "Bio : qui tu es + vibe + 1 centre d’intérêt",
          "3 posts épinglés : “me”, “vibe”, “best moment”",
          "Stories à la une : “Moi”, “Lifestyle”, “Best”",
        ],
      });
    }

    if (feed <= 2) {
      plan.push({
        title: "Cohérence du feed (15 min)",
        why: "Un feed cohérent donne une impression “haut niveau”.",
        steps: [
          "Choisis 2 couleurs dominantes (max)",
          "Même style de cover pour Reels",
          "1 format récurrent (ex: selfies + activités)",
        ],
      });
    }

    if (hl <= 2) {
      plan.push({
        title: "Stories à la une (15 min)",
        why: "Ça renforce la confiance rapidement.",
        steps: [
          "Crée 3 highlights : “Moi”, “Lifestyle”, “Best”",
          "Covers simples (emoji ou icône)",
          "Mets 5 stories minimum par highlight",
        ],
      });
    }

    if (freq <= 2) {
      plan.push({
        title: "Régularité (5 min)",
        why: "La régularité augmente la visibilité + la familiarité.",
        steps: [
          "Objectif : 2 posts/semaine (ou 1 Reel + 1 photo)",
          "Stories : 3 jours/7 minimum",
          "Réutilise tes meilleurs formats (pas besoin d’inventer)",
        ],
      });
    }
  }

  // On garde un plan pas trop long (sinon c’est indigeste)
  // Premium = “wow” mais lisible.
  return plan.slice(0, 7);
}

function calculateResult() {
  const active = getActiveQuestions();

  // ===== SCORE QCM =====
  const choiceQs = active.filter((q) => q.type === "choice");
  const choiceMax = choiceQs.length * 4;

  const choiceSum = choiceQs.reduce((sum, q) => {
    const v = Number(state.answers[q.id] || 0);
    return sum + v;
  }, 0);

  const choiceScore = choiceMax > 0
    ? Math.round((choiceSum / choiceMax) * 80)
    : 0;

  // ===== ENGAGEMENT =====
  // ===== ENGAGEMENT (PRO) + HACK =====
  const followers = Number(state.answers.followers || 0);
  const likes = Number(state.answers.likes || 0);
  const comments = Number(state.answers.comments || 0);

  // (likes + comments*2)/followers * 100
  let engagement = followers > 0 ? ((likes + (comments * 2)) / followers) * 100 : 0;

  // sécurité : cap réaliste
  engagement = Math.min(engagement, 15);

  // Hack : potentiel “bon” = 7% (tu peux changer 0.07)
  const targetRate = 0.07;
  const potentialInteractions = followers > 0 ? Math.round(followers * targetRate) : 0;

  // interactions actuelles (pondérées)
  const currentInteractions = likes + (comments * 2);
  const lostInteractions = Math.max(0, potentialInteractions - currentInteractions);

  // niveau
  let engagementLevel = "";
  if (engagement < 1) engagementLevel = "Très faible";
  else if (engagement < 3) engagementLevel = "Faible";
  else if (engagement < 6) engagementLevel = "Correct";
  else if (engagement < 10) engagementLevel = "Bon";
  else engagementLevel = "Excellent";

  let engagementScore = 5;
  if (engagement > 5) engagementScore = 20;
  else if (engagement > 3) engagementScore = 15;
  else if (engagement > 1) engagementScore = 10;

  const normalizedScore = Math.min(100, choiceScore + engagementScore);

  // ===== CONSEILS INTELLIGENTS (FREE) =====
const smartTips = [];

const bio = state.answers.bio;
const caption1 = state.answers.caption1;
const caption2 = state.answers.caption2;

const hasBio = bio && bio !== "__SKIP__" && bio.trim().length >= 10;
const hasCaption = (
  (caption1 && caption1 !== "__SKIP__" && caption1.trim().length >= 10) ||
  (caption2 && caption2 !== "__SKIP__" && caption2.trim().length >= 10)
);

// --- Tips communs mais NEUTRES (pas “business”) ---
if (!hasBio) {
  smartTips.push("Bio : écris une phrase claire sur qui tu es + ce qu’on voit sur ton profil.");
} else {
  smartTips.push("Bio : rends-la plus simple et lisible (emoji + 2 lignes max).");
}

if (!hasCaption) {
  smartTips.push("Ajoute des légendes courtes : 1 idée + 1 question pour déclencher des commentaires.");
}

// --- Engagement (neutre) ---
if (engagement < 1) {
  smartTips.push("Engagement faible : fais des Reels courts avec un hook fort dès la 1ère seconde.");
} else if (engagement < 3) {
  smartTips.push("Engagement moyen : termine tes posts par une question pour générer des réponses.");
} else {
  smartTips.push("Bon engagement : garde la régularité et répète tes formats qui marchent.");
}

const improvementPlan = buildImprovementPlan();
// --- Objectif ATTIRANT (PAS de CTA business) ---
if (state.objective === "personal") {
  if ((state.answers.photo_quality ?? 4) <= 2) {
    smartTips.push("Photo de profil : visage net, bonne lumière, fond simple (ça change tout).");
  }
  if ((state.answers.feed_coherence ?? 4) <= 2) {
    smartTips.push("Feed : choisis 2–3 couleurs et garde le même style sur tes posts.");
  }
  if ((state.answers.highlights_quality ?? 4) <= 2) {
    smartTips.push("Stories à la une : ajoute “À propos”, “Lifestyle”, “Meilleurs moments”.");
  }
  smartTips.push("Stories : poste plus souvent ton quotidien (authenticité = attraction).");
}

// --- Objectif PRO (CTA OK ici) ---
if (state.objective === "professional") {
  if ((state.answers.offer_clarity ?? 4) <= 2) smartTips.push("Clarifie ton offre en 1 phrase (qui + résultat).");
  if ((state.answers.cta_presence ?? 4) <= 2) smartTips.push("Ajoute un CTA clair (DM, lien, ressource gratuite).");
  if ((state.answers.social_proof ?? 4) <= 2) smartTips.push("Ajoute des preuves sociales (avis, résultats).");
  if ((state.answers.content_value ?? 4) <= 2) smartTips.push("Publie plus de contenu éducatif pour renforcer ton expertise.");
}

// ---- Filtre final anti “conseils pro” en mode personal ----
const proWords = ["CTA", "DM", "clients", "leads", "offre", "conversion"];
const finalTips = (state.objective === "personal")
  ? smartTips.filter(t => !proWords.some(w => t.toLowerCase().includes(w.toLowerCase())))
  : smartTips;

const smartTipsLimited = finalTips.slice(0, 4);

  // ===== BENCHMARK (PREMIUM) =====
let benchmark = [];

if (state.objective === "professional") {
  benchmark = generateBenchmarkInsights(); // ton benchmark pro actuel
} else if (state.objective === "personal") {
  benchmark = generateAttractifBenchmarkInsights(); // ✅ nouveau benchmark attractif
}

  const nicheName =
  (state.objective === "professional")
    ? (nicheBenchmarks[state.answers.niche || "other"] || nicheBenchmarks.other).name
    : attractifBenchmarks.default.name;

  // ===== AXES (UI) =====
  const axes = [
    { id: "bio", name: "Bio", score: normalizedScore },
    { id: "photos", name: "Photos", score: Math.max(0, normalizedScore - 5) },
    { id: "coherence", name: "Cohérence", score: Math.max(0, normalizedScore - 10) },
    { id: "positioning", name: "Positionnement", score: Math.max(0, normalizedScore - 7) },
  ].sort((a, b) => a.score - b.score);

  let feedback;
  if (normalizedScore >= 75) feedback = "Profil très solide avec un fort potentiel de croissance.";
  else if (normalizedScore >= 55) feedback = "Bon potentiel, mais plusieurs optimisations peuvent booster ton profil.";
  else feedback = "Ton profil nécessite une optimisation stratégique pour performer.";

  state.result = {
    score: normalizedScore,
    unlockedAxis: axes[0],
    lockedAxes: axes.slice(1),
    feedback,
    engagement: engagement.toFixed(2),
    engagementLevel,
    potentialInteractions,
    currentInteractions,
    lostInteractions,
    improvementPlan,
    

    // Free
    smartTips: smartTipsLimited,

    // Premium benchmark
    benchmark,
    nicheName,
  };
  
}

// ============================================
// RESULT SCREEN
// ============================================



function renderResult() {
  const { score, unlockedAxis, lockedAxes, feedback, engagement } = state.result;

  animateScore(score);
  document.getElementById("score-feedback").textContent = feedback;

  // Engagement text (assure-toi d'avoir <p id="engagement-text" ...> dans ton HTML)
  

  // Render unlocked axis
  document.getElementById("unlocked-name").textContent = unlockedAxis.name;
  document.getElementById("unlocked-desc").textContent =
    `Ton ${unlockedAxis.name.toLowerCase()} nécessite des améliorations pour maximiser ton impact.`;
  document.getElementById("unlocked-value").textContent = `${Math.round(unlockedAxis.score)}/100`;
  document.getElementById("unlocked-progress").style.width = `${unlockedAxis.score}%`;

  // Render locked axes
  const lockedGrid = document.getElementById("locked-grid");
  lockedGrid.innerHTML = "";

  lockedAxes.forEach((axis) => {
    const card = document.createElement("div");
    card.className = "locked-card";
    card.onclick = () => goToScreen("paywall");
    card.innerHTML = `
      <div class="locked-overlay">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>Premium</span>
      </div>
      <div class="locked-icon">${axisIcons[axis.id] || ""}</div>
      <div class="locked-name">${axis.name}</div>
    `;
    lockedGrid.appendChild(card);
  });
  
  // ===== SMART TIPS =====
  const tipsContainer = document.getElementById("smart-tips");

 if (tipsContainer) {
  tipsContainer.innerHTML = "";
 state.result.smartTips.forEach((tip, i) => {
  const li = document.createElement("li");
  li.textContent = tip;
  li.style.opacity = "0";
  li.style.transform = "translateY(6px)";
  tipsContainer.appendChild(li);

  setTimeout(() => {
    li.style.transition = "all .25s ease";
    li.style.opacity = "1";
    li.style.transform = "translateY(0)";
  }, 80 * i);
});
}}

function animateScore(targetScore) {
  const scoreElement = document.getElementById("score-value");
  const duration = 2000;
  const steps = 80;
  const increment = targetScore / steps;
  let current = 0;

  const timer = setInterval(() => {
    current += increment;
    if (current >= targetScore) {
      scoreElement.textContent = targetScore;
      clearInterval(timer);
    } else {
      scoreElement.textContent = Math.round(current);
    }
  }, duration / steps);
}

// ============================================
// PAYWALL SCREEN
// ============================================

let countdownInterval;

function startCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);

  let hours = 23;
  let minutes = 59;
  let seconds = 59;

  const countdownEl = document.getElementById("countdown");

  countdownInterval = setInterval(() => {
    if (seconds > 0) {
      seconds--;
    } else if (minutes > 0) {
      minutes--;
      seconds = 59;
    } else if (hours > 0) {
      hours--;
      minutes = 59;
      seconds = 59;
    }

    if (countdownEl) {
      countdownEl.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
  }, 1000);

  const nicheEl = document.getElementById("bm-niche");
const listEl = document.getElementById("bm-list");

if (nicheEl) nicheEl.textContent = state.result?.nicheName || "ta niche";
if (listEl) {
  listEl.innerHTML = "";
  (state.result?.benchmark || []).forEach(line => {
    const li = document.createElement("li");
    li.textContent = line;
    listEl.appendChild(li);
  });
}
}

function selectPlan(plan) {
  state.selectedPlan = plan;
  document.getElementById("card-monthly")?.classList.toggle("selected", plan === "monthly");
  document.getElementById("card-lifetime")?.classList.toggle("selected", plan === "lifetime");
}

function subscribe() {
  startStripeCheckout();
}


function renderPremium() {
  const planBox = document.getElementById("plan-box");
  if (!planBox) return;

  planBox.innerHTML = "";

  const plan = state.result?.improvementPlan || [];
  if (plan.length === 0) {
    planBox.innerHTML = "<p style='opacity:.75'>Plan indisponible. Lance une analyse avant.</p>";
    return;
  }

  plan.forEach((item) => {
    const div = document.createElement("div");
    div.className = "plan-item";
    div.innerHTML = `
      <strong>${item.title}</strong>
      <p class="plan-why">${item.why}</p>
      <ul class="plan-steps">${item.steps.map(s => `<li>${s}</li>`).join("")}</ul>
    `;
    planBox.appendChild(div);
  });
}

// ============================================
// PARTICLES (optional, if your HTML has #particles)
// ============================================

function initParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  container.innerHTML = "";

  for (let i = 0; i < 20; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.background = ["#D4A574", "#FF6B9D", "#4ECDC4", "#8B5CF6"][Math.floor(Math.random() * 4)];
    particle.style.animationDelay = `${Math.random() * 4}s`;
    particle.style.animationDuration = `${4 + Math.random() * 4}s`;
    container.appendChild(particle);
  }
}

// ============================================
// INITIALIZATION
// ============================================

async function loadSession() {
  const url = new URL(window.location.href);
  const key = url.searchParams.get("key");

  if (!key) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/session/${key}`);

    if (res.status === 404) {
      console.log("Session non trouvée");
      history.replaceState({}, "", window.location.pathname);
      return;
    }

    const data = await res.json();

    if (!data.success) {
      history.replaceState({}, "", window.location.pathname);
      return;
    }

    state.answers = data.payload.answers || {};
    state.result = data.payload.result || null;
    state.objective = data.payload.objective || null;

    history.replaceState({}, "", window.location.pathname);

    if (state.isPremium) {
      goToScreen("premium");
    } else if (state.result) {
      goToScreen("result");
    }
  } catch (e) {
    console.error("Session load error", e);
  }
}

async function restorePremiumAccess() {
  const url = new URL(window.location.href);
  const tokenFromUrl = url.searchParams.get("premium_token");
  const token = tokenFromUrl || localStorage.getItem("instascore_premium_token");

  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/api/premium-access/${token}`);
    const data = await res.json();

    if (!data.success) {
      localStorage.removeItem("instascore_premium_token");
      if (tokenFromUrl) history.replaceState({}, "", window.location.pathname);
      return false;
    }

    state.isPremium = true;
    state.premiumToken = token;
    localStorage.setItem("instascore_premium_token", token);

    if (tokenFromUrl) {
      history.replaceState({}, "", window.location.pathname);
    }

    return true;
  } catch (e) {
    console.error("restorePremiumAccess error", e);
    return false;
  }
}

async function runAIBenchmark() {
  if (!state.isPremium || !state.premiumToken) {
    goToScreen("paywall");
    alert("Le benchmark IA est réservé aux utilisateurs premium.");
    return;
  }

  const payload = {
    objective: state.objective,
    niche: state.answers.niche || "other",
    subNiche: state.answers.subNiche || "other",
    bio: state.answers.bio === "__SKIP__" ? "" : (state.answers.bio || ""),
    caption1: state.answers.caption1 === "__SKIP__" ? "" : (state.answers.caption1 || ""),
    caption2: state.answers.caption2 === "__SKIP__" ? "" : (state.answers.caption2 || ""),
    followers: state.answers.followers || 0,
    likes: state.answers.likes || 0,
    comments: state.answers.comments || 0,
  };

  // ===== Anti-gaspillage (cache front) =====
  state._bmCache = state._bmCache || new Map();
  const cacheKey = JSON.stringify(payload);
  const cached = state._bmCache.get(cacheKey);
  if (cached) {
    renderBenchmark(cached);
    return;
  }

  showBenchmarkLoading(true);

  try {
    const res = await fetch("${API_BASE_URL}/api/benchmark", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-premium-token": "test" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data?.success) {
      throw new Error(data?.error || "Erreur IA");
    }

    state._bmCache.set(cacheKey, data.data);
    renderBenchmark(data.data);
  } catch (e) {
    console.error(e);
    renderBenchmarkError("❌ Erreur : impossible de générer le benchmark (serveur allumé ? clé API ?).");
  } finally {
    showBenchmarkLoading(false);
  }
}

function showBenchmarkLoading(isLoading) {
  const overlay = document.getElementById("benchmark-loading");
  const btns = document.querySelectorAll('#screen-premium .benchmark-btn');

  if (overlay) overlay.classList.toggle("hidden", !isLoading);
  btns.forEach((b) => {
    b.disabled = isLoading;
    b.classList.toggle("is-loading", isLoading);
  });
}

function renderBenchmarkError(message) {
  const container = document.getElementById("benchmark-result");
  if (!container) return;
  container.innerHTML = `<div class="bm-error">${message}</div>`;
} 
function renderBenchmark(data) {
  const container = document.getElementById("benchmark-result");
  if (!container) return;

  const b = data.benchmark || {};
  const diag = Array.isArray(data.diagnostic) ? data.diagnostic : [];
  const wins = Array.isArray(data.quickWins) ? data.quickWins : [];
  const planObj = data.plan7Days && typeof data.plan7Days === "object" ? data.plan7Days : {};

  const chips = `
    <div class="bm-chips">
      <span class="bm-chip">ER: <b>${Number(b.engagementRate ?? 0).toFixed(2)}%</b></span>
      <span class="bm-chip">${escapeHtml(b.engagementLabel || "—")}</span>
      <span class="bm-chip">Actuel: <b>${b.currentInteractionsPerPost ?? 0}</b>/post</span>
      <span class="bm-chip">Cible: <b>${b.expectedInteractionsPerPost ?? 0}</b>/post</span>
      <span class="bm-chip danger">Perdu: <b>${b.lostInteractionsPerPost ?? 0}</b>/post</span>
    </div>
  `;

  const diagHtml = diag
    .slice(0, 3)
    .map((x) => `<li>${escapeHtml(x)}</li>`)
    .join("");

  const winsHtml = wins
    .slice(0, 4)
    .map((w) => `
      <div class="bm-card">
        <div class="bm-card-title">${escapeHtml(w.title || "Quick win")}</div>
        <div class="bm-card-body">${escapeHtml(w.action || "")}</div>
      </div>
    `)
    .join("");

  const planHtml = Object.entries(planObj)
    .slice(0, 7)
    .map(([dayKey, steps]) => {
      const safeSteps = Array.isArray(steps) ? steps.slice(0, 3) : [];
      const dayLabel = dayKey.replace("day", "Jour ");

      return `
        <details class="bm-day">
          <summary><span>${escapeHtml(dayLabel)}</span></summary>
          <ul>${safeSteps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
        </details>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="bm-header">
      <h3>${escapeHtml(data.headline || "Benchmark IA")}</h3>
      ${chips}
      <p class="bm-why">${escapeHtml(b.whyItMatters || "")}</p>
    </div>

    <div class="bm-grid">
      <div class="bm-panel">
        <div class="bm-panel-title">Diagnostic</div>
        <ul class="bm-list">${diagHtml || "<li>—</li>"}</ul>
      </div>

      <div class="bm-panel">
        <div class="bm-panel-title">Quick wins (48h)</div>
        <div class="bm-cards">${winsHtml || "<div class='bm-empty'>—</div>"}</div>
      </div>

      <div class="bm-panel bm-panel-wide">
        <div class="bm-panel-title">Plan 7 jours</div>
        <div class="bm-days">${planHtml || "<div class='bm-empty'>—</div>"}</div>
      </div>
    </div>

    <div class="bm-hook">${escapeHtml(data.upgradeHook || "")}</div>
  `;
}  
// Petit helper (sécurité XSS)
function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function goToCheckout() {
  // si l'utilisateur n'est pas sur la page paywall, on y va
  if (state.currentScreen !== "paywall") goToScreen("paywall");

  // puis on scroll sur la zone pricing
  setTimeout(() => {
    const pricing = document.querySelector("#screen-paywall .pricing-section");
    if (pricing) {
      pricing.scrollIntoView({ behavior: "smooth", block: "start" });
      pricing.classList.add("pulse");
      setTimeout(() => pricing.classList.remove("pulse"), 1200);
    }
  }, 50);
}


// ========================
// SESSION STORAGE
// ========================

// UPDATE SESSION


async function saveMySession(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  const payload = {
    answers: state.answers,
    result: state.result,
    objective: state.objective
  };

  try {
    const res = await fetch("${API_BASE_URL}/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!data.success) {
      alert("Erreur sauvegarde");
      return false;
    }

    const popup = document.getElementById("save-popup");
    const link = document.getElementById("save-link");

    if (!popup || !link) {
      alert("Popup introuvable");
      return false;
    }

    link.value = window.location.origin + "?key=" + data.token;
    popup.style.display = "flex";
    history.replaceState({}, "", window.location.pathname);

    return false;
  } catch (err) {
    console.error("saveMySession error:", err);
    alert("Impossible de sauvegarder l'analyse");
    return false;
  }
}

function closeSavePopup() {
  const popup = document.getElementById("save-popup");
  if (popup) popup.style.display = "none";
}

window.saveMySession = saveMySession;
window.closeSavePopup = closeSavePopup;

// Expose globalement

window.closeSavePopup = closeSavePopup;

function copySaveLink(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const input = document.getElementById("save-link");
  if (!input) return;

  input.select();
  navigator.clipboard.writeText(input.value);
  alert("Lien copié ✅");
}

document.addEventListener("DOMContentLoaded", async () => {
  initParticles();
  goToScreen("welcome");

  await restorePremiumAccess();
  await loadSession();

  const saveBtn = document.getElementById("save-analysis-btn");
  if (saveBtn) {
    saveBtn.onclick = saveMySession;
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSavePopup();
    }
  });
});
// bouton stripe

async function startStripeCheckout() {
  try {
    const res = await fetch("${API_BASE_URL}/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan: state.selectedPlan
      })
    });

    const data = await res.json();

    if (!data.success || !data.url) {
      alert(data.error || "Erreur Stripe");
      return;
    }

    window.location.href = data.url;
  } catch (err) {
    console.error(err);
    alert("Impossible de lancer le paiement");
  }
}
window.startStripeCheckout = startStripeCheckout;
window.copySaveLink = copySaveLink;
window.saveMySession = saveMySession;

// Expose functions globally for onclick handlers
window.goToScreen = goToScreen;
window.selectObjective = selectObjective;
window.selectAnswer = selectAnswer;
window.prevQuestion = prevQuestion;
window.selectPlan = selectPlan;
window.subscribe = subscribe;
window.goBackToObjective = goBackToObjective;
window.selectSubNiche = selectSubNiche;
window.buildImprovementPlan = buildImprovementPlan;
// rendre accessible au onclick HTML
window.runAIBenchmark = runAIBenchmark;
window.goToCheckout = goToCheckout;
