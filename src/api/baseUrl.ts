import * as vscode from "vscode";

let extensionContext: vscode.ExtensionContext | undefined;
let cachedBaseUrl: string | undefined;

export function initializeBaseUrl(context: vscode.ExtensionContext) {
  extensionContext = context;
  cachedBaseUrl = undefined;
}

export async function getApiBaseUrl(): Promise<string> {
  if (!extensionContext) {
    throw new Error("API base URL requested before initialization");
  }

  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }

  const extension = vscode.extensions.getExtension("JayNightmare.dis-track");
  if (!extension) {
    throw new Error("DisTrack extension metadata unavailable");
  }

  const linkPath = vscode.Uri.joinPath(
    extension.extensionUri,
    "assets",
    "link.txt",
  );

  try {
    const linkData = await vscode.workspace.fs.readFile(linkPath);
    const raw = Buffer.from(linkData).toString("utf8").trim();
    cachedBaseUrl = raw.replace(/\/$/, "");
    return cachedBaseUrl;
  } catch (error) {
    throw new Error("Failed to read DisTrack API base URL");
  }
}
