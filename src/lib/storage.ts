import { mkdir } from "fs/promises";
import path from "path";

export const DATA_DIR = path.join(process.cwd(), "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export async function ensureUploadsDir() {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

export function uploadPath(filename: string) {
  return path.join(UPLOADS_DIR, filename);
}
