import express from "express";
import { connectFacebook, postWebhook, getLeads } from "../controllers/facebook.controller.js";
import dotenv from "dotenv";

const router = express.Router();

dotenv.config();

router.post("/connect", connectFacebook);
router.post("/webhook", express.json(), postWebhook);
router.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("🔹 Verification attempt:", req.query);
  console.log("🧩 Expected token:", process.env.VERIFY_TOKEN);

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully!");
    res.status(200).send(challenge); // 👈 must send challenge back directly
  } else {
    console.log("❌ Verification failed. Token mismatch or invalid mode.");
    res.sendStatus(403);
  }
});

router.get("/leads/:organizationId", getLeads); // 👈 add this line

router.post("/webhook", express.json(), (req, res) => {
  console.log("📥 Lead Received:", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

export default router;
