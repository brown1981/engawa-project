import { LLMClient } from '../src/services/llm_client.js';

async function verifyFix() {
  console.log('--- 🧪 Final Verification: LLMClient Connectivity ---');
  
  try {
    // 1. マスターキーの取得を試行（内部で .env.local を読むはず）
    // @ts-ignore (private method access for test)
    const masterKey = LLMClient.getMasterKey();
    
    if (masterKey) {
      console.log('✅ SUCCESS: Master key is now RECOGNIZED via LLMClient.');
      console.log('   Key length:', masterKey.length);
    } else {
      console.log('❌ FAILURE: Master key is still missing from LLMClient.');
    }

    // 2. 実際のセキュアキー取得を試行（DB接続を伴う）
    // ここでは DB の RLS が許可されている前提です
    console.log('\n--- 🔑 Secure Key Retrieval Test ---');
    // @ts-ignore
    const apiKey = await LLMClient.getSecureKey('openai');
    if (apiKey) {
      console.log('✅ SUCCESS: Decrypted API Key retrieved!');
      console.log('   Key prefix:', apiKey.substring(0, 7) + '...');
    } else {
      console.log('⚠️ INFO: API key found as empty. This is expected if the record is empty or decryption failed.');
    }
  } catch (e) {
    console.error('❌ CRITICAL ERROR during verification:', e);
  }
}

verifyFix();
