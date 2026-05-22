import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';

async function verify() {
  const BASE_URL = process.env.APP_BASE_URL || 'http://127.0.0.1:3000';
  const SUMMARY_PATH = path.join(process.cwd(), 'docs/generated/still-demo-run-summary.json');
  
  console.log('🔍 Verifying Still Command Center Demo...');
  
  // Check app connectivity
  try {
    await axios.get(BASE_URL);
    console.log(`✅ App is reachable at ${BASE_URL}`);
  } catch (e) {
    console.error(`❌ App is NOT reachable at ${BASE_URL}. Run 'npm run dev' first.`);
    process.exit(1);
  }
  
  // Check artifacts
  if (await fs.pathExists(SUMMARY_PATH)) {
    const summary = await fs.readJson(SUMMARY_PATH);
    console.log(`✅ Found run summary (Status: ${summary.status})`);
    console.log(`✅ Tests: ${summary.tests.passed}/${summary.tests.total} passed`);
    console.log(`✅ Screenshots: ${summary.screenshots.total} captured`);
    
    if (summary.pdf.created) {
      console.log(`✅ PDF walkthrough exists: ${summary.pdf.path}`);
    } else {
      console.warn(`⚠️ PDF walkthrough was NOT created.`);
    }
  } else {
    console.warn(`⚠️ No run summary found. Run 'npm run demo:audit' first.`);
  }
}

verify().catch(console.error);
