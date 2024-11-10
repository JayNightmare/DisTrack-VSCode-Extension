import * as DiscordRPC from "discord-rpc";
import * as vscode from "vscode";

const clientId = ""; // Your Discord client ID
const rpc = new DiscordRPC.Client({ transport: "ipc" });
let rpcInterval: NodeJS.Timeout | null = null;

// Define sessionStartTime in extension.ts and pass it to setActivity when needed
let sessionStartTime: Date | null = new Date();

async function setActivity() {
    const editor = vscode.window.activeTextEditor;

    if (editor && sessionStartTime) { // Ensure sessionStartTime is defined
        const fileName = editor.document.fileName;
        const language = editor.document.languageId;

        try {
            await rpc.setActivity({
                details: `Editing ${fileName}`,
                state: `Language: ${language}`,
                startTimestamp: Math.floor(sessionStartTime.getTime() / 1000), // Unix timestamp in seconds
                largeImageKey: "vscode",
                largeImageText: "Visual Studio Code",
                smallImageKey: language,
                smallImageText: language,
                instance: false,
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
