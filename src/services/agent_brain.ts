import { ChatMessage } from './llm_client';
import { BroadcastEngine, BroadcastMode } from '../lib/core/BroadcastEngine';

/**
 * 🧠 Engawa Cycle: Agent Brain Service (V2 - Logic Shift)
 * 
 * 旧来のキーワード振分けロジックを完全に廃止し、
 * すべての意思決定を「フィルター・ゼロ」の BroadcastEngine に移譲します。
 */

export type AgentRole = 'ceo' | 'cfo' | 'cto' | 'cmo' | 'coo' | 'assistant';

export interface AgentResponse {
  agentId: AgentRole;
  agentName: string;
  message: string;
}

export class AgentBrain {
  /**
   * メッセージ内容から最適なエージェントを自律的に決定し、返信を生成する
   * (互換性維持：旧 Orchestrator からの呼び出しに対応)
   */
  static async decideResponse(commanderMessage: string, history: ChatMessage[] = []): Promise<AgentResponse> {
    const detection = BroadcastEngine.detectMode({
      message: commanderMessage,
      isScheduled: false,
      isKpiAlert: false
    });

    const sessionId = `legacy-decide-${Date.now()}`;
    
    const result = await BroadcastEngine.broadcast({
      mode: detection.mode,
      message: commanderMessage,
      agentId: detection.agentId,
      sessionId
    });

    if (result.responses && result.responses.length > 0) {
      const mainResp = result.responses[0];
      return {
        agentId: mainResp.agentId as AgentRole,
        agentName: mainResp.agentName,
        message: mainResp.message
      };
    }

    return {
      agentId: (detection.agentId as AgentRole) || 'ceo',
      agentName: 'System',
      message: '[分析保留] エージェントが沈黙を選択しました。'
    };
  }

  /**
   * エージェント間議論（ブロードキャスト会議）のトリガー
   * (互換性維持：旧 Orchestrator からの呼び出しに対応)
   */
  static async debate(role: AgentRole, thread: ChatMessage[]): Promise<AgentResponse> {
    // 役職を指定した議論も、V2ではブロードキャスト会議の一部として扱う
    const lastMsg = thread[thread.length - 1]?.content || '議題の再確認';
    const sessionId = `legacy-debate-${Date.now()}`;
    
    const result = await BroadcastEngine.broadcast({
      mode: 'bid',
      message: lastMsg,
      agentId: role,
      sessionId
    });

    if (result.responses && result.responses.length > 0) {
      const mainResp = result.responses[0];
      return {
        agentId: mainResp.agentId as AgentRole,
        agentName: mainResp.agentName,
        message: mainResp.message
      };
    }

    return {
      agentId: role,
      agentName: 'System',
      message: '[議論継続] 思考エンジンが最適解を分析中です。'
    };
  }

  /**
   * 新しい会議の開始
   */
  static async startMeeting(agenda: string, mode: BroadcastMode = 'bid') {
    const sessionId = `meeting-${Date.now()}`;
    return await BroadcastEngine.broadcast({
      mode,
      message: agenda,
      sessionId
    });
  }
}
