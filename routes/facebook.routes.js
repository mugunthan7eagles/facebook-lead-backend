import express from "express";
import {
  connectFacebook,
  verifyWebhook,
  postWebhook,
  getUserData,
  saveConfig,
  getLeads
} from "../controllers/facebook.controller.js";

const router = express.Router();

router.post("/connect", connectFacebook);

router.get("/webhook", verifyWebhook);
router.post("/webhook", express.json(), postWebhook);

router.get("/leads", getLeads);
router.get("/user-data", getUserData);


export default router;
