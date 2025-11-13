import express from "express";
import {
  connectFacebook,
  verifyWebhook,
  postWebhook,
  getLeads
} from "../controllers/facebook.controller.js";

const router = express.Router();

router.post("/connect", connectFacebook);

router.get("/webhook", verifyWebhook);
router.post("/webhook", express.json(), postWebhook);

router.get("/leads", getLeads);

export default router;
