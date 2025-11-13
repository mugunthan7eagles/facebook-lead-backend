import axios from "axios";
import FacebookConfig from "../models/facebookConfig.model.js";
import FacebookLead from "../models/facebookLead.model.js";
import dotenv from "dotenv";

dotenv.config();

// --------------------------------------------------------
// CONNECT FACEBOOK
// --------------------------------------------------------
export const connectFacebook = async (req, res) => {
  try {
    const { systemUserToken } = req.body;

    const pagesRes = await axios.get(
      "https://graph.facebook.com/v20.0/me/accounts",
      {
        params: { access_token: systemUserToken, fields: "id,name,access_token" },
      }
    );

    const page = pagesRes.data.data[0];
    if (!page) return res.status(400).json({ message: "No Page found" });

    const adAccRes = await axios.get(
      "https://graph.facebook.com/v20.0/me/adaccounts",
      {
        params: { access_token: systemUserToken, fields: "id,name" },
      }
    );

    await FacebookConfig.deleteMany({}); // ensure only one config exists

    await FacebookConfig.create({
      pageId: page.id,
      pageName: page.name,
      pageAccessToken: page.access_token,
      systemUserToken,
      adAccounts: adAccRes.data.data,
      connectedAt: new Date(),
    });

    await axios.post(
      `https://graph.facebook.com/v20.0/${page.id}/subscribed_apps`,
      { subscribed_fields: ["leadgen"] },
      { params: { access_token: page.access_token } }
    );

    res.json({
      success: true,
      page,
      adAccounts: adAccRes.data.data,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
};


// --------------------------------------------------------
// VERIFY WEBHOOK (GET)
// --------------------------------------------------------
export const verifyWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

// --------------------------------------------------------
// WEBHOOK LEAD RECEIVER (POST)
// --------------------------------------------------------
export const postWebhook = async (req, res) => {
  const entries = req.body.entry || [];

  for (const entry of entries) {
    for (const change of entry.changes || []) {
      if (change.field === "leadgen") {
        const { leadgen_id, page_id } = change.value;

        const config = await FacebookConfig.findOne({ pageId: page_id });
        if (!config) continue;

        const leadRes = await axios.get(
          `https://graph.facebook.com/v20.0/${leadgen_id}`,
          {
            params: {
              access_token: config.systemUserToken,
              fields: "field_data,created_time,ad_id,form_id,page_id",
            },
          }
        );

        const lead = leadRes.data;

        const fields = {};
        (lead.field_data || []).forEach((f) => {
          fields[f.name] = f.values[0];
        });

        await FacebookLead.create({
          pageId: config.pageId,
          leadgen_id: lead.id,
          form_id: lead.form_id,
          ad_id: lead.ad_id,
          Name: fields.full_name || fields.name || "",
          email: fields.email || "",
          mobileNumber: fields.phone_number || "",
          leadDate: lead.created_time,
        });

        console.log("✅ Lead saved:", lead.id);
      }
    }
  }

  res.sendStatus(200);
};


// --------------------------------------------------------
// FETCH USER DATA
// --------------------------------------------------------
export const getUserData = async (req, res) => {
  const { organizationId } = req.query;

  const config = await FacebookConfig.findOne({ organizationId });

  if (!config)
    return res.json({ page: null, adAccounts: [] });

  res.json({
    page: { id: config.pageId, name: config.pageName },
    adAccounts: config.adAccounts,
  });
};

// --------------------------------------------------------
// SAVE AD ACCOUNT
// --------------------------------------------------------
export const saveConfig = async (req, res) => {
  const { organizationId, adAccountId } = req.body;

  await FacebookConfig.updateOne(
    { organizationId },
    { selectedAdAccount: adAccountId }
  );

  res.json({ success: true });
};

// --------------------------------------------------------
// GET LEADS
// --------------------------------------------------------
export const getLeads = async (req, res) => {
  const leads = await FacebookLead.find().sort({ createdAt: -1 });
  res.json({ success: true, data: leads });
};

