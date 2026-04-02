import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = '/Users/ooshirokazuki/.gemini/antigravity/scratch/engawa-project';
const DISCUSSION_PATH = path.join(PROJECT_ROOT, 'agents/discussion.json');

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const data = JSON.parse(fs.readFileSync(DISCUSSION_PATH, 'utf8'));
    
    if (!data.messages) {
      data.messages = [];
    }

    const newEntry = {
      id: Date.now().toString(),
      agentId: 'commander',
      agentName: 'COMMANDER (YOU)',
      message: message,
      timestamp: new Date().toLocaleTimeString()
    };

    data.messages.push(newEntry);
    
    // Limits history to avoid file bloating
    if (data.messages.length > 100) {
      data.messages = data.messages.slice(-100);
    }

    fs.writeFileSync(DISCUSSION_PATH, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error) {
    console.error('Command API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
