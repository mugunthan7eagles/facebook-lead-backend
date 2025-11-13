import mongoose from "mongoose";

const facebookConfigSchema = new mongoose.Schema({
  pageId: String,
  pageName: String,
  pageAccessToken: String,
  systemUserToken: String,
  adAccounts: [],
  connectedAt: Date,
});

export default mongoose.model("FacebookConfig", facebookConfigSchema);
