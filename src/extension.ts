import * as vscode from "vscode";
import { DiscordCodingViewProvider } from "./panel";
import { getLanguageDurations } from "./utils/timeTracker";
import {
    sendSessionData,
    checkAndValidateUserId,
    getDiscordUsername,
    getStreakData,
    linkAccountWithCode,
    isAccountLinked,
} from "./utils/api";
import { SessionManager } from "./utils/sessionManager";
import { ConfigManager } from "./utils/configManager";
import {
    setActivity,
    restartRichPresence,
    isRestartingRichPresence,
} from "./utils/rpcDiscord";
import * as path from "path";

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

// Handle extension update: prompt reconnect only if not already linked
async function handleExtensionUpdate(
    context: vscode.ExtensionContext
): Promise<boolean> {
    try {
        const extension = vscode.extensions.getExtension(
            "JayNightmare.dis-track"
        );
        const currentVersion: string =
            (extension?.packageJSON?.version as string) ?? "0.0.0";
        const previousVersion =
            context.globalState.get<string>("extensionVersion");

        console.log(
            `<< Extension Update Detected >>\nCurrent Version: ${currentVersion}\nPrevious Version: ${previousVersion}`
        );

        if (previousVersion !== currentVersion) {
            // Persist new version
            await context.globalState.update(
                "extensionVersion",
                currentVersion
            );

            // If Discord ID exists and account is linked (displayName set), skip prompting
            const existingId = context.globalState.get<string>("discordId");
            if (existingId) {
                try {
                    const linked = await isAccountLinked(existingId);
                    if (linked) {
                        console.log(
                            "<< Update detected but account already linked; skipping link prompt >>"
                        );
                        return true;
                    }
                } catch (e) {
                    console.warn(
                        "<< Failed to verify link status during update >>",
                        e
                    );
                    // Fall through to prompt just in case
                }
            }

            // Prompt user to reconnect only if no ID or not linked
            const action = await vscode.window.showInformationMessage(
                `Dis.Track updated to v${currentVersion}. Please reconnect your Discord account.`,
                "Link Discord"
            );
            if (action === "Link Discord") {
                vscode.commands.executeCommand("extension.updateDiscordId");
            }

            return true;
        }
    } catch (error) {
        console.error("<< Error during update handling >>", error);
    }
    return false;
}

export let exportCode: string;

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

    // Handle extension updates before reading stored IDs
    const wasUpdated = await handleExtensionUpdate(context);

    // Create status bar for linking Discord
    let discordId = getValidDiscordId(context);
    updateStatusBar(statusBar, discordId);
    context.subscriptions.push(statusBar);

    // Initialize session tracking if Discord is linked
    if (discordId) {
        console.log(`<< Discord User ID: ${discordId} >>`);
        sessionManager.startSession();
    } else {
        if (!wasUpdated) {
            vscode.window.showErrorMessage(
                "Discord ID is required. Click the status bar button to link."
            );
        }
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

    // Command to refresh / restart Discord RPC
    context.subscriptions.push(
        vscode.commands.registerCommand("extension.refreshRPC", async () => {
            const enableRichPresence = vscode.workspace
                .getConfiguration("extension")
                .get<boolean>("enableRichPresence");
            if (!enableRichPresence) {
                vscode.window.showWarningMessage(
                    "Rich Presence is currently disabled in settings"
                );
                return;
            }

            if (isRestartingRichPresence()) {
                vscode.window.showInformationMessage(
                    "Rich Presence restart already in progress..."
                );
                return;
            }

            const previousStatus = statusBar.text;
            const refreshLabel = "$(sync~spin) Refreshing Discord RPC...";
            statusBar.text = refreshLabel;

            await vscode.window.withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: "Refreshing Discord Rich Presence",
                    cancellable: false,
                },
                async (progress) => {
                    progress.report({ message: "Stopping current activity" });
                    try {
                        await restartRichPresence();
                        progress.report({ message: "Updating activity" });
                        await setActivity();
                        vscode.window.showInformationMessage(
                            "Discord RPC activity restarted successfully!"
                        );
                    } catch (error) {
                        console.error(
                            "<< Failed to restart Discord RPC activity >>",
                            error
                        );
                        vscode.window.showErrorMessage(
                            "Failed to restart Discord RPC activity"
                        );
                    } finally {
                        statusBar.text = previousStatus; // restore
                    }
                }
            );
        })
    );

    // Command to update/link Discord ID via website
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "extension.updateDiscordId",
            async () => {
                console.log(
                    "<< Starting website-based Discord linking process >>"
                );

                // Step 1: Open the DisTrack website for account linking
                const websiteUrl =
                    "https://distrack.nexusgit.info/link-account";

                try {
                    await vscode.env.openExternal(vscode.Uri.parse(websiteUrl));
                    console.log(`<< Opened website: ${websiteUrl} >>`);

                    // Show information message about the process
                    vscode.window.showInformationMessage(
                        "Please link your Discord account on the website, then return here to enter your 6-alphanumeric code."
                    );

                    // Step 2: Prompt for 6-alphanumeric code after a short delay
                    setTimeout(async () => {
                        const linkCode = await vscode.window.showInputBox({
                            prompt: "Enter the 6-alphanumeric code from the DisTrack website",
                            placeHolder: "e.g., 1A2B3C",
                            validateInput: (value) => {
                                if (value && !/^[A-Z0-9]{6}$/.test(value)) {
                                    return "Code must be exactly 6 alphanumeric characters";
                                }
                                return null;
                            },
                            ignoreFocusOut: true,
                        });

                        console.log(
                            `<< User entered link code: ${linkCode} >>`
                        );

                        if (linkCode && /^[A-Z0-9]{6}$/.test(linkCode)) {
                            console.log(
                                `<< Attempting to link account with code ${linkCode} >>`
                            );

                            exportCode = linkCode;

                            if (!exportCode) {
                                console.error(
                                    `<< No export code provided, ${exportCode} >>`
                                );
                            }

                            try {
                                const result = await linkAccountWithCode(
                                    linkCode
                                );

                                if (result.success && result.userId) {
                                    // Store the Discord ID received from the API
                                    await context.globalState.update(
                                        "discordId",
                                        result.userId
                                    );
                                    discordId = result.userId;
                                    updateStatusBar(statusBar, discordId);

                                    // Start session if not already active
                                    if (!sessionManager.isSessionActive()) {
                                        sessionManager.startSession();
                                    }

                                    vscode.window.showInformationMessage(
                                        "Discord account linked successfully!"
                                    );
                                    discordCodingViewProvider.updateWebviewContent(
                                        "success"
                                    );
                                } else {
                                    vscode.window.showErrorMessage(
                                        result.error ||
                                            "Failed to link account. Please try again."
                                    );
                                }
                            } catch (error) {
                                console.error(
                                    "<< Error during account linking >>",
                                    error
                                );
                                vscode.window.showErrorMessage(
                                    "An error occurred while linking your account. Please try again."
                                );
                            }
                        } else if (linkCode) {
                            vscode.window.showErrorMessage(
                                "Invalid code format. Please enter a 6-alphanumeric code."
                            );
                        }
                    }, 1000);
                } catch (error) {
                    console.error("<< Error opening website >>", error);
                    vscode.window.showErrorMessage(
                        "Failed to open the DisTrack website. Please visit https://distrack.nexusgit.info/link-account manually."
                    );
                }
            }
        )
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
    statusBar.tooltip =
        "Click to link your Discord account via DisTrack website";
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

        if (!discordId || !duration) {
            console.error(
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
