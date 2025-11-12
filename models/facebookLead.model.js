import mongoose from "mongoose";

const facebookLeadSchema = new mongoose.Schema(
  {
    organizationId: String,
    branchId: String,
    pageId: String,
    leadgen_id: String,
    form_id: String,
    ad_id: String,
    Name: String,
    email: String,
    mobileNumber: String,
    source: { type: String, default: "Facebook" },
    leadDate: Date,
  },
  { timestamps: true }
);

export default mongoose.model("FacebookLead", facebookLeadSchema);
