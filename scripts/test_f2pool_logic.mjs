// --- 🧪 Self-contained testing of the F2Pool bridge logic ---
const API_BASE = 'https://api.f2pool.com';

async function fetchStats(currency, account) {
  const slugs = currency === 'bitcoin' ? ['bitcoin', 'btc'] : [currency];
  console.log(`--- 🛰️ Testing F2Pool slugs for ${account} ---`);

  for (const slug of slugs) {
    const url = `${API_BASE}/${slug}/${account}`;
    console.log(`📡 Bridge Test: Fetching from ${url}...`);

    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ SUCCESS: ${slug} endpoint works!`);
        console.log('Data:', JSON.stringify(data, null, 2));
        return data;
      }
      console.warn(`⚠️  ${slug} returned ${response.status}`);
    } catch (error) {
      console.error(`❌ Fetch failed for ${slug}:`, error.message);
    }
  }
  return null;
}

fetchStats('bitcoin', 'privatebrown').then(result => {
  if (!result) {
    console.error('❌ All F2Pool attempts failed with 404/Error.');
  }
});
