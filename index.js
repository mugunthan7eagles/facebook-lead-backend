import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import facebookRoutes from "./routes/facebook.routes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI);
app.use("/api/facebook", facebookRoutes);

app.listen(5000, () => console.log("🚀 Backend running on port 5000"));
