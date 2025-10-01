import * as vscode from "vscode";
import { DiscordCodingViewProvider } from "./panel";
import { getLanguageDurations as getTrackedLanguageDurations } from "./utils/timeTracker";
import { SessionManager } from "./utils/sessionManager";
import { ConfigManager } from "./utils/configManager";
import {
    setActivity,
    restartRichPresence,
    isRestartingRichPresence,
} from "./utils/rpcDiscord";
import { initializeBaseUrl } from "./api/baseUrl";
import {
    initializeTokenManager,
    hasLinkedAccount,
    getDeviceId,
    storeTokens,
    clearTokens,
} from "./auth/tokenManager";
import { SessionQueue } from "./sessions/sessionQueue";
import { getStreakData } from "./utils/api";
import { startLink, finishLink, LinkFinishResponse } from "./api/link";

let extensionContext: vscode.ExtensionContext;
let statusBar: vscode.StatusBarItem;
let discordCodingViewProvider: DiscordCodingViewProvider;
let sessionManager: SessionManager;
let configManager: ConfigManager;
let sessionQueue: SessionQueue;
let linkInProgress = false;

export async function activate(context: vscode.ExtensionContext) {
    console.log("<< Activating extension... >>");
    extensionContext = context;

    statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBar.command = "extension.updateDiscordId";
    context.subscriptions.push(statusBar);

    configManager = ConfigManager.getInstance();
    sessionManager = new SessionManager(context);

    sessionQueue = new SessionQueue(context);
    sessionQueue.start();
    context.subscriptions.push(sessionQueue);

    discordCodingViewProvider = new DiscordCodingViewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            "discordCodingPanel",
            discordCodingViewProvider
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand("extension.refreshPanel", () => {
            discordCodingViewProvider.updateWebview();
        })
    );

    await initializeBaseUrl(context);
    await initializeTokenManager(context);

    await refreshStatusBar();

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "extension.updateDiscordId",
            async () => {
                await beginLinkFlow();
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "extension.reconnectDiscord",
            async () => {
                if (linkInProgress) {
                    return;
                }

                const confirmation = await vscode.window.showWarningMessage(
                    "Re-linking DisTrack will require confirmation in your browser.",
                    { modal: true },
                    "Continue"
                );
                if (confirmation !== "Continue") {
                    return;
                }

                await clearTokens();
                await refreshStatusBar();
                await beginLinkFlow();
            }
        )
    );

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
                        statusBar.text = previousStatus;
                    }
                }
            );
        })
    );

    configManager.onConfigurationChanged((e) => {
        if (
            configManager.hasConfigurationChanged(
                e,
                "extension.sessionTimerFormat"
            )
        ) {
            sessionManager.updateTimerFormat();
        }
    });

    applyConfigurationSettings();

    await ensureLinkedOnStartup();

    console.log("<< Extension activated >>");
}

async function ensureLinkedOnStartup() {
    const linked = await hasLinkedAccount();
    if (linked) {
        await onLinkEstablished();
        return;
    }

    await beginLinkFlow();
}

async function beginLinkFlow(): Promise<void> {
    if (linkInProgress) {
        return;
    }

    linkInProgress = true;
    await refreshStatusBar(true);

    try {
        const deviceId = await getDeviceId();
        const {
            linkCode,
            pollToken,
            verificationUrl,
            expiresIn,
            pollInterval,
        } = await startLink(deviceId);

        await vscode.env.openExternal(vscode.Uri.parse(verificationUrl));
        vscode.window.showInformationMessage(
            `DisTrack linking code: ${linkCode}. Enter this code in your browser to finish linking.`
        );

        const tokens = await vscode.window.withProgress<LinkFinishResponse>(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Linking DisTrack account",
                cancellable: true,
            },
            async (progress, cancellationToken) => {
                return pollForLinkConfirmation({
                    deviceId,
                    pollToken,
                    expiresIn,
                    pollInterval,
                    linkCode,
                    progress,
                    cancellationToken,
                });
            }
        );

        await storeTokens({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresIn: tokens.expires_in,
        });

        vscode.window.showInformationMessage(
            "DisTrack account linked. Sessions will sync automatically."
        );

        await onLinkEstablished();
    } catch (error: any) {
        if (error?.message) {
            vscode.window.showErrorMessage(error.message);
        } else {
            console.error("<< Link flow failed >>", error);
            vscode.window.showErrorMessage(
                "Failed to link DisTrack account. Please try again."
            );
        }
    } finally {
        linkInProgress = false;
        await refreshStatusBar();
    }
}

interface PollOptions {
    deviceId: string;
    pollToken: string;
    expiresIn: number;
    pollInterval?: number;
    linkCode: string;
    progress: vscode.Progress<{ message?: string }>;
    cancellationToken: vscode.CancellationToken;
}

async function pollForLinkConfirmation(
    options: PollOptions
): Promise<LinkFinishResponse> {
    const {
        deviceId,
        pollToken,
        expiresIn,
        pollInterval,
        linkCode,
        progress,
        cancellationToken,
    } = options;

    const deadline = Date.now() + expiresIn * 1000;
    const intervalMs = Math.max(2000, Math.round((pollInterval ?? 2) * 1000));

    while (Date.now() < deadline) {
        if (cancellationToken.isCancellationRequested) {
            throw new Error("Linking cancelled.");
        }

        progress.report({
            message: `Waiting for confirmation (code ${linkCode})`,
        });

        try {
            return await finishLink(deviceId, pollToken);
        } catch (error: any) {
            const status = error?.response?.status;

            if (status === 404 || status === 409 || status === 425) {
                await delay(intervalMs);
                continue;
            }

            if (status === 410 || status === 400) {
                throw new Error(
                    "Link code expired. Please run the link command again."
                );
            }

            throw error;
        }
    }

    throw new Error("Link code expired. Please run the link command again.");
}

async function refreshStatusBar(spinner = false): Promise<void> {
    if (spinner) {
        statusBar.text = "$(sync~spin) Linking DisTrack...";
        statusBar.tooltip = "Complete the linking in your browser.";
        statusBar.show();
        return;
    }

    const linked = await hasLinkedAccount();
    statusBar.text = linked
        ? "DisTrack: Linked"
        : "DisTrack: Link account";
    statusBar.tooltip = linked
        ? "DisTrack is linked. Click to re-link."
        : "Click to start the DisTrack linking flow.";
    statusBar.show();
}

async function onLinkEstablished(): Promise<void> {
    await refreshStatusBar();

    if (!sessionManager.isSessionActive()) {
        sessionManager.startSession();
    }

    await sessionQueue.flush();
    discordCodingViewProvider.updateWebview();
}

function applyConfigurationSettings() {
    // Reserved for future configuration-driven behaviors.
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deactivate() {
    console.log("<< Starting extension deactivation... >>");

    let duration: number | null = null;
    try {
        duration = await sessionManager?.endSession();
    } catch (error) {
        console.error("<< Failed to end active session >>", error);
    }

    sessionManager?.dispose();
    statusBar?.dispose();

    if (duration) {
        const sessionDate = new Date().toISOString();
        const languages = getTrackedLanguageDurations();
        let streak = { currentStreak: 0, longestStreak: 0 };

        try {
            streak = await getStreakData();
        } catch (error) {
            console.warn(
                "<< Unable to fetch streak data during shutdown >>",
                error
            );
        }

        try {
            await sessionQueue.enqueue({
                duration,
                sessionDate,
                languages,
                streakData: streak,
            });
            await sessionQueue.flush();
        } catch (error) {
            console.error("<< Failed to enqueue final session >>", error);
        }
    }

    sessionQueue?.dispose();

    console.log("<< Extension Deactivated >>");
}
