import { chromium } from '@playwright/test';
import fs from 'fs-extra';
import path from 'path';
import { ScreenshotEntry } from '../tests/utils/screenshot-catalog';

async function buildPdf() {
  const MANIFEST_PATH = path.join(process.cwd(), 'docs/generated/still-demo-screenshot-manifest.json');
  const OUTPUT_HTML = path.join(process.cwd(), 'docs/generated/still-demo-walkthrough.html');
  const OUTPUT_PDF = path.join(process.cwd(), 'docs/generated/Still_Command_Center_Walkthrough.pdf');
  
  if (!(await fs.pathExists(MANIFEST_PATH))) {
    console.error('Screenshot manifest not found. Run tests first.');
    process.exit(1);
  }
  
  const catalog: ScreenshotEntry[] = await fs.readJson(MANIFEST_PATH);
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Still Command Center Walkthrough</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 40px; }
        h1 { color: #BA7517; border-bottom: 2px solid #BA7517; padding-bottom: 10px; margin-top: 60px; }
        h2 { color: #854F0B; margin-top: 40px; page-break-before: always; }
        .cover { text-align: center; padding: 100px 0; page-break-after: always; }
        .cover h1 { border-bottom: none; font-size: 48px; margin-bottom: 20px; }
        .cover p { font-size: 24px; color: #666; }
        .screenshot-container { margin: 30px 0; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .screenshot-container img { width: 100%; display: block; }
        .caption { padding: 15px; background: #f9f9f9; font-size: 14px; font-style: italic; border-top: 1px solid #eee; }
        .module-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; background: #BA7517; color: white; margin-bottom: 10px; }
        .metric-box { background: #fff8f0; border-left: 4px solid #BA7517; padding: 15px; margin: 20px 0; }
        .footer { margin-top: 100px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
        .toc { margin-bottom: 60px; }
        .toc ul { list-style: none; padding: 0; }
        .toc li { margin-bottom: 10px; }
        .toc a { color: #333; text-decoration: none; }
        .toc a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="cover">
        <div class="module-tag">STILL OS</div>
        <h1>Still Command Center</h1>
        <p>Hearth & Hollow Demo Walkthrough</p>
        <div style="margin-top: 40px; font-size: 14px; color: #999;">Generated on ${new Date().toLocaleString()}</div>
    </div>

    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>
            <li><a href="#overview">1. Executive Overview</a></li>
            <li><a href="#config">2. Demo Environment Configuration</a></li>
            <li><a href="#dashboard">3. Command Center Dashboard</a></li>
            <li><a href="#action-center">4. Action Center</a></li>
            <li><a href="#operations">5. Operations Hub</a></li>
            <li><a href="#pipeline">6. Release Pipeline</a></li>
            <li><a href="#finance">7. Finance Hub</a></li>
            <li><a href="#compliance">8. Compliance Hub</a></li>
            <li><a href="#engagement">9. Engagement Hub</a></li>
            <li><a href="#reports">10. Reports Portal</a></li>
            <li><a href="#ai">11. Ask Still AI</a></li>
            <li><a href="#audit">12. Activity & Audit Log</a></li>
            <li><a href="#admin">13. Admin & Setup</a></li>
            <li><a href="#mobile">14. Mobile Responsiveness</a></li>
            <li><a href="#value">15. Customer Value Story</a></li>
        </ul>
    </div>

    <h1 id="overview">1. Executive Overview</h1>
    <p>Still Command Center is a distillery operating system designed to bridge the gap between low-level production data and high-level executive decisions. This walkthrough demonstrates the system's capabilities using the Hearth & Hollow Distilling Co. demo environment.</p>
    <div class="metric-box">
        <strong>The Still Mission:</strong> To provide distillery owners and operators with "decision-grade" insights, ensuring every drop is accounted for and every release is optimized for value.
    </div>

    <h1 id="config">2. Demo Environment Configuration</h1>
    <p>The Hearth & Hollow demo environment is pre-seeded with realistic data to showcase scale and complexity:</p>
    <ul>
        <li><strong>Inventory:</strong> 600 active barrels across 3 rackhouses.</li>
        <li><strong>Production:</strong> 8 active production batches and 3 active blends.</li>
        <li><strong>Scenarios:</strong> Blocked releases, missing tasting notes, and TTB compliance risk flags are surfaced to demonstrate the Action Center's utility.</li>
    </ul>

    ${renderModule(catalog, 'dashboard', '3. Command Center Dashboard', 'The 8-card dashboard surfaces immediate operational priorities. It connects production efficiency, aging velocity, and regulatory readiness into a single pane of glass.')}
    
    ${renderModule(catalog, 'action-center', '4. Action Center', 'A centralized decision inbox. Items are detected automatically based on rule sets (e.g., missing data, overdue tasks, location mismatches) and assigned to specific operators.')}
    
    ${renderModule(catalog, 'operations', '5. Operations Hub', 'High-density view of station health. Tracks throughput, energy usage, and workstation bottlenecks across fermentation, distillation, and storage.')}
    
    ${renderModule(catalog, 'release-pipeline', '6. Release Pipeline', 'Kanban visualization of the go-to-market flow. Ensures cross-functional alignment between production leads, blenders, and compliance officers.')}
    
    ${renderModule(catalog, 'finance', '7. Finance Hub', 'Decision-grade financial overview. Treats barrel inventory as a primary business asset, projecting value at maturity and surfacing excise tax liabilities.')}
    
    ${renderModule(catalog, 'compliance', '8. Compliance Hub', 'Regulatory readiness dashboard. Surfaces risk flags and missing data fields required for TTB reporting and COLA approvals.')}
    
    ${renderModule(catalog, 'engagement', '9. Engagement Hub', 'Closes the loop with the consumer. Tracks QR bottle story scans, marketing campaign performance, and audience demand signals.')}
    
    ${renderModule(catalog, 'reports', '10. Reports Portal', 'A library of over 20 automated and on-demand distillery reports. Features an automated daily snapshot run at 6:03 AM.')}
    
    ${renderModule(catalog, 'ai', '11. Ask Still AI', 'Context-aware assistant for natural language insights. Can summarize complex reports or explain why specific compliance flags exist.')}
    
    ${renderModule(catalog, 'audit', '12. Activity & Audit Log', 'The immutable trust layer. Logs every action with actor, timestamp, and verification status for full operational accountability.')}
    
    ${renderModule(catalog, 'admin', '13. Admin & Setup', 'Enterprise-grade configuration. Adapts Still to the specific physical layout and team roles of any distillery facility.')}

    <h1 id="mobile">14. Mobile Responsiveness</h1>
    <p>Key workflows are optimized for mobile viewports, enabling floor-level workers to log actions and access priority alerts from anywhere in the facility.</p>
    ${renderViewport(catalog, 'mobile')}

    <h1 id="value">15. Customer Value Story</h1>
    <p>Still Command Center delivers value across the entire organization:</p>
    <ul>
        <li><strong>Owners/Executives:</strong> Fewer blind spots and faster decision-making via the 8-card dashboard.</li>
        <li><strong>Operations Teams:</strong> Clear visibility into workstation bottlenecks and inventory health.</li>
        <li><strong>Compliance Staff:</strong> "Audit-ready" records and automated risk detection.</li>
        <li><strong>Marketing Teams:</strong> Direct attribution of consumer engagement from bottle scans.</li>
    </ul>

    <div class="footer">
        © 2026 Still OS — Confidential Demo Documentation
    </div>
</body>
</html>
  `;
  
  await fs.writeFile(OUTPUT_HTML, htmlContent);
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`file://${OUTPUT_HTML}`, { waitUntil: 'networkidle' });
  await page.pdf({
    path: OUTPUT_PDF,
    format: 'A4',
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
    printBackground: true,
    displayHeaderFooter: true,
    footerTemplate: '<div style="font-size: 10px; width: 100%; text-align: center;">Still Command Center Walkthrough - Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    headerTemplate: '<div></div>'
  });
  
  await browser.close();
  console.log(`PDF generated at: ${OUTPUT_PDF}`);
}

function renderModule(catalog: ScreenshotEntry[], module: ScreenshotEntry['module'], title: string, text: string) {
  const screenshots = catalog.filter(e => e.module === module && e.viewport === 'desktop');
  if (screenshots.length === 0) return '';
  
  return `
    <h2 id="${module}">${title}</h2>
    <p>${text}</p>
    ${screenshots.map(s => `
        <div class="screenshot-container">
            <img src="${s.path}" alt="${s.title}">
            <div class="caption"><strong>${s.title}</strong>: ${s.description}</div>
        </div>
    `).join('')}
  `;
}

function renderViewport(catalog: ScreenshotEntry[], viewport: ScreenshotEntry['viewport']) {
  const screenshots = catalog.filter(e => e.viewport === viewport);
  if (screenshots.length === 0) return '';
  
  return `
    <div style="display: flex; flex-wrap: wrap; gap: 20px;">
    ${screenshots.map(s => `
        <div class="screenshot-container" style="max-width: 300px;">
            <img src="${s.path}" alt="${s.title}">
            <div class="caption"><strong>${s.title}</strong></div>
        </div>
    `).join('')}
    </div>
  `;
}

buildPdf().catch(console.error);
