import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "node:http";
import { connectToSocket } from "./src/controllers/socketManager.js";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from './src/routes/users.route.js';

const app = express();
const server = createServer(app);

connectToSocket(server);

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));


app.use("/api/v1", userRoutes);

try {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("MongoDB connected");

  const PORT = process.env.PORT || 8000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

} catch (error) {
  console.error("MongoDB connection failed:", error);
  process.exit(1);
}