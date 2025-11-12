import mongoose from "mongoose";

const facebookConfigSchema = new mongoose.Schema({
  organizationId: String,
  branchId: String,
  pageId: String,
  pageName: String,
  pageAccessToken: String,
  systemUserToken: String,
  adAccounts: [{ id: String, name: String }],
  connectedAt: Date,
});

export default mongoose.model("FacebookConfig", facebookConfigSchema);
