import * as DiscordRPC from "discord-rpc";
import * as vscode from "vscode";
import * as path from "path";

const clientId = "1305258645906526328"; // Discord Client ID
const rpc = new DiscordRPC.Client({ transport: "ipc" });
let rpcInterval: NodeJS.Timeout | null = null;

// Define sessionStartTime in extension.ts and pass it to setActivity when needed
let sessionStartTime: Date | null = new Date();

export async function setActivity() {
    const editor = vscode.window.activeTextEditor;

    if (editor && sessionStartTime) {
        const fileName = path.basename(editor.document.fileName); // Get only the file name
        const language = editor.document.languageId;
        const capitalizedLanguage = language.charAt(0).toUpperCase() + language.slice(1);
        
        // Get the line number where the cursor is currently located
        const lineNumber = editor.selection.active.line + 1; // Adding 1 to make it 1-indexed

        // Supported languages based on the uploaded images in the Discord Developer Portal
        const supportedLanguages = [
            "c", "cpp", "csharp", "css", "dart", "go", "html", "javascript",
            "json", "kotlin", "matlab", "perl", "php", "python", "r",
            "ruby", "rust", "scala", "sql", "swift", "typescript", "markdown", "properties"
        ];

        // Check if the language has an uploaded image; otherwise, default to a generic icon
        const smallImageKey = supportedLanguages.includes(language) ? language : "generic";
        const smallImageText = language.charAt(0).toUpperCase() + language.slice(1);

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
    rpc.login({ clientId }).catch(console.error);

    rpc.on("ready", () => {
        console.log("<< Discord RPC Connected >>");

        // Set the initial activity
        setActivity();

        // Update activity every 15 seconds to reflect real-time coding status
        rpcInterval = setInterval(() => {
            setActivity();
        }, 15000);
    });
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
