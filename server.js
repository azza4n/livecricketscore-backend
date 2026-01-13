const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

// 🔐 Firebase setup
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(Buffer.from(process.env.FIREBASE_KEY, "base64").toString("utf8"))
  ),
});

const db = admin.firestore();
const MATCH_REF = db.collection("score").doc("live");

// 🌐 Public API – get live score
app.get("/score", async (req, res) => {
  try {
    const doc = await MATCH_REF.get();
    if (!doc.exists) {
      return res.json({});
    }
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ message: "Error fetching score" });
  }
});

// 🔐 Admin API – update score
app.post("/score", async (req, res) => {
  try {
    const { password, ...matchData } = req.body;

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

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

