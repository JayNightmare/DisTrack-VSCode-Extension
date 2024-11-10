import * as vscode from "vscode";
import { startSession, endSession } from "./utils/timeTracker";
import { sendSessionData } from "./utils/api";
import { startRichPresence, stopRichPresence } from "./utils/rpcDiscord";

let extensionContext: vscode.ExtensionContext;
let sessionStartTime: Date | null = null;
let sessionTimerInterval: NodeJS.Timeout | null = null;
const statusBarTimer = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

export function activate(context: vscode.ExtensionContext) {
    console.log("<< Activating extension... >>");
    extensionContext = context;

    // Create a status bar button for linking Discord
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBar.text = "Link to Discord";
    statusBar.command = "extension.linkToDiscord";
    statusBar.tooltip = "Click to link your VSCode account to Discord";
    statusBar.show();

    context.subscriptions.push(statusBar);
    sessionStartTime = new Date();
    startSessionTimer();
    startRichPresence();

    // Register the link to Discord command
    context.subscriptions.push(
        vscode.commands.registerCommand("extension.linkToDiscord", async () => {
            const discordId = await vscode.window.showInputBox({
                prompt: "Enter your Discord User ID to link it with VSCode",
                placeHolder: "Enter Discord User ID here",
            });

            if (discordId) {
                context.globalState.update('discordId', discordId);
                vscode.window.showInformationMessage("<< Discord User ID linked successfully! >>");
                statusBar.text = "<< Connected to Discord >>";
                console.log(`<< Discord User ID Added: ${discordId} >>`);
            } else {
                vscode.window.showErrorMessage("<< Discord ID is required to link your account >>");
            }
        })
    );

    // Automatically start tracking on load
    startSession(context);
}

export async function deactivate() {
    console.log("<< Deactivating extension... >>");
    stopSessionTimer();
    stopRichPresence();

    const duration = await endSession();
    const discordId = extensionContext.globalState.get<string>('discordId');
    const lastSessionDate = new Date().toISOString();

    console.log(`<< Discord User Id: ${discordId} >>`);
    console.log(`<< Session duration: ${duration} seconds >>`);
    console.log(`<< Last session date: ${lastSessionDate} >>`);

    if (!discordId || !duration) {
        console.log("<< Error: Missing required data. Discord ID or Duration is null >>");
        return;
    }
    
    try {
        console.log("<< Sending session data to Discord... >>");
        await sendSessionData(discordId, duration, lastSessionDate);
        console.log("<< Session data sent successfully! >>");
    } catch (error) {
        console.error(`<< Failed to send session data: ${error} >>`);
    }

    console.log("<< Extension Deactivated >>");
}

// Function to start the timer and update every second
function startSessionTimer() {
    statusBarTimer.show();
    sessionTimerInterval = setInterval(() => {
        const elapsed = new Date().getTime() - (sessionStartTime?.getTime() || 0);
        const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
        const seconds = Math.floor((elapsed / 1000) % 60);

        statusBarTimer.text = `Session Timer: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function stopSessionTimer() {
    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
        sessionTimerInterval = null;
    }
    statusBarTimer.hide();
}
