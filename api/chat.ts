import { getScenarioConfig } from '../src/config/scenarios.config';
import { generateRoleplayReply } from '../src/services/gemini.service';

export interface ChatRequestBody {
  scenarioId: string;
  level?: 1 | 2 | 3;
  transcript: Array<{ speaker: 'user' | 'character'; text: string }>;
}

export interface ChatResponseBody {
  reply: string;
}

/**
 * Logika murni pemrosesan chat persona
 */
export async function processChat(body: ChatRequestBody): Promise<ChatResponseBody> {
  const scenarioId = body.scenarioId || 'skenario-1';
  const level = (body.level === 1 || body.level === 2 || body.level === 3) ? body.level : 2;
  const transcript = Array.isArray(body.transcript) ? body.transcript : [];

  const scenario = getScenarioConfig(scenarioId);

  try {
    const reply = await generateRoleplayReply({
      scenario,
      level,
      transcript,
    });
    return { reply: reply || scenario.fallbackReply };
  } catch (error) {
    console.error('[API Chat] Error:', error);
    return { reply: scenario.fallbackReply };
  }
}

/**
 * Web Standard Request/Response Handler (Kompatibel dengan Vercel Serverless Functions)
 */
export async function handleChat(req: Request): Promise<Response> {
  try {
    const body: ChatRequestBody = await req.json();
    const result = await processChat(body);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[API Chat Handler] Error:', error);
    return new Response(
      JSON.stringify({ reply: 'Baik, tolong lanjutkan tugasnya ya.' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Universal Vercel Serverless Function Handler (Node.js & Edge compatible)
export default async function handler(req: any, res?: any) {
  if (res && typeof res.status === 'function') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const result = await processChat(body);
      return res.status(200).json(result);
    } catch (error) {
      console.error('[API Chat Node Handler] Error:', error);
      return res.status(200).json({ reply: 'Baik, tolong lanjutkan tugasnya ya.' });
    }
  }
  return handleChat(req);
}
