/**
 * 🧠 Engawa Cycle: Agent Brain Service
 * 
 * エージェントの「性格」「役割」「思考ロジック」を定義し、
 * 司令官（大城様）のメッセージに対する最適な返信を生成します。
 */

export type AgentRole = 'ceo' | 'cfo' | 'cto' | 'cmo' | 'coo' | 'assistant';

interface AgentResponse {
  agentId: AgentRole;
  agentName: string;
  message: string;
}

export class AgentBrain {
  // エージェントのプロファイル定義
  private static profiles: Record<AgentRole, { name: string; avatar: string; expertise: string[] }> = {
    ceo: { name: 'Sakana AI (CEO)', avatar: '👑', expertise: ['戦略', '投資判断', 'ビジョン'] },
    cfo: { name: 'GPT-4o (CFO)', avatar: '📈', expertise: ['収支', '利回り', '財務リスク', 'F2Pool'] },
    cto: { name: 'Claude-3.5 (CTO)', avatar: '⚙️', expertise: ['ハッシュレート', '技術スタック', '効率化'] },
    cmo: { name: 'Gemini (CMO)', avatar: '📣', expertise: ['マーケティング', '市場トレンド'] },
    coo: { name: 'Antigravity (COO)', avatar: '🛡️', expertise: ['オペレーション', 'タスク管理', '実行'] },
    assistant: { name: 'System Assistant', avatar: '🤖', expertise: ['全般'] }
  };

  /**
   * メッセージ内容から最適なエージェントをアサインし、返信を生成する
   */
  static async decideResponse(commanderMessage: string): Promise<AgentResponse> {
    const msg = commanderMessage.toLowerCase();
    
    // 担当者の簡易振り分けロジック（Basics）
    let assignedRole: AgentRole = 'ceo'; // デフォルトはCEO

    if (msg.includes('収支') || msg.includes('利益') || msg.includes('円') || msg.includes('利回り')) {
      assignedRole = 'cfo';
    } else if (msg.includes('技術') || msg.includes('効率') || msg.includes('プログラム') || msg.includes('ハッシュレート')) {
      assignedRole = 'cto';
    } else if (msg.includes('進捗') || msg.includes('タスク') || msg.includes('完了')) {
      assignedRole = 'coo';
    }

    const profile = this.profiles[assignedRole];
    
    // 返信の生成（将来的にここに LLM API 呼び出しを統合可能）
    // 現状は、基盤検証用の「意思を持った」定型返信を生成
    let responseMessage = '';

    switch (assignedRole) {
      case 'cfo':
        responseMessage = `司令官、現在のF2Poolの実データを確認しました。利回りは安定傾向にあります。具体的な分析レポートを作成中ですので、少々お待ちください。`;
        break;
      case 'ceo':
        responseMessage = `承知いたしました。全体の戦略的観点から判断を下します。このまま「自律運用フェーズ」への移行を許可します。`;
        break;
      case 'coo':
        responseMessage = `オペレーションを最適化しました。全てのタスクは「Phase 4」のスケジュール通りに進捗しています。`;
        break;
      default:
        responseMessage = `指令を受信しました。内容を解析し、最適なエージェントを割り当てます。`;
    }

    return {
      agentId: assignedRole,
      agentName: profile.name,
      message: responseMessage
    };
  }
}
