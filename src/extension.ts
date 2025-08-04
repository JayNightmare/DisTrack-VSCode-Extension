import * as vscode from "vscode";
import { DiscordCodingViewProvider } from "./panel";
import { getLanguageDurations } from "./utils/timeTracker";
import {
    sendSessionData,
    checkAndValidateUserId,
    getDiscordUsername,
    getStreakData,
} from "./utils/api";
import { SessionManager } from "./utils/sessionManager";
import { ConfigManager } from "./utils/configManager";
import { setActivity } from "./utils/rpcDiscord";

let extensionContext: vscode.ExtensionContext;
const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
);
let discordCodingViewProvider: DiscordCodingViewProvider;
let sessionManager: SessionManager;
let configManager: ConfigManager;

// Helper function to validate Discord ID from global state
function getValidDiscordId(context: vscode.ExtensionContext): string | null {
    const discordId = context.globalState.get<string>("discordId");
    if (discordId && /^\d{15,32}$/.test(discordId)) {
        return discordId;
    }
    // Clear invalid ID
    if (discordId) {
        context.globalState.update("discordId", undefined);
    }
    return null;
}

export async function activate(context: vscode.ExtensionContext) {
    console.log("<< Activating extension... >>");
    extensionContext = context;

    // Initialize managers
    configManager = ConfigManager.getInstance();
    sessionManager = new SessionManager(context);

    discordCodingViewProvider = new DiscordCodingViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "discordCodingPanel",
            discordCodingViewProvider
        )
    );

    // If you want a command to refresh the new sidebar manually:
    context.subscriptions.push(
        vscode.commands.registerCommand("extension.refreshPanel", () => {
            discordCodingViewProvider.updateWebview();
        })
    );

    // Create status bar for linking Discord
    let discordId = getValidDiscordId(context);
    updateStatusBar(statusBar, discordId);
    context.subscriptions.push(statusBar);

    // Initialize session tracking if Discord is linked
    if (discordId) {
        console.log(`<< Discord User ID: ${discordId} >>`);
        sessionManager.startSession();
    } else {
        vscode.window.showErrorMessage(
            "Discord ID is required. Click the status bar button to link."
        );
    }

    // Command to reconnect Discord
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "extension.reconnectDiscord",
            async () => {
                console.log("<< Reconnect Discord button clicked >>");
                const discordId = getValidDiscordId(context);

                if (!discordId) {
                    console.log(
                        "<< No valid Discord ID found in global state >>"
                    );
                    vscode.window.showErrorMessage(
                        "No valid Discord ID found. Please link your Discord account first."
                    );
                    return;
                }

                console.log(
                    `<< Found Discord ID in global state: ${discordId} >>`
                );
                console.log("<< Validating Discord ID with API... >>");

                try {
                    const isValid = await checkAndValidateUserId(discordId);

                    if (isValid) {
                        console.log("<< Discord ID validation successful >>");
                        vscode.window.showInformationMessage(
                            "Discord account reconnected successfully!"
                        );
                        discordCodingViewProvider.updateWebviewContent(
                            "success"
                        );
                    } else {
                        console.log("<< Discord ID validation failed >>");
                        vscode.window.showErrorMessage(
                            "Failed to validate Discord ID. Please check your connection and try again."
                        );
                    }
                } catch (error) {
                    console.error(
                        "<< Error during Discord validation >>",
                        error
                    );
                    vscode.window.showErrorMessage(
                        "An error occurred while validating Discord ID."
                    );
                }
            }
        )
    );

    // Command to refresh Discord RPC
    context.subscriptions.push(
        vscode.commands.registerCommand("extension.refreshRPC", async () => {
            const enableRichPresence = vscode.workspace
                .getConfiguration("extension")
                .get<boolean>("enableRichPresence");
            if (enableRichPresence) {
                try {
                    await setActivity();
                    vscode.window.showInformationMessage(
                        "Discord RPC activity refreshed successfully!"
                    );
                } catch (error) {
                    console.error(
                        "<< Failed to refresh Discord RPC activity >>",
                        error
                    );
                    vscode.window.showErrorMessage(
                        "Failed to refresh Discord RPC activity"
                    );
                }
            } else {
                vscode.window.showWarningMessage(
                    "Rich Presence is currently disabled in settings"
                );
            }
        })
    );

    // Command to update/link Discord ID
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "extension.updateDiscordId",
            async () => {
                const currentDiscordId = getValidDiscordId(context);
                const enteredDiscordId = await vscode.window.showInputBox({
                    prompt: "Enter your Discord User ID",
                    placeHolder: "e.g., 123456789012345678",
                    value: currentDiscordId ?? "",
                    validateInput: (value) => {
                        if (value && !/^\d{15,32}$/.test(value)) {
                            return "Discord ID must be 15-32 digits long";
                        }
                        return null;
                    },
                });

                if (enteredDiscordId && /^\d{15,32}$/.test(enteredDiscordId)) {
                    try {
                        const isValid = await checkAndValidateUserId(
                            enteredDiscordId
                        );
                        if (isValid) {
                            await context.globalState.update(
                                "discordId",
                                enteredDiscordId
                            );
                            discordId = enteredDiscordId;
                            updateStatusBar(statusBar, discordId);

                            if (!sessionManager.isSessionActive()) {
                                sessionManager.startSession();
                            }

                            vscode.window.showInformationMessage(
                                "Discord ID linked successfully!"
                            );
                            discordCodingViewProvider.updateWebviewContent(
                                "success"
                            );
                        } else {
                            vscode.window.showErrorMessage(
                                "Failed to validate Discord ID. Please check the ID and try again."
                            );
                        }
                    } catch (error) {
                        console.error(
                            "<< Error validating Discord ID >>",
                            error
                        );
                        vscode.window.showErrorMessage(
                            "An error occurred while validating Discord ID."
                        );
                    }
                } else if (enteredDiscordId) {
                    vscode.window.showErrorMessage(
                        "Invalid Discord ID format. Please enter a valid Discord User ID."
                    );
                }
            }
        )
    );

    // Command to clear stored tokens (for troubleshooting)
    context.subscriptions.push(
        vscode.commands.registerCommand("extension.clearTokens", async () => {
            const confirm = await vscode.window.showWarningMessage(
                "This will clear all stored Discord and API tokens. You'll need to re-enter them. Continue?",
                "Yes",
                "No"
            );

            if (confirm === "Yes") {
                await context.secrets.delete("discord-bot-token");
                await context.secrets.delete("api-token");
                vscode.window.showInformationMessage(
                    "All tokens cleared successfully."
                );
            }
        })
    );

    // Update configuration based on changes
    configManager.onConfigurationChanged((e) => {
        if (
            configManager.hasConfigurationChanged(
                e,
                "extension.enableRichPresence"
            )
        ) {
            // SessionManager will handle Rich Presence changes internally
            console.log("<< Rich Presence configuration changed >>");
        }

        if (
            configManager.hasConfigurationChanged(
                e,
                "extension.sessionTimerFormat"
            )
        ) {
            sessionManager.updateTimerFormat();
        }
    });

    // Apply settings from configuration
    applyConfigurationSettings();
}

function updateStatusBar(
    statusBar: vscode.StatusBarItem,
    discordId?: string | null
) {
    statusBar.text = discordId ? "Connected to Discord" : "Link to Discord";
    statusBar.command = "extension.updateDiscordId";
    statusBar.tooltip = "Click to update your Discord User ID";
    statusBar.show();
}

function applyConfigurationSettings() {
    const config = vscode.workspace.getConfiguration("extension");
    const discordId = configManager.getConfigDiscordId();

    console.log(`<< Config - Discord ID: ${discordId} >>`);

    if (discordId) {
        extensionContext.globalState.update("discordId", discordId);
    }
}

export async function deactivate() {
    console.log("<< Starting extension deactivation... >>");

    // Dispose managers and clean up resources
    if (sessionManager) {
        sessionManager.dispose();
    }

    // Dispose status bar items
    statusBar.dispose();

    try {
        const duration = await sessionManager.endSession();
        const discordId = getValidDiscordId(extensionContext);
        let discordUsername: string | null = null;
        if (discordId) {
            discordUsername = await getDiscordUsername(discordId);
        } else {
            console.log("<< No valid Discord ID found for session data >>");
            vscode.window.showErrorMessage(
                "No valid Discord ID found. Please link your Discord account first."
            );
            return;
        }
        const lastSessionDate = new Date().toISOString();
        const languages = getLanguageDurations();
        const streakData = await getStreakData(discordId);

        console.log(`<< Discord User Id: ${discordId} >>`);
        console.log(`<< Discord Username: ${discordUsername} >>`);
        console.log(`<< Session duration: ${duration} seconds >>`);
        console.log(`<< Last session date: ${lastSessionDate} >>`);
        console.log(`<< Session languages: ${JSON.stringify(languages)} >>`);
        console.log(`<< Streak Data: ${JSON.stringify(streakData)} >>`);

        if (!discordId || !duration) {
            console.log(
                "<< Error: Missing required data. Discord ID or Duration is null >>"
            );
            return;
        }

        console.log("<< Sending session data to Discord... >>");
        await sendSessionData(
            discordId,
            discordUsername ?? "EFU",
            duration,
            lastSessionDate,
            languages,
            streakData
        );
        console.log("<< Session data sent successfully! >>");
    } catch (error) {
        console.error(`<< Failed to send session data: ${error} >>`);
    }

    console.log("<< Extension Deactivated >>");
}
