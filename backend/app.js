import dotenv from "dotenv";
dotenv.config();

import express from "express";
import {createServer} from "node:http";
import  {Server} from "socket.io";
import { connectToSocket } from "./src/controllers/socketManager.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

import mongoose from "mongoose";

import cors from "cors";

import userRoutes from './src/routes/users.route.js'

app.set("port", process.env.PORT || 8000);

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));


app.use(express.json({limit : "40kb"}));
app.use(express.urlencoded({limit : "40kb" , extended : true}));

app.get("/home",(req,res)=>{
    res.send("Home route");
});

app.use("/api/v1",userRoutes);

io.on('connection', (socket) => {
  console.log('a user connected');
});

const connectionDb = await mongoose.connect(process.env.MONGO_URI);
console.log(`Mongo db connected host ${connectionDb.connection.host}`);
server.listen(app.get("port"), ()=>{
    console.log("Listening on 8000");
});