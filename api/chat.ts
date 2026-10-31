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

// Default export untuk kemudahan import jika diperlukan
export default handleChat;
