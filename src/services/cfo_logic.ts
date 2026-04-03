import { F2PoolStats } from './f2pool_bridge';

/**
 * 📈 Engawa Cycle: CFO AI Decision Logic
 * 
 * F2Pool から取得した事実データを元に、
 * 経営判断（自動化の再開提案など）をシミュレーションします。
 */

export interface CFOAnalysis {
  recommendation: 'wait' | 'restart' | 'invest';
  yieldPercent: number;
  reasoning: string;
}

export class CFOLogic {
  // 自動化再開のしきい値 (5%)
  private static RESTART_THRESHOLD = 5.0;

  /**
   * 現在のマイニングデータから経営判断を下す
   */
  static async analyzeProfitability(stats: F2PoolStats): Promise<CFOAnalysis> {
    // 簡易的な利回り計算 (例: 投資額 100万円、1日 500円収益の場合)
    // 本来は外部の価格 API (CoinGecko) から取得
    const dailyIncomeJPY = stats.value_24h * 100; // ALEO 1枚 100円と仮定
    const annualIncome = dailyIncomeJPY * 365;
    const estimatedInvestment = 1000000; // 100万円の機材
    
    const yieldPercent = (annualIncome / estimatedInvestment) * 100;
    
    let recommendation: 'wait' | 'restart' | 'invest' = 'wait';
    let reasoning = '';

    if (yieldPercent >= this.RESTART_THRESHOLD) {
      recommendation = 'restart';
      reasoning = `【CFO判断】現在の推定利回りが ${yieldPercent.toFixed(2)}% に達しました。しきい値(${this.RESTART_THRESHOLD}%)を超えたため、自動化の再開を強く推奨します。`;
    } else {
      recommendation = 'wait';
      reasoning = `【CFO判断】現在の推定利回りは ${yieldPercent.toFixed(2)}% です。再開基準に達していません。引き続き静観し、最適化に努めます。`;
    }

    return {
      recommendation,
      yieldPercent,
      reasoning
    };
  }
}
