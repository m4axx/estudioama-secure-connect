import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { AccessToken } from "livekit-server-sdk";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // LiveKit Token Generation Endpoint
  app.post("/api/token", async (req, res) => {
    const { room, identity: username } = req.body;

    if (!room || !username) {
      return res.status(400).json({ error: "Missing room or identity" });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return res.status(500).json({ 
        error: "LiveKit environment variables are not configured.",
        configured: {
            apiKey: !!apiKey,
            apiSecret: !!apiSecret,
            wsUrl: !!wsUrl
        }
      });
    }

    try {
      const at = new AccessToken(apiKey, apiSecret, {
        identity: username as string,
      });

      at.addGrant({ 
        roomJoin: true, 
        room: room as string,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      });

      const token = await at.toJwt();
      res.json({ token, wsUrl });
    } catch (error) {
      console.error("Token generation error:", error);
      res.status(500).json({ error: "Failed to generate token" });
    }
  });

  // Vite middleware for development
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
