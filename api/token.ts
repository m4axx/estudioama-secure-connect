import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { room, identity } = req.body as { room: string; identity: string };

  if (!room || !identity) {
    return res.status(400).json({ error: 'Missing room or identity' });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return res.status(500).json({
      error: 'LiveKit environment variables are not configured.',
      configured: {
        apiKey: !!apiKey,
        apiSecret: !!apiSecret,
        wsUrl: !!wsUrl,
      },
    });
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, { identity });

    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return res.json({ token, wsUrl });
  } catch (error) {
    console.error('Token generation error:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
}
