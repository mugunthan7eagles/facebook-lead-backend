import axios from "axios";
import FacebookConfig from "../models/facebookConfig.model.js"; // create model file (see below)
import FacebookLead from "../models/facebookLead.model.js";

// POST /api/facebook/connect
export const connectFacebook = async (req, res) => {
  try {
    const { organizationId, branchId, systemUserToken } = req.body;

    // 1️⃣ Validate token by fetching user info
    const me = await axios.get("https://graph.facebook.com/v20.0/me", {
      params: { access_token: systemUserToken },
    });

    // 2️⃣ Get pages accessible by this token
    const pagesRes = await axios.get("https://graph.facebook.com/v20.0/me/accounts", {
      params: { access_token: systemUserToken, fields: "id,name,access_token" },
    });

    const firstPage = pagesRes.data.data[0];
    if (!firstPage) return res.status(400).json({ message: "No Facebook Page found for this token" });

    // 3️⃣ Get ad accounts
    const adAccRes = await axios.get("https://graph.facebook.com/v20.0/me/adaccounts", {
      params: { access_token: systemUserToken, fields: "id,name" },
    });

    // 4️⃣ Save config in DB
    await FacebookConfig.updateOne(
      { organizationId },
      {
        organizationId,
        branchId,
        systemUserToken,
        pageId: firstPage.id,
        pageName: firstPage.name,
        pageAccessToken: firstPage.access_token,
        adAccounts: adAccRes.data.data,
        connectedAt: new Date(),
      },
      { upsert: true }
    );

    // 5️⃣ Subscribe page to webhook (leadgen)
    await axios.post(
      `https://graph.facebook.com/v20.0/${firstPage.id}/subscribed_apps`,
      { subscribed_fields: ["leadgen"] },
      { params: { access_token: firstPage.access_token } }
    );

    return res.json({
      success: true,
      page: firstPage,
      adAccounts: adAccRes.data.data,
    });
  } catch (err) {
    console.error("❌ Facebook Connect Error:", err.response?.data || err.message);
    return res.status(500).json({ error: err.response?.data || err.message });
  }
};




export const postWebhook = async (req, res) => {
  const entries = req.body.entry || [];

  for (let entry of entries) {
    for (let change of entry.changes || []) {
      if (change.field === "leadgen") {
        const { leadgen_id, page_id } = change.value;

        try {
          const config = await FacebookConfig.findOne({ pageId: page_id });
          if (!config) continue;

          const leadRes = await axios.get(
            `https://graph.facebook.com/v20.0/${leadgen_id}`,
            {
              params: {
                access_token: config.pageAccessToken,
                fields: "field_data,created_time,ad_id,form_id,page_id",
              },
            }
          );

          const leadData = leadRes.data;
          const fieldMap = {};
          (leadData.field_data || []).forEach((f) => {
            fieldMap[f.name] = f.values[0];
          });

          // ✅ Save lead to DB
          await FacebookLead.create({
            organizationId: config.organizationId,
            branchId: config.branchId,
            pageId: config.pageId,
            leadgen_id: leadData.id,
            form_id: leadData.form_id,
            ad_id: leadData.ad_id,
            Name: fieldMap.full_name || fieldMap.name || "",
            email: fieldMap.email || "",
            mobileNumber: fieldMap.phone_number || "",
            leadDate: leadData.created_time,
          });

          console.log(`✅ New lead saved for page ${config.pageName}`);
        } catch (err) {
          console.error("❌ Lead fetch error:", err.response?.data || err.message);
        }
      }
    }
  }

  res.sendStatus(200);
};

export const getLeads = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const leads = await FacebookLead.find({ organizationId }).sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};