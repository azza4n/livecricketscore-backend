const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// 🔐 Firebase Admin setup (BASE64)
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_KEY, "base64").toString("utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const MATCH_REF = db.collection("score").doc("live");

// 🌐 PUBLIC API — get live score
app.get("/score", async (req, res) => {
  try {
    const snap = await MATCH_REF.get();
    if (!snap.exists) {
      return res.json({});
    }
    res.json(snap.data());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch score" });
  }
});

// 🔐 ADMIN API — update score
app.post("/score", async (req, res) => {
  try {
    const { password, ...matchData } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password required" });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    await MATCH_REF.set(matchData);
    res.json({ message: "Score updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 🚀 START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
