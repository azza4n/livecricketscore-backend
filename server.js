const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// ================= FIREBASE =================
const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!base64) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64");
  process.exit(1);
}

const serviceAccount = JSON.parse(
  Buffer.from(base64, "base64").toString("utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const SCORE_REF = db.collection("score").doc("live");

// ================= CONFIG =================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "livecricadmin";

// ================= ROUTES =================

// Health check
app.get("/", (req, res) => {
  res.send("LiveCricket backend running");
});

// Get score (frontend)
app.get("/score", async (req, res) => {
  try {
    const snap = await SCORE_REF.get();
    res.json(snap.exists ? snap.data() : {});
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ error: "Failed to fetch score" });
  }
});

// Admin update
app.post("/admin/update", async (req, res) => {
  try {
    const pwd = req.body.password || req.body.adminPassword;
    if (pwd !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid admin password" });
    }

    const data = {
      // New UI fields
      title: req.body.title || "",
      teamA: req.body.teamA || "",
      teamB: req.body.teamB || "",
      striker: req.body.striker || "",
      nonstriker: req.body.nonstriker || "",
      bowler: req.body.bowler || "",
      runs: Number(req.body.runs) || 0,
      wickets: Number(req.body.wickets) || 0,
      overs: req.body.overs || "0.0",
      rr: req.body.rr || "0.00",

      // Backward compatibility (old site)
      matchTitle: req.body.title || "",
      team1: req.body.teamA || "",
      team2: req.body.teamB || "",

      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await SCORE_REF.set(data, { merge: true });
    res.json({ success: true });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

