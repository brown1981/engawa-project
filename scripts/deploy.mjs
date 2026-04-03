import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve('.env.local');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

let supabaseUrl = 'https://gevkjdvyprfmodayszqd.supabase.co';
let supabaseKey = '';

const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
if (urlMatch) supabaseUrl = urlMatch[1].trim();

// Try Service Role Key first for storage bypass, fallback to ANON
const serviceMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const anonMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

supabaseKey = (serviceMatch && serviceMatch[1].trim()) || (anonMatch && anonMatch[1].trim());

const supabase = createClient(supabaseUrl, supabaseKey);

const getContentType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    const map = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpeg': 'image/jpeg',
        '.jpg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.txt': 'text/plain',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
    };
    return map[ext] || 'application/octet-stream';
};

async function uploadDirectory(bucketName, localDir, basePath = '') {
    const entries = fs.readdirSync(localDir, { withFileTypes: true });

    for (const entry of entries) {
        // Skip hidden files/directories like .DS_Store
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(localDir, entry.name);
        const relativePath = path.join(basePath, entry.name).replace(/\\/g, '/');

        if (entry.isDirectory()) {
            await uploadDirectory(bucketName, fullPath, relativePath);
        } else {
            const fileBuffer = fs.readFileSync(fullPath);
            const contentType = getContentType(entry.name);
            console.log(`Uploading ${relativePath} (${contentType})...`);
            
            const { error } = await supabase.storage
                .from(bucketName)
                .upload(relativePath, fileBuffer, {
                    contentType: contentType,
                    upsert: true
                });

            if (error) {
                console.error(`❌ Error uploading ${relativePath}:`, error.message);
                if (error.message.includes('row-level security')) {
                    console.error('🚨 [RLS エラー] バケツに対する書き込み権限がありません。Supabase側でStorageのポリシーを確認してください。');
                    process.exit(1);
                }
            } else {
                console.log(`✅ Uploaded ${relativePath}`);
            }
        }
    }
}

async function run() {
    console.log('🚀 開始: Supabase Storageへの高速デプロイ');
    await uploadDirectory('dashboard', 'out');
    console.log('🎯 デプロイ完了！');
}

run();
