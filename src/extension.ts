import * as vscode from "vscode";
import axios from "axios";

let startTime: Date | null = null;

export function activate(context: vscode.ExtensionContext) {
    // Register commands
    let startCommand = vscode.commands.registerCommand(
        "extension.startCoding",
        startCodingSession
    );
    let stopCommand = vscode.commands.registerCommand(
        "extension.stopCoding",
        stopCodingSession
    );

    context.subscriptions.push(startCommand, stopCommand);

    // Automatically start tracking upon activation if preferred
    startCodingSession();
}

function startCodingSession() {
    if (!startTime) {
        startTime = new Date();
        vscode.window.showInformationMessage("Started coding session!");
    } else {
        vscode.window.showInformationMessage(
            "Coding session is already running!"
        );
    }
}

function stopCodingSession() {
    if (startTime) {
        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000; // duration in seconds
        sendToDiscord(duration);
        startTime = null; // Reset session start
    } else {
        vscode.window.showWarningMessage("No coding session to stop!");
    }
}

async function sendToDiscord(duration: number) {
    try {
        await axios.post("YOUR_DISCORD_BOT_ENDPOINT", {
            user: vscode.env.machineId, // Using machineId to uniquely identify the user
            duration: duration,
        });
        vscode.window.showInformationMessage(
            `Coding time of ${duration} seconds sent to Discord!`
        );
    } catch (error) {
        vscode.window.showErrorMessage(
            `Failed to send coding time to Discord: ${error.message}`
        );
    }
}

export function deactivate() {
    // Stop coding session on deactivation to capture last session
    stopCodingSession();
}
