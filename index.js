import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import facebookRoutes from "./routes/facebook.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.log("❌ DB Error:", err.message));

app.use("/api/facebook", facebookRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log("🚀 Server running...")
);
