import axios from "axios";
import FacebookConfig from "../models/facebookConfig.model.js";
import FacebookLead from "../models/facebookLead.model.js";
import dotenv from "dotenv";

dotenv.config();


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

    await FacebookConfig.deleteMany({}); // only 1 config

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
    res.status(500).json({ error: err.response?.data || err.message });
  }
};


export const verifyWebhook = (req, res) => {
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === process.env.VERIFY_TOKEN
  ) {
    return res.status(200).send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
};


export const postWebhook = async (req, res) => {
  console.log("📥 Incoming Facebook Webhook:", JSON.stringify(req.body, null, 2));

  const entries = req.body.entry || [];

  for (let entry of entries) {
    for (let change of entry.changes || []) {
      if (change.field === "leadgen") {
        const { leadgen_id, page_id } = change.value;

        console.log("🔍 Leadgen Event Detected:", change.value);

        try {
          const config = await FacebookConfig.findOne({ pageId: page_id });
          if (!config) {
            console.log("❌ No config found for page:", page_id);
            continue;
          }

          // 🔥 FIXED: remove page_id from fields
          const leadRes = await axios.get(
            `https://graph.facebook.com/v20.0/${leadgen_id}`,
            {
              params: {
                access_token: config.pageAccessToken,
                fields: "field_data,created_time,ad_id,form_id"
              },
            }
          );

          const lead = leadRes.data;

          console.log("📄 Lead Data Fetched From Facebook:", lead);

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

          console.log("✅ Saved Lead To Database:", lead.id);

        } catch (err) {
          console.error("❌ Lead Fetch Error:", err.response?.data || err.message);
        }
      }
    }
  }

  res.sendStatus(200);
};
  


export const getLeads = async (req, res) => {
  const leads = await FacebookLead.find().sort({ createdAt: -1 });
  res.json({ success: true, data: leads });
};
