import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Supabaseからエージェント一覧を取得
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .order('id', { ascending: true });

    if (agentsError) throw agentsError;

    // 2. SupabaseからKPIを取得
    const { data: kpis, error: kpisError } = await supabase
      .from('kpis')
      .select('*');

    if (kpisError) throw kpisError;

    // 3. Supabaseから最新のメッセージ履歴を取得
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (messagesError) throw messagesError;

    // フォーマットを以前のJSON形式に合わせる
    const kpiMap = kpis.reduce((acc: any, kpi: any) => {
      acc[kpi.id] = {
        value: kpi.value,
        target: kpi.target,
        trend: kpi.trend
      };
      return acc;
    }, {});

    return NextResponse.json({
      agents: agents,
      discussion: messages?.reverse() || [],
      kpis: {
        dscr: kpiMap.dscr || { value: 0, target: 0, trend: 'neutral' },
        cashFlow: kpiMap.cash_flow || { value: 0, target: 0, trend: 'neutral' },
        efficiency: kpiMap.efficiency || { value: 0, target: 0, trend: 'neutral' }
      },
      batchTasks: {
        pending: 0, // 今後の拡張用
        items: []
      },
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch status from Supabase' }, { status: 500 });
  }
}
