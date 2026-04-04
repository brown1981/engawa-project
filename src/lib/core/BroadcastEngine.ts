/**
 * 🛰️ Engawa Cycle: Broadcast Engine V2
 *
 * 「フィルター・ゼロ」の精神を守る3モード自律ブロードキャストエンジン。
 * 言葉の解釈・加工はゼロ。モードの決定のみをここで行う。
 *
 * Mode 1「新聞報告」： タイマー起動 → 前日データを全員に配布
 * Mode 2「競争入札」： 司令官指示 → 全員ブロードキャスト（指名なし）
 * Mode 3「緊急召集」： KPIアラート → CEOが議長として緊急召集
 */

export type BroadcastMode = 'report' | 'bid' | 'emergency';

export interface BroadcastRequest {
  mode: BroadcastMode;
  message: string;
  agentId?: string; // @指名がある場合のみ
  sessionId: string;
}

export interface BroadcastResult {
  success: boolean;
  count: number;
  mode: BroadcastMode;
  responses: Array<{
    agentId: string;
    agentName: string;
    avatar: string;
    message: string;
  }>;
  error?: string;
}

export class BroadcastEngine {
  /**
   * モードを自動判定する（言語処理ゼロ・イベント種別のみで決定する）
   *
   * - @agentId で始まる指示 → bid モードで1人に指名
   * - kpi_alert フラグあり  → emergency モード
   * - スケジュール起動      → report モード
   * - その他              → bid モード（全員ブロードキャスト）
   */
  static detectMode(input: {
    message: string;
    isScheduled?: boolean;
    isKpiAlert?: boolean;
  }): { mode: BroadcastMode; agentId?: string } {
    if (input.isKpiAlert) {
      return { mode: 'emergency' };
    }

    if (input.isScheduled) {
      return { mode: 'report' };
    }

    // @メンション指名の検出（言葉の意味解釈ではなく記号検出のみ）
    const mentionMatch = input.message.match(/^@(ceo|cfo|cto|cmo|coo)\s/i);
    if (mentionMatch) {
      const agentId = mentionMatch[1].toLowerCase();
      // @メンション部分を除いた本文のみをエージェントに届ける
      const cleanMessage = input.message.replace(/^@\w+\s/, '');
      return { mode: 'bid', agentId };
    }

    // デフォルト：全員ブロードキャスト
    return { mode: 'bid' };
  }

  /**
   * ブロードキャストを実行する（/api/chat Edge Functionへのクライアント呼び出し）
   */
  static async broadcast(request: BroadcastRequest): Promise<BroadcastResult> {
    try {
      // Node.js (Orchestrator) などの環境では絶対URLが必要
      const baseUrl = typeof window === 'undefined' 
        ? (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') 
        : '';
      
      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        // フォールバック: ローカル開発中などで /api/chat が未起動の場合のメッセージ
        if (response.status === 404) {
          return {
            success: false,
            count: 0,
            mode: request.mode,
            responses: [],
            error: 'API endpoint not found. Deployment might be in progress.'
          };
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json() as any;
      return {
        success: true,
        count: data.count,
        mode: request.mode,
        responses: data.responses,
      };
    } catch (err: any) {
      console.error('❌ BroadcastEngine error:', err);
      return {
        success: false,
        count: 0,
        mode: request.mode,
        responses: [],
        error: err.message,
      };
    }
  }
}
