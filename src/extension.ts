import * as vscode from "vscode";
import axios from "axios";
import { startSession, endSession } from "./utils/timeTracker";
import { sendSessionData } from "./utils/api";

export function activate(context: vscode.ExtensionContext) {
    console.log("Activating extension...");
    startSession(); // Starts session automatically when VSCode loads

    const userId = vscode.env.machineId; // Unique identifier for the user
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBar.text = "Link to Discord";
    statusBar.command = "extension.linkToDiscord";
    statusBar.tooltip = "Click to link your VSCode account to Discord";
    statusBar.show();

    context.subscriptions.push(statusBar);

    // Register the command to link Discord
    context.subscriptions.push(
        vscode.commands.registerCommand("extension.linkToDiscord", async () => {
            await linkToDiscord(userId);
            statusBar.text = "Connected to Discord";
            vscode.window.showInformationMessage("Successfully linked to Discord!");
        })
    );
}

async function linkToDiscord(userId: string) {
    const endpointUrl = "";
    try {
        await axios.post(endpointUrl, { userId });
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to send coding time to Discord: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}

export function deactivate() {
    console.log("Deactivating extension...");
    const duration = endSession(); // Ends session on close and calculates duration
    if (duration !== null) {
        sendSessionData(duration); // Sends data to the endpoint
    }
}
