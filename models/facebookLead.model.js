import mongoose from "mongoose";

const facebookLeadSchema = new mongoose.Schema(
  {
    pageId: String,
    leadgen_id: String,
    form_id: String,
    ad_id: String,
    Name: String,
    email: String,
    mobileNumber: String,
    leadDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model("FacebookLead", facebookLeadSchema);
