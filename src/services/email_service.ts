/**
 * 📧 Engawa Cycle: Email Service (Resend Bridge)
 * 
 * アプリケーション内から `@engawacycle` ドメインを送信元として
 * メールを送信するためのサービスクラスです。
 */

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private static RESEND_API_URL = 'https://api.resend.com/emails';
  private static FROM_NAME = 'Engawa Cycle (AI System)';
  // 大城様のドメインに合わせて調整が必要
  private static FROM_DOMAIN = 'engawacycle.com'; 

  /**
   * メールを送信する
   */
  static async sendEmail(params: SendEmailParams): Promise<{ id: string } | null> {
    const apiKey = process.env.RESEND_API_KEY; // ※環境変数への追加が必要

    if (!apiKey) {
      console.warn('⚠️ RESEND_API_KEY is not set. Email not sent.');
      return null;
    }

    try {
      const response = await fetch(this.RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${this.FROM_NAME} <noreply@${this.FROM_DOMAIN}>`,
          to: Array.isArray(params.to) ? params.to : [params.to],
          subject: params.subject,
          text: params.text,
          html: params.html
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API Error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      console.log(`✅ Email sent successfully: ${data.id}`);
      return data;

    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }
}
