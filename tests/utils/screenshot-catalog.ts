import fs from 'fs-extra';
import path from 'path';

export interface ScreenshotEntry {
  id: string;
  title: string;
  description: string;
  route: string;
  path: string;
  viewport: "desktop" | "mobile";
  module:
    | "dashboard"
    | "action-center"
    | "operations"
    | "release-pipeline"
    | "finance"
    | "compliance"
    | "engagement"
    | "reports"
    | "ai"
    | "audit"
    | "admin";
  status: "captured" | "failed";
}

const MANIFEST_PATH = path.join(process.cwd(), 'docs/generated/still-demo-screenshot-manifest.json');

export async function addToCatalog(entry: ScreenshotEntry) {
  let catalog: ScreenshotEntry[] = [];
  
  if (await fs.pathExists(MANIFEST_PATH)) {
    catalog = await fs.readJson(MANIFEST_PATH);
  }
  
  // Update or add
  const index = catalog.findIndex(e => e.id === entry.id && e.viewport === entry.viewport);
  if (index >= 0) {
    catalog[index] = entry;
  } else {
    catalog.push(entry);
  }
  
  await fs.ensureDir(path.dirname(MANIFEST_PATH));
  await fs.writeJson(MANIFEST_PATH, catalog, { spaces: 2 });
}

export async function clearCatalog() {
  await fs.ensureDir(path.dirname(MANIFEST_PATH));
  await fs.writeJson(MANIFEST_PATH, [], { spaces: 2 });
}
