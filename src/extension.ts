import * as vscode from "vscode";
import { startSession, endSession, getLanguageDurations } from "./utils/timeTracker";
import { sendSessionData } from "./utils/api";
import { startRichPresence, stopRichPresence } from "./utils/rpcDiscord";

let extensionContext: vscode.ExtensionContext;
let sessionStartTime: Date | null = null;
let sessionTimerInterval: NodeJS.Timeout | null = null;
const statusBarTimer = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

export async function activate(context: vscode.ExtensionContext) {
    console.log("<< Activating extension... >>");
    extensionContext = context;

    applyConfigurationSettings();

    // Automatically start tracking on load (rest of the activation code)
    sessionStartTime = new Date();
    startSession(context);

    const enableRichPresence = vscode.workspace.getConfiguration("extension").get<boolean>("enableRichPresence");
    if (enableRichPresence) {
        startRichPresence();
    }

    startSessionTimer();
    

    // Create a status bar button for linking Discord
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    let discordId = context.globalState.get<string>('discordId');
    console.log(`<< Discord User ID: ${discordId} >>`);

    // Check if the stored discordId is valid (only numeric characters)
    if (discordId && !/^\d+$/.test(discordId)) {
        vscode.window.showWarningMessage("<< Stored Discord ID is invalid. Please re-enter your Discord ID. >>");
        discordId = undefined; // Clear invalid ID so the user will be prompted to enter a new one
    }

    statusBar.text = discordId ? "Connected to Discord" : "Link to Discord";

    // Set the command to allow re-linking Discord, even if already connected
    statusBar.command = "extension.updateDiscordId";
    statusBar.tooltip = "Click to update your Discord User ID";
    statusBar.show();
    context.subscriptions.push(statusBar);

    // Register the command to link or update the Discord ID
    context.subscriptions.push(
        vscode.commands.registerCommand("extension.updateDiscordId", async () => {
            const enteredDiscordId = await vscode.window.showInputBox({
                prompt: "Enter your Discord User ID to link it with VSCode",
                placeHolder: "Enter Discord User ID here",
                value: discordId ?? "", // Show the current ID if available
            });

            // Check if entered ID is valid
            if (enteredDiscordId && /^\d+$/.test(enteredDiscordId)) {
                await context.globalState.update('discordId', enteredDiscordId);
                vscode.window.showInformationMessage("<< Discord User ID updated successfully! >>");
                statusBar.text = "Connected to Discord";
                console.log(`<< Discord User ID updated to: ${enteredDiscordId} >>`);
            } else if (enteredDiscordId) {
                vscode.window.showErrorMessage("<< Invalid Discord ID. Please enter a numeric Discord User ID. >>");
            } else {
                vscode.window.showErrorMessage("<< Discord ID is required to link your account >>");
            }
        })
    );

    await getSettings(discordId);
}

export async function deactivate() {
    console.log("<< Deactivating extension... >>");
    stopSessionTimer();
    stopRichPresence();

    const duration = await endSession();
    const discordId = extensionContext.globalState.get<string>('discordId');
    const lastSessionDate = new Date().toISOString();
    const languages = getLanguageDurations();

    console.log(`<< Discord User Id: ${discordId} >>`);
    console.log(`<< Session duration: ${duration} seconds >>`);
    console.log(`<< Last session date: ${lastSessionDate} >>`);
    console.log(`<< Session languages: ${JSON.stringify(languages)} >>`);

    if (!discordId || !duration) {
        console.log("<< Error: Missing required data. Discord ID or Duration is null >>");
        return;
    }
    
    try {
        console.log("<< Sending session data to Discord... >>");
        await sendSessionData(discordId, duration, lastSessionDate, languages);
        console.log("<< Session data sent successfully! >>");
    } catch (error) {
        console.error(`<< Failed to send session data: ${error} >>`);
    }

    console.log("<< Extension Deactivated >>");
}

function applyConfigurationSettings() {
    const config = vscode.workspace.getConfiguration("extension");

    const discordId = config.get<string>("updateDiscordId");
    const enableRichPresence = config.get<boolean>("enableRichPresence");
    const sessionTimerFormat = config.get<string>("sessionTimerFormat");

    console.log(`Config - Discord ID: ${discordId}, Rich Presence: ${enableRichPresence}, Timer Format: ${sessionTimerFormat}`);

    if (discordId) {
        extensionContext.globalState.update("discordId", discordId);
    }
}

// Function to start the timer and update every second
function startSessionTimer() {
    const config = vscode.workspace.getConfiguration("extension");
    const sessionTimerFormat = config.get<string>("sessionTimerFormat");

    statusBarTimer.show();
    sessionTimerInterval = setInterval(() => {
        const elapsed = new Date().getTime() - (sessionStartTime?.getTime() ?? 0);
        const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
        const seconds = Math.floor((elapsed / 1000) % 60);

        switch (sessionTimerFormat) {
            case "hh:mm:ss":
                statusBarTimer.text = `Session Timer: ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                break;
            case "mm:ss":
                statusBarTimer.text = `Session Timer: ${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
                break;
            case "hours":
                statusBarTimer.text = `Session Duration: ${((elapsed / (1000 * 60 * 60))).toFixed(1)} hrs`;
                break;
            default:
                statusBarTimer.text = `Session Timer: ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
    }, 1000);
}

async function stopSessionTimer() {
    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
        sessionTimerInterval = null;
    }
    statusBarTimer.hide();
}

async function getSettings(newDiscordId: string | undefined) {
    const config = vscode.workspace.getConfiguration("extension");
    await config.update("updateDiscordId", newDiscordId, vscode.ConfigurationTarget.Global);

    // Retrieve specific settings
    const discordUserId = config.get<string>("updateDiscordId");
    const enableRichPresence = config.get<boolean>("enableRichPresence");
    const sessionTimerFormat = config.get<string>("sessionTimerFormat");

    console.log(`Discord User ID: ${discordUserId}`);
    console.log(`Rich Presence Enabled: ${enableRichPresence}`);
    console.log(`Timer Format: ${sessionTimerFormat}`);
}