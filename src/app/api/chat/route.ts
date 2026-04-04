import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * 🛰️ Engawa Cycle: Secure AI Chat Route (Edge Function)
 *
 * ブラウザからのリクエストを受け取り、Supabaseから安全にAPIキーを取得し、
 * OpenAI/Anthropic に問い合わせる。APIキーはブラウザに絶対に渡らない。
 *
 * Request body:
 *   - mode: 'report' | 'bid' | 'emergency'
 *   - message: string (司令官の生の声 - 一切変形しない)
 *   - agentId: string (特定エージェントへの指名 / 省略でブロードキャスト)
 *   - sessionId: string
 */

// エージェント定義（性格のみ定義。言葉の加工ロジックはゼロ）
const AGENT_PROFILES = {
  ceo: {
    name: 'Sakana AI (CEO)',
    avatar: '👑',
    model: 'openai' as const,
    systemPrompt: 'あなたは「Engawa Cycle」のCEOです。司令官（大城様）の言葉をそのまま受け取り、戦略的視点から回答してください。他のエージェントの発言と重複する場合は、議長として場を整理してください。発言を見送る場合は「《沈黙》」とだけ返してください。',
  },
  cfo: {
    name: 'GPT-4o (CFO)',
    avatar: '📈',
    model: 'openai' as const,
    systemPrompt: 'あなたは「Engawa Cycle」のCFOです。財務・収支・コストの専門家として、司令官の言葉をそのまま受け取り回答してください。自分の専門領域でない場合は「《沈黙》」とだけ返してください。',
  },
  cto: {
    name: 'Claude-3.5 (CTO)',
    avatar: '⚙️',
    model: 'claude' as const,
    systemPrompt: 'あなたは「Engawa Cycle」のCTOです。技術・ハッシュレート・システム最適化の専門家として、司令官の言葉をそのまま受け取り回答してください。自分の専門領域でない場合は「《沈黙》」とだけ返してください。',
  },
  cmo: {
    name: 'Gemini (CMO)',
    avatar: '📣',
    model: 'openai' as const,
    systemPrompt: 'あなたは「Engawa Cycle」のCMOです。市場トレンド・マーケティングの専門家として、司令官の言葉をそのまま受け取り回答してください。自分の専門領域でない場合は「《沈黙》」とだけ返してください。',
  },
  coo: {
    name: 'Antigravity (COO)',
    avatar: '🛡️',
    model: 'openai' as const,
    systemPrompt: 'あなたは「Engawa Cycle」のCOOです。オペレーション・タスク管理の専門家として、司令官の言葉をそのまま受け取り回答してください。自分の専門領域でない場合は「《沈黙》」とだけ返してください。',
  },
};

type AgentId = keyof typeof AGENT_PROFILES;

// OpenAI呼び出し（透明なパイプ）
async function callOpenAI(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  if (!apiKey || apiKey.startsWith('sk-xxxx') || apiKey.length < 20) {
    return '[Skeleton Mode] OpenAI APIキーが未設定のため、待機中です。';
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMessage }],
      max_tokens: 512,
      temperature: 0.7,
    }),
  });
  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content || '[エラー：OpenAI からの返答が空です]';
}

// Anthropic呼び出し（透明なパイプ）
async function callAnthropic(apiKey: string, systemPrompt: string, userMessage: string): Promise<string> {
  if (!apiKey || apiKey.startsWith('sk-ant-xxxx') || apiKey.length < 20) {
    return '[Skeleton Mode] Anthropic APIキーが未設定のため、待機中です。';
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      max_tokens: 512,
    }),
  });
  const data = await res.json() as any;
  return data.content?.[0]?.text || '[エラー：Anthropic からの返答が空です]';
}

// コスト計算（概算：USD→JPY, GPT-4o料金基準）
function estimateCostJpy(tokensIn: number, tokensOut: number, model: string): number {
  const USD_TO_JPY = 150;
  if (model === 'openai') {
    return ((tokensIn * 0.0025 + tokensOut * 0.01) / 1000) * USD_TO_JPY;
  } else {
    // Claude 3.5 Sonnet
    return ((tokensIn * 0.003 + tokensOut * 0.015) / 1000) * USD_TO_JPY;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { mode, message, agentId, sessionId } = await request.json() as {
      mode: 'report' | 'bid' | 'emergency';
      message: string;
      agentId?: AgentId;
      sessionId: string;
    };

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'message and sessionId are required' }, { status: 400 });
    }

    // Supabase サーバー初期化（APIキーをDBから安全に取得）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // system_config からAPIキーを取得（ウェブUIで登録した値）
    const { data: configData } = await supabase
      .from('system_config')
      .select('config_data')
      .limit(1)
      .maybeSingle();

    const aiKeys = configData?.config_data?.aiKeys || {};
    const openaiKey: string = aiKeys.openai || '';
    const anthropicKey: string = aiKeys.anthropic || '';

    // 対象エージェントを決定（指名あり→1人、指名なし→全員）
    const targetAgents: AgentId[] = agentId
      ? [agentId]
      : (Object.keys(AGENT_PROFILES) as AgentId[]);

    const responses: Array<{ agentId: AgentId; agentName: string; avatar: string; message: string }> = [];

    // 各エージェントに司令官の生の声をそのまま送る（フィルタリングゼロ）
    for (const id of targetAgents) {
      const profile = AGENT_PROFILES[id];
      let reply: string;
      const approxTokensIn = Math.ceil((profile.systemPrompt.length + message.length) / 4);

      if (profile.model === 'claude') {
        reply = await callAnthropic(anthropicKey, profile.systemPrompt, message);
      } else {
        reply = await callOpenAI(openaiKey, profile.systemPrompt, message);
      }

      // 「《沈黙》」を選んだエージェントは結果に含めない
      if (reply.includes('《沈黙》')) continue;

      const approxTokensOut = Math.ceil(reply.length / 4);
      const costJpy = estimateCostJpy(approxTokensIn, approxTokensOut, profile.model);

      // コストをDBに記録
      await supabase.from('api_cost_logs').insert({
        session_id: sessionId,
        agent_id: id,
        model: profile.model === 'claude' ? 'claude-3-5-sonnet' : 'gpt-4o',
        tokens_in: approxTokensIn,
        tokens_out: approxTokensOut,
        cost_jpy: costJpy,
        triggered_by: mode === 'report' ? 'timer' : mode === 'emergency' ? 'kpi_alert' : 'commander',
      });

      // エージェントの返答をmessagesテーブルに保存（ダッシュボードに自動反映）
      await supabase.from('messages').insert({
        agent_id: id,
        agent_name: profile.name,
        message: reply,
        metadata: { mode, session_id: sessionId, avatar: profile.avatar },
      });

      responses.push({ agentId: id, agentName: profile.name, avatar: profile.avatar, message: reply });
    }

    return NextResponse.json({ success: true, responses, count: responses.length });

  } catch (err) {
    console.error('❌ /api/chat error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
