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
   * @param secret F2P-API-SECRET リードオンリーAPIキー (任意)
   */
  static async fetchStats(currency: string, account: string, secret?: string): Promise<F2PoolStats> {
    // bitcoin の場合は btc も試行する
    const slugs = currency === 'bitcoin' ? ['bitcoin', 'btc'] : [currency];
    let lastError: any = null;

    for (const slug of slugs) {
      const url = `${this.API_BASE}/${slug}/${account}`;
      console.log(`📡 Bridge: Fetching from ${url}...`);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (secret) {
        headers['F2P-API-SECRET'] = secret;
      }

      try {
        const response = await fetch(url, { headers });
        
        if (response.ok) {
          const data: any = await response.json();
          
          // APIエラーオブジェクトが返ってきた場合 (403/401代替のレスポンスなど)
          if (data.error) {
            throw new Error(`F2Pool API JSON Error: ${data.error.message}`);
          }

          console.log(`✅ Bridge: Successfully fetched data for ${slug}`);
          return {
            hashrate: data.hashrate || 0,
            value_24h: data.value_24h || 0,
            total_paid: data.total_paid || 0,
            status: data.status || 'unknown'
          };
        }
        
        console.warn(`⚠️ Bridge: ${slug} returned ${response.status}`);
        lastError = new Error(`F2Pool API Error: ${response.status} ${response.statusText}`);
      } catch (error) {
        console.error(`❌ Bridge: Fetch failed for ${slug}:`, error);
        lastError = error;
      }
    }

    throw lastError || new Error('All attempts failed');
  }

  /**
   * 公証用のサマリーデータを生成
   */
  static formatForNotary(stats: F2PoolStats): string {
    return `[FACT] HR:${stats.hashrate} | 24H:${stats.value_24h} | Paid:${stats.total_paid}`;
  }
}
