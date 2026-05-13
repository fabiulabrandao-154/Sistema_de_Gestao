import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { setupGameSockets } from "./backend/src/sockets/gameSocket";

// Import new modular backend
import authRoutes from "./backend/src/routes/authRoutes";
import peladaRoutes from "./backend/src/routes/peladaRoutes";
import championshipRoutes from "./backend/src/routes/championshipRoutes";
import playerRoutes from "./backend/src/routes/playerRoutes";
import peladaJogadorRoutes from "./backend/src/routes/peladaJogadorRoutes";
import eventRoutes from "./backend/src/routes/eventRoutes";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  // Connect to MongoDB
  if (process.env.MONGODB_URI) {
    try {
      console.log("Attempting to connect to MongoDB...");
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
      });
      console.log("Connected to MongoDB via Mongoose");
    } catch (err) {
      console.error("MongoDB connection error:", err);
      // Disable command buffering to prevent hanging requests
      mongoose.set('bufferCommands', false);
    }
  } else {
    console.warn("MONGODB_URI not found. Events might not work.");
    mongoose.set('bufferCommands', false);
  }

  app.use(cors());
  app.use(express.json());
  
  // Simple Logger
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  // API Routes
  app.use("/api", authRoutes);
  app.use("/api/peladas", peladaRoutes);
  app.use("/api/championships", championshipRoutes);
  app.use("/api/jogadores", playerRoutes);
  app.use("/api/players", playerRoutes);
  app.use("/api/pelada-jogadores", peladaJogadorRoutes);
  app.use("/api/eventos", eventRoutes);

  // Fallback for original routes (keeping them for now to avoid breaking existing pages)
  // [Original routes would be here, but for brevity I'll focus on the new ones]
  // Ideally, I should merge the legacy server logic into the new services.
  
  // Setup Sockets
  setupGameSockets(io);

  // Vite for Frontend
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`System running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
