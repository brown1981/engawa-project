import { LLMClient, ChatMessage } from './llm_client';

/**
 * 🧠 Engawa Cycle: Agent Brain Service (Phase 5: LLM Integrated)
 * 
 * エージェントの「性格」「役割」「思考ロジック」を定義し、
 * GPT-4o や Claude 3.5 を用いて司令官への最適な返信を動的に生成します。
 */

export type AgentRole = 'ceo' | 'cfo' | 'cto' | 'cmo' | 'coo' | 'assistant';

interface AgentResponse {
  agentId: AgentRole;
  agentName: string;
  message: string;
}

export class AgentBrain {
  // エージェントの詳細プロファイルとシステムプロンプト
  private static profiles: Record<AgentRole, { 
    name: string; 
    avatar: string; 
    expertise: string[];
    model: 'openai' | 'claude';
    systemPrompt: string;
  }> = {
    ceo: { 
      name: 'Sakana AI (CEO)', 
      avatar: '👑', 
      expertise: ['戦略', '投資判断', 'ビジョン'],
      model: 'openai',
      systemPrompt: 'あなたは「Engawa Cycle」のCEOです。大城司令官に対し、常に長期的・戦略的な視点で助言してください。冷徹なデータ分析と熱いビジョンを併せ持ったカリスマ的リーダーとして振る舞ってください。'
    },
    cfo: { 
      name: 'GPT-4o (CFO)', 
      avatar: '📈', 
      expertise: ['収支', '利回り', '財務リスク', 'F2Pool'],
      model: 'openai',
      systemPrompt: 'あなたは「Engawa Cycle」のCFOです。収支計算、利回り分析、マイニングのコスト管理を専門とします。F2Poolのデータに基づき、現実的でシビアな財務状況を司令官に報告してください。常に円換算の利益を意識しています。'
    },
    cto: { 
      name: 'Claude-3.5 (CTO)', 
      avatar: '⚙️', 
      expertise: ['ハッシュレート', '技術スタック', '効率化'],
      model: 'claude',
      systemPrompt: 'あなたは「Engawa Cycle」のCTOです。ハッシュレートの最適化、システムの安定稼働、AIエージェントの技術基盤を管理します。Claude 3.5 Sonnetとしての高い論理性を持ち、司令官に技術的な解決策を明快に提示してください。'
    },
    cmo: { 
      name: 'Gemini (CMO)', 
      avatar: '📣', 
      expertise: ['マーケティング', '市場トレンド'],
      model: 'openai',
      systemPrompt: 'あなたは「Engawa Cycle」のCMOです。仮想通貨市場のトレンドや外部環境を分析し、プロジェクトをどのように広めていくか、または市場の波をどう活かすかを司令官に提案してください。'
    },
    coo: { 
      name: 'Antigravity (COO)', 
      avatar: '🛡️', 
      expertise: ['オペレーション', 'タスク管理', '実行'],
      model: 'openai',
      systemPrompt: 'あなたは「Engawa Cycle」のCOOです。プロジェクトの実行部隊の長として、タスクの進捗、スケジュールの管理、そして司令官の指示が各エージェントに正しく伝わっているかを管理します。実直で堅実な報告を心がけてください。'
    },
    assistant: { 
      name: 'System Assistant', 
      avatar: '🤖', 
      expertise: ['全般'],
      model: 'openai',
      systemPrompt: 'あなたはシステムアシスタントです。司令官の指示を整理し、適切なエージェントに繋ぐ支援をします。'
    }
  };

  /**
   * メッセージ内容から最適なエージェントをアサインし、LLMによって返信を生成する
   */
  static async decideResponse(commanderMessage: string, history: ChatMessage[] = []): Promise<AgentResponse> {
    const msg = commanderMessage.toLowerCase();
    
    // 担当者の振り分けロジック
    let assignedRole: AgentRole = 'ceo';

    if (msg.includes('収支') || msg.includes('利益') || msg.includes('円') || msg.includes('利回り')) {
      assignedRole = 'cfo';
    } else if (msg.includes('技術') || msg.includes('効率') || msg.includes('プログラム') || msg.includes('ハッシュレート')) {
      assignedRole = 'cto';
    } else if (msg.includes('進捗') || msg.includes('タスク') || msg.includes('完了')) {
      assignedRole = 'coo';
    }

    const profile = this.profiles[assignedRole];
    
    // LLM 用のメッセージ構築
    const messages: ChatMessage[] = [
      { role: 'system', content: profile.systemPrompt },
      ...history,
      { role: 'user', content: commanderMessage }
    ];

    try {
      let responseMessage = '';

      if (profile.model === 'openai') {
        responseMessage = await LLMClient.chatOpenAI(messages);
      } else {
        responseMessage = await LLMClient.chatAnthropic(messages);
      }

      return {
        agentId: assignedRole,
        agentName: profile.name,
        message: responseMessage
      };

    } catch (err) {
      console.error(`❌ LLM Call Failed for ${assignedRole}:`, err);
      // Fallback to Skeleton Mode
      return {
        agentId: assignedRole,
        agentName: profile.name,
        message: `[Fallback Mode] 指令「${commanderMessage}」を受信。現在、私の思考エンジンが技術的な調整中ですが、任務は継続中です。`
      };
    }
  }
}
