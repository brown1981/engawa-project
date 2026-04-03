import { NextRequest, NextResponse } from 'next/server';
import { EmailService } from '@/services/email_service';

/**
 * 📧 Engawa Cycle: Outbound Email API
 */

export async function POST(request: NextRequest) {
  try {
    const { to, subject, text, html } = await request.json();

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await EmailService.sendEmail({
      to,
      subject,
      text,
      html
    });

    if (!result) {
      return NextResponse.json({ error: 'Email service failure' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id });

  } catch (err: any) {
    console.error('❌ Send Email API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
