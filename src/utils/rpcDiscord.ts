import * as DiscordRPC from "discord-rpc";
import * as vscode from "vscode";
import * as path from "path";

const clientId = "1305258645906526328"; // Discord Client ID
// Single RPC client instance – we guard listener registration to avoid duplicates
const rpc = new DiscordRPC.Client({ transport: "ipc" });
let rpcInterval: NodeJS.Timeout | null = null;
let readyListenerRegistered = false;
let isReady = false;
let restarting = false; // prevent concurrent restarts

// Define sessionStartTime in extension.ts and pass it to setActivity when needed
let sessionStartTime: Date | null = new Date();

export async function setActivity() {
    const editor = vscode.window.activeTextEditor;

    if (editor && sessionStartTime) {
        const fileName = path.basename(editor.document.fileName); // Get only the file name
        const language = editor.document.languageId;
        const capitalizedLanguage =
            language.charAt(0).toUpperCase() + language.slice(1);

        // Get the line number where the cursor is currently located
        const lineNumber = editor.selection.active.line + 1; // Adding 1 to make it 1-indexed

        // Supported languages based on the uploaded images in the Discord Developer Portal
        const supportedLanguages = [
            "c",
            "cpp",
            "csharp",
            "css",
            "dart",
            "go",
            "html",
            "javascript",
            "json",
            "kotlin",
            "matlab",
            "perl",
            "php",
            "python",
            "r",
            "ruby",
            "rust",
            "scala",
            "sql",
            "swift",
            "typescript",
            "markdown",
            "properties",
        ];

        // Check if the language has an uploaded image; otherwise, default to a generic icon
        const smallImageKey = supportedLanguages.includes(language)
            ? language
            : "generic";
        const smallImageText =
            language.charAt(0).toUpperCase() + language.slice(1);

        try {
            const maxLines = editor.document.lineCount; // Get the total number of lines in the file

            await rpc.setActivity({
                details: `Editing ${fileName} in VSCode`,
                state: `Language: ${capitalizedLanguage}`,
                startTimestamp: Math.floor(sessionStartTime.getTime() / 1000),
                largeImageKey: "vscode",
                largeImageText: "Visual Studio Code",
                smallImageKey: smallImageKey, // Use the language-specific image if available
                smallImageText: smallImageText, // Capitalized language name for the tooltip
                instance: true,
                partySize: lineNumber,
                partyMax: maxLines, // Set the max number of lines in the file
            });
            console.log("<< Discord RPC activity updated >>");
        } catch (error) {
            console.error("Failed to set Discord RPC activity:", error);
        }
    }
}

export function startRichPresence() {
    // If already connected just ensure interval is running
    if (isReady) {
        if (!rpcInterval) {
            rpcInterval = setInterval(() => setActivity(), 15000);
        }
        setActivity();
        return;
    }

    if (!readyListenerRegistered) {
        rpc.on("ready", () => {
            isReady = true;
            console.log("<< Discord RPC Connected >>");
            setActivity();
            rpcInterval = setInterval(() => setActivity(), 15000);
        });
        readyListenerRegistered = true;
    }

    try {
        rpc.login({ clientId }).catch((err) => {
            console.error("<< Discord RPC login failed >>", err);
        });
    } catch (err) {
        console.error("<< Discord RPC unexpected login error >>", err);
    }
}

export async function stopRichPresence() {
    if (rpcInterval) {
        clearInterval(rpcInterval);
        rpcInterval = null;
    }
    try {
        await rpc.clearActivity();
        console.log("<< Discord RPC activity cleared >>");
    } catch (error) {
        console.error("Failed to clear Discord RPC activity:", error);
    }
}

/**
 * Fully restarts the Rich Presence lifecycle.
 * Clears current activity & interval, then re-initializes connection / activity.
 */
export async function restartRichPresence() {
    if (restarting) {
        console.log("<< Rich Presence restart already in progress >>");
        return;
    }
    restarting = true;
    try {
        await stopRichPresence();
        // We don't destroy the client to keep IPC channel; simply refresh activity.
        // If not ready yet, startRichPresence will re-login / reuse connection.
        // Small delay to allow Discord client to settle.
        await new Promise((r) => setTimeout(r, 250));
        startRichPresence();
    } finally {
        restarting = false;
    }
}

/** Indicates whether a restart is currently underway */
export function isRestartingRichPresence(): boolean {
    return restarting;
}
