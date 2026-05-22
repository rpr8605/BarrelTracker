const url = 'http://127.0.0.1:3000/login';

async function main() {
  console.log(`Checking health of ${url}...`);
  try {
    const res = await fetch(url);
    if (!res.ok && res.status !== 200) {
      throw new Error(`Health check failed: ${res.status} ${res.statusText}`);
    }
    console.log(`✅ OK: ${url} returned ${res.status}`);
  } catch (err) {
    console.error(`❌ Connection failed: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
