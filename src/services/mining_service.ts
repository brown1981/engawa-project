/**
 * 💎 Engawa Cycle: Mining Service (Data & Calculation Layer)
 * 
 * F2Pool 等のマイニングデータを処理し、収支と利回りを算出します。
 * (Phase 4: Mock Integration - 開発と検証を優先)
 */

export interface MiningStats {
  hashrate: number;      // TH/s or Sol/s
  payout_24h: number;    // ALEO or BTC
  total_payout: number;  // Total accumulated
  efficiency: number;    // %
}

export class MiningService {
  // 固定のテストデータ (Mock)
  private static mockData: MiningStats = {
    hashrate: 152.4,
    payout_24h: 12.5,
    total_payout: 840.2,
    efficiency: 98.5
  };

  /**
   * 最新のマイニング統計を取得 (現在は Mock データ)
   */
  static async getLatestStats(): Promise<MiningStats> {
    // 将来的にここに F2Pool API 呼び出しを統合
    return this.mockData;
  }

  /**
   * 現在の市場価格を元に、日本円(JPY)換算の収支を算出する
   * @param pricePerCoin 1コインあたりの価格 (JPY)
   * @param electricityCostPerDay 1日あたりの電気代 (JPY)
   */
  static calculateDailyProfit(stats: MiningStats, pricePerCoin: number, electricityCostPerDay: number) {
    const grossIncome = stats.payout_24h * pricePerCoin;
    const netProfit = grossIncome - electricityCostPerDay;
    const margin = (netProfit / grossIncome) * 100;

    return {
      grossIncome,
      netProfit,
      margin
    };
  }
}
