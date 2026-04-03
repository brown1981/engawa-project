/**
 * 📈 Engawa Cycle: F2Pool Data Bridge (Native Implementation)
 * 
 * 外部ライブラリを使わず、Node.js 標準の fetch API のみで
 * マイニングデータをリアルタイムに取得します。
 */

export interface F2PoolStats {
  hashrate: number;
  value_24h: number;
  total_paid: number;
  status: string;
}

export class F2PoolBridge {
  private static API_BASE = 'https://api.f2pool.com';

  /**
   * 指定したユーザーと通貨の統計情報を取得する
   * @param currency 'bitcoin' | 'aleo' 等
   * @param account F2Pool ユーザー名
   */
  static async fetchStats(currency: string, account: string): Promise<F2PoolStats> {
    const url = `${this.API_BASE}/${currency}/${account}`;
    console.log(`📡 Bridge: Fetching from ${url}...`);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`F2Pool API Error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      // F2Pool の共通レスポンス形式にパース
      return {
        hashrate: data.hashrate || 0,
        value_24h: data.value_24h || 0,
        total_paid: data.total_paid || 0,
        status: data.status || 'unknown'
      };
    } catch (error) {
      console.error('❌ Bridge: Fetch failed:', error);
      // 通信失敗時は安全のため 0 等のデフォルト値を返さず、
      // 上位層でエラーハンドリングできるようにスローする
      throw error;
    }
  }

  /**
   * 公証用のサマリーデータを生成
   */
  static formatForNotary(stats: F2PoolStats): string {
    return `[FACT] HR:${stats.hashrate} | 24H:${stats.value_24h} | Paid:${stats.total_paid}`;
  }
}
