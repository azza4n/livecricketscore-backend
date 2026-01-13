// server.js
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Firebase Admin using Base64 env key
if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT_BASE64");
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

// ✅ Admin password
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "livecricadmin";

// ✅ Fetch Live Score
app.get("/live-score", async (req, res) => {
  try {
    const snap = await MATCH_REF.once("value");
    res.json(snap.val() || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Admin Login API
app.post("/score", async (req, res) => {
  try {
    const { password, ...matchData } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    await MATCH_REF.set(matchData);

    res.json({ message: "Score updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Full Cricket Update Score API
const { password, ...scoreData } = req.body;

if (password !== process.env.ADMIN_PASSWORD) {
  return res.status(401).json({ message: "Incorrect password" });
}

  try {
    const matchData = {
      match_title: req.body.match_title || "Local Match",
      team1_name: req.body.team1_name || "Team 1",
      team2_name: req.body.team2_name || "Team 2",
      runs: req.body.runs || "--",
      wickets: req.body.wickets || "--",
      overs: req.body.overs || "--",
      overs_total: req.body.overs_total || "--",
      striker: req.body.striker || "--",
      non_striker: req.body.non_striker || "--",
      bowler: req.body.bowler || "--",
      target: req.body.target || "--",
      balls_remaining: req.body.balls_remaining || "--",
      notes: req.body.notes || "",
      team1_score: req.body.team1_score || "--",
      last_updated: Date.now()
    };

    res.json({ status: "✅ Updated", matchData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
