import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import Stripe from "stripe";

dotenv.config({ path: "./backend/.env" });

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function computeEngagement({ followers, likes, comments }) {
  const f = Number(followers || 0);
  const l = Number(likes || 0);
  const c = Number(comments || 0);
  if (f <= 0) return 0;
  return ((l + c * 2) / f) * 100;
}

function engagementLabel(er) {
  if (er >= 6) return { label: "Excellent", emoji: "🟣" };
  if (er >= 3) return { label: "Bon", emoji: "🟢" };
  if (er >= 1.5) return { label: "Moyen", emoji: "🟠" };
  return { label: "Faible", emoji: "🔴" };
}

const nicheBaselines = {
  fitness: { good: 3.5, great: 5.0 },
  beauty: { good: 2.8, great: 4.5 },
  business: { good: 2.2, great: 3.5 },
  creator: { good: 3.0, great: 4.5 },
  art: { good: 2.5, great: 4.0 },
  food: { good: 3.2, great: 5.0 },
  other: { good: 2.8, great: 4.2 },
};

function expectedInteractionsPerPost({ followers, nicheKey }) {
  const base = nicheBaselines[nicheKey] || nicheBaselines.other;
  return (Number(followers || 0) * base.good) / 100;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const benchmarkCache = new Map();
const inflight = new Map();

function clip(s, max) {
  return (s || "").toString().trim().slice(0, max);
}

function makeCacheKey(body) {
  const normalized = {
    objective: body.objective || "personal",
    niche: body.niche || "other",
    subNiche: body.subNiche || "other",
    followers: Number(body.followers || 0),
    likes: Number(body.likes || 0),
    comments: Number(body.comments || 0),
    bio: clip(body.bio, 220),
    caption1: clip(body.caption1, 420),
    caption2: clip(body.caption2, 420),
  };

  const json = JSON.stringify(normalized);
  return crypto.createHash("sha256").update(json).digest("hex");
}

function getCached(key) {
  const hit = benchmarkCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    benchmarkCache.delete(key);
    return null;
  }
  return hit.value;
}

function setCached(key, value) {
  benchmarkCache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of benchmarkCache.entries()) {
    if (now > v.expiresAt) benchmarkCache.delete(k);
  }
}, 10 * 60 * 1000);

const ROOT_DIR = process.cwd();
const SESSION_DB_FILE = path.join(ROOT_DIR, "sessions.json");
const PREMIUM_DB_FILE = path.join(ROOT_DIR, "premium-access.json");

function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return {};
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
}

function newToken() {
  return crypto.randomBytes(24).toString("hex");
}

function getPremiumRecordByToken(token) {
  const db = readJSON(PREMIUM_DB_FILE);
  return db[token] || null;
}

function createPremiumToken({ checkoutSessionId, plan }) {
  const db = readJSON(PREMIUM_DB_FILE);

  for (const [token, row] of Object.entries(db)) {
    if (row.checkoutSessionId === checkoutSessionId) {
      return token;
    }
  }

  const token = newToken();
  db[token] = {
    checkoutSessionId,
    plan,
    createdAt: Date.now(),
  };
  writeJSON(PREMIUM_DB_FILE, db);
  return token;
}

function requirePremium(req, res, next) {
  const token = req.headers["x-premium-token"];
  const TEST_MODE = process.env.TEST_MODE === "true";

  // 🔥 MODE TEST (bypass)
  if (TEST_MODE && token === "test") {
    console.log("⚡ Test mode actif");
    req.premium = { test: true };
    return next();
  }

  // 🔒 mode normal
  if (!token) {
    return res.status(403).json({
      success: false,
      error: "Premium requis",
    });
  }

  const row = getPremiumRecordByToken(token);

  if (!row) {
    return res.status(403).json({
      success: false,
      error: "Jeton premium invalide",
    });
  }

  req.premium = row;
  next();
}

app.post("/api/benchmark", requirePremium, async (req, res) => {
  try {
    const key = makeCacheKey(req.body || {});
    const cached = getCached(key);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }

    if (inflight.has(key)) {
      const same = await inflight.get(key);
      return res.json({ success: true, data: same, cached: true });
    }

    const run = (async () => {
      const {
        objective = "personal",
        niche = "other",
        subNiche = "other",
        followers = 0,
        likes = 0,
        comments = 0,
      } = req.body || {};

      const bioRaw = req.body?.bio;
      const bio = (!bioRaw || bioRaw === "__SKIP__") ? "" : clip(bioRaw, 140);

      const c1Raw = req.body?.caption1;
      const caption1 = (!c1Raw || c1Raw === "__SKIP__") ? "" : clip(c1Raw, 240);

      const c2Raw = req.body?.caption2;
      const caption2 = (!c2Raw || c2Raw === "__SKIP__") ? "" : clip(c2Raw, 240);

      const er = computeEngagement({ followers, likes, comments });
      const { label } = engagementLabel(er);

      const expected = expectedInteractionsPerPost({ followers, nicheKey: niche });
      const currentInteractions = Number(likes || 0) + Number(comments || 0);
      const lost = clamp(Math.round(expected - currentInteractions), 0, 999999);

      const model = "gpt-5-mini";

      const prompt = `
Role: IG growth expert. Language: FR. No Instagram API mention.
Goal: ${objective === "professional" ? "PRO" : "ATTRACTIF"}.
Niche: ${niche}. Sub: ${subNiche}.

Stats:
followers=${followers}
likes=${likes}
comments=${comments}
er=${er.toFixed(2)} (${label})
current=${currentInteractions}
expected=${expected.toFixed(0)}
lost=${lost}

Bio: ${bio || "(vide)"}
Cap1: ${caption1 || "(vide)"}
Cap2: ${caption2 || "(vide)"}

Return ONLY valid JSON with keys:
headline, benchmark, diagnostic, quickWins, plan7Days, upgradeHook.
benchmark keys:
engagementRate, engagementLabel, currentInteractionsPerPost, expectedInteractionsPerPost, lostInteractionsPerPost, whyItMatters.
diagnostic: 3 strings.
quickWins: 5 items max {title, action}.
plan7Days: day 1..7, each 3 steps max.
Keep it short and actionable.
`.trim();

      const response = await client.responses.create({
        model,
        input: prompt,
        max_output_tokens: 700,

      });

      const text = (response.output_text || "").trim();

if (!text) {
  console.error("Réponse OpenAI vide :", JSON.stringify(response, null, 2));
  throw new Error("Réponse vide du modèle");
}

let json;

try {
  json = JSON.parse(text);
} catch {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    console.error("Réponse OpenAI non-JSON :", text);
    throw new Error("Le modèle n'a pas renvoyé de JSON valide");
  }

  json = JSON.parse(text.slice(start, end + 1));
}

      setCached(key, json);
      return json;
    })();

    inflight.set(key, run);
    const data = await run;
    inflight.delete(key);

    return res.json({ success: true, data, cached: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Server error",
    });
  }
});

app.post("/api/session", (req, res) => {
  const db = readJSON(SESSION_DB_FILE);
  const token = newToken();

  db[token] = {
    payload: req.body || {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  writeJSON(SESSION_DB_FILE, db);

  res.json({
    success: true,
    token,
  });
});

app.get("/api/session/:token", (req, res) => {
  const db = readJSON(SESSION_DB_FILE);
  const row = db[req.params.token];

  if (!row) {
    return res.status(404).json({
      success: false,
    });
  }

  res.json({
    success: true,
    payload: row.payload,
  });
});

app.put("/api/session/:token", (req, res) => {
  const db = readJSON(SESSION_DB_FILE);
  const row = db[req.params.token];

  if (!row) {
    return res.status(404).json({
      success: false,
    });
  }

  db[req.params.token] = {
    payload: req.body,
    updatedAt: Date.now(),
  };

  writeJSON(SESSION_DB_FILE, db);

  res.json({
    success: true,
  });
});

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { plan } = req.body || {};

    let mode = null;
    let priceId = null;

    if (plan === "monthly") {
      mode = "subscription";
      priceId = process.env.STRIPE_PRICE_MONTHLY;
    } else if (plan === "lifetime") {
      mode = "payment";
      priceId = process.env.STRIPE_PRICE_LIFETIME;
    } else {
      return res.status(400).json({
        success: false,
        error: "Plan invalide",
      });
    }

    if (!priceId) {
      return res.status(500).json({
        success: false,
        error: "Price Stripe manquant dans le .env",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        plan,
      },
      success_url: `${process.env.APP_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/cancel.html`,
    });

    res.json({
      success: true,
      url: session.url,
    });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Stripe error",
    });
  }
});

app.get("/api/checkout-success", async (req, res) => {
  try {
    const sessionId = req.query.session_id;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: "session_id manquant",
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const isPaid = session.payment_status === "paid" || session.status === "complete";

    if (!isPaid) {
      return res.status(403).json({
        success: false,
        error: "Paiement non confirmé",
      });
    }

    const plan = session.metadata?.plan || session.mode || "premium";
    const premiumToken = createPremiumToken({
      checkoutSessionId: session.id,
      plan,
    });

    return res.json({
      success: true,
      premiumToken,
      plan,
    });
  } catch (err) {
    console.error("Stripe success verification error:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Verification Stripe impossible",
    });
  }
});

app.get("/api/premium-access/:token", (req, res) => {
  const row = getPremiumRecordByToken(req.params.token);

  if (!row) {
    return res.status(404).json({
      success: false,
      error: "Jeton introuvable",
    });
  }

  res.json({
    success: true,
    premium: {
      plan: row.plan,
      createdAt: row.createdAt,
    },
  });
});

app.listen(process.env.PORT || 3001, () => {
  console.log("API running on port", process.env.PORT || 3001);
});

app.get("/", (req, res) => {
  res.send("API InstaScore OK");
});
