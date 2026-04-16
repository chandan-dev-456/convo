import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "node:http";
import { connectToSocket } from "./src/controllers/socketManager.js";

const app = express();
const server = createServer(app);

const io = connectToSocket(server);

import mongoose from "mongoose";
import cors from "cors";
import userRoutes from './src/routes/users.route.js';

app.set("port", process.env.PORT || 8000);

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.get("/home", (req, res) => {
  res.send("Home route");
});

app.use("/api/v1", userRoutes);

const connectionDb = await mongoose.connect(process.env.MONGO_URI);
console.log(`Mongo db connected`);

server.listen(app.get("port"), '0.0.0.0', () => {
  console.log(`Server running on port ${app.get("port")}`);
  console.log(`Local: http://localhost:${app.get("port")}`);
  console.log(` Network: http://YOUR_IP:${app.get("port")}`);
});