import * as vscode from "vscode";
import { startSession, endSession } from "./utils/timeTracker";
import { sendSessionData } from "./utils/api";

export function activate(context: vscode.ExtensionContext) {
    console.log("Activating extension...");
    startSession(); // Starts session automatically when VSCode loads
}

export function deactivate() {
    console.log("Deactivating extension...");
    const duration = endSession(); // Ends session on close and calculates duration
    if (duration !== null) {
        sendSessionData(duration); // Sends data to the endpoint
    }
}
