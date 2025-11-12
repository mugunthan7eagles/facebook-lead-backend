import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import facebookRoutes from "./routes/facebook.routes.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ✅ MongoDB connection with logs
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

app.use("/api/facebook", facebookRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
