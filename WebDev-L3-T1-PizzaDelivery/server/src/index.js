import "dotenv/config";

import http from "node:http";
import express from "express";

import app from "./app.js";
import { attachSocketServer } from "./sockets/index.js";

// Vercel detects this as a Node/Express entry point.
// The HTTP server is exported without calling listen(), allowing
// Vercel to manage the Function lifecycle and WebSocket upgrades.
void express;

const httpServer = http.createServer(app);

attachSocketServer(httpServer);

export default httpServer;
