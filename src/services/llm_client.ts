/**
 * 🤖 LLM Client: OpenAI & Anthropic Bridge
 * 
 * エージェントが実際に思考し、会話するための LLM 呼び出しを担当します。
 * Node.js 24+ の native fetch を使用して、依存関係を最小限に抑えています。
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class LLMClient {
  /**
   * OpenAI (GPT-4o) を呼び出す
   */
  static async chatOpenAI(messages: ChatMessage[]): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-xxxx')) {
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
