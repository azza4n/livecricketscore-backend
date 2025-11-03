// server.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Firebase Admin initialization using Base64 secret
if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64 env var");
  process.exit(1);
}
const serviceAccountJson = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  "base64"
).toString("utf8");
const serviceAccount = JSON.parse(serviceAccountJson);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();
const MATCH_REF = db.ref("livecricscore/match");

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "changeme";

// ✅ Get Live Score
app.get("/live-score", async (req, res) => {
  try {
    const snapshot = await MATCH_REF.once("value");
    const match = snapshot.val() || {};
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Admin Login
app.post("/admin/login", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }
  return res.status(401).json({ ok: false, error: "Wrong password" });
});

// ✅ Update Score (Admin Protected)
app.post("/admin/update", async (req, res) => {
  const { password, match, score, overs, wickets, notes } = req.body;

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const data = {
      match: match || "Local Match",
      score: score || "0/0",
      overs: overs || "0.0",
      wickets: wickets || 0,
      notes: notes || "",
      last_updated: Date.now()
    };

    await MATCH_REF.set(data);

    res.json({ status: "Updated", data });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on PORT ${PORT}`));
