import * as crypto from 'crypto';

/**
 * 🛡️ Engawa Cycle: Notary Service (Native Implementation)
 * 
 * 外部ライブラリを使わず、Node.js 標準の crypto モジュールのみで
 * データのハッシュ化と公証の準備を行います。
 */

export interface NotarizationProof {
  hash: string;
  timestamp: string;
  topicId?: string;
  status: 'pending' | 'notarized';
}

export class NotaryService {
  /**
   * データの SHA-256 ハッシュを生成する
   */
  static createHash(data: string | object): string {
    const rawData = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(rawData).digest('hex');
  }

  /**
   * メッセージを公証用の形式に整形する
   */
  static prepareNotaryBlock(agentId: string, message: string): string {
    const timestamp = new Date().toISOString();
    const payload = {
      v: '1.0',
      aid: agentId,
      msg: message,
      ts: timestamp
    };
    
    const hash = this.createHash(payload);
    console.log(`🛡️ Notary: Hash generated [${hash.substring(0, 8)}...]`);
    
    return JSON.stringify({
      ...payload,
      h: hash
    });
  }
}
