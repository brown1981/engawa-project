import { createClient } from '@supabase/supabase-js';
import { decrypt } from '../lib/security/encryption';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMClient {
  private static cachedMasterKey: string | null = null;

  /**
   * 合鍵（マスターキー）を環境変数または .env.local から確実に取得する
   */
  private static getMasterKey(): string {
    if (this.cachedMasterKey !== null) return this.cachedMasterKey;

    // 1. 環境変数 (Cloudflare Secrets / Shell Env) を最優先
    let key = process.env.ENCRYPTION_MASTER_KEY || '';

    // 2. 環境変数にない場合、手元の .env.local を自力で探しに行く
    if (!key) {
      try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, 'utf8');
          const match = content.match(/ENCRYPTION_MASTER_KEY\s*=\s*(.+)/);
          if (match && match[1]) {
            key = match[1].trim();
          }
        }
      } catch (e) {
        console.warn('⚠️ [LLMClient] Failed to load .env.local manually:', e);
      }
    }

    this.cachedMasterKey = key;
    return key;
  }

  private static async getSecureKey(provider: string): Promise<string> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const masterKey = this.getMasterKey();

    const { data: configData } = await supabase.from('system_config').select('*').limit(1).maybeSingle();
    const aiKeys = configData?.config_data?.aiKeys || {};
    const rawValue = aiKeys[provider];

    if (!rawValue) return '';
    if (typeof rawValue === 'string' && rawValue.startsWith('ENC:')) {
      if (!masterKey) {
        console.error('❌ [LLMClient] Cannot decrypt: ENCRYPTION_MASTER_KEY is NOT set in environment.');
        return '';
      }
      try {
        return await decrypt(rawValue.slice(4), masterKey);
      } catch (e) {
        console.error(`❌ [LLMClient] Decryption failed for ${provider}:`, e);
        return '';
      }
    }
    return String(rawValue);
  }

  /**
   * OpenAI (GPT-4o) を呼び出す
   */
  static async chatOpenAI(messages: ChatMessage[]): Promise<string> {
    const apiKey = await this.getSecureKey('openai');
    
    if (!apiKey || apiKey.length < 20) {
      return "[OpenAI API Key Missing] スケルトンモードで応答します。";
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: messages,
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('❌ OpenAI API Error:', error);
      throw error;
    }
  }

  /**
   * Anthropic (Claude 3.5 Sonnet) を呼び出す
   */
  static async chatAnthropic(messages: ChatMessage[]): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-ant-xxxx')) {
      return "[Anthropic API Key Missing] スケルトンモードで応答します。";
    }

    // Anthropic は system を別に扱う必要がある
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          system: systemMessage,
          messages: userMessages,
          max_tokens: 1024
        })
      });

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('❌ Anthropic API Error:', error);
      throw error;
    }
  }
}
