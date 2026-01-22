const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// ================= FIREBASE =================
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!serviceAccountBase64) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64");
}

const serviceAccount = JSON.parse(
  Buffer.from(serviceAccountBase64, "base64").toString("utf8")
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
  res.send("LiveCricScore backend running");
});

// Get live score
app.get("/score", async (req, res) => {
  try {
    const doc = await SCORE_REF.get();
    res.json(doc.exists ? doc.data() : {});
  } catch (e) {
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await SCORE_REF.set(data, { merge: true });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Update failed" });
  }
});

// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on port", PORT));

