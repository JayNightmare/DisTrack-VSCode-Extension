import * as vscode from "vscode";
import { getStreakData, getLanguageDurations } from "./utils/timeTracker";
import { getDiscordUsername, getLeaderboard } from "./utils/api";

export class DiscordCodingViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private readonly _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    /**
     * Called by VS Code when your view should be initialized/revived.
     * The webviewView is the container (like a sidebar) that you can fill with HTML.
     */
    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        // Let scripts run in the webview
        webviewView.webview.options = {
            enableScripts: true,
        };

        // Render the HTML initially
        await this.updateWebview();

        // Listen for messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case "connectDiscord":
                    await vscode.commands.executeCommand(
                        "extension.updateDiscordId"
                    );
                    await this.updateWebview();
                    break;
            }
        });
    }

    /**
     * Rebuilds the HTML inside the view.
     * You can call this any time you need to refresh the content (e.g. after new data).
     */
    public async updateWebview() {
        if (!this._view) {
            return;
        }

        const discordId = this._context.globalState.get<string>("discordId");
        const isConnected = !!discordId;
        const leaderboard = await getLeaderboard();

        this._view.webview.html = this.getHtmlContent(isConnected, leaderboard);
    }

    // TODO: Fix connect to discord button
    // TODO: Add buttons to switch from leaderboard to profile
    private getHtmlContent(isConnected: boolean, leaderboard: any[]): string {
        return `
    <!DOCTYPE html>
    <html>
        <head>
            <style>
                body { padding: 20px; font-family: Arial, sans-serif; }
                .header { font-size: 18px; margin-bottom: 20px; }
                .connect-button {
                    padding: 10px 20px;
                    background: #5865F2;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .leaderboard { margin-top: 20px; }
                .user-row {
                    display: flex;
                    align-items: center;
                    margin: 10px 0;
                    padding: 10px;
                    background: linear-gradient(#131313, #131313) padding-box, linear-gradient(145deg, #131313, #4A81E6) border-box;
                    border: 1px solid transparent;
                    border-radius: 3px;

                    span {
                        margin-left: 5px;
                    }
                }
                .medal {
                    width: 20px;
                    height: 20px;
                    margin-right: 10px;
                }

                .border-session {
                    animation: spin 2.5s infinite linear;
                    background:
                    linear-gradient(to bottom,#131313, #131313)
                    padding-box,
                    conic-gradient(
                        from var(--bg-angle) in oklch longer hue,
                        oklch(0.85 0.37 0) 0 0
                    )
                    border-box;

                    border: 2px solid transparent;
                    font-size: 24px;
                    font-weight: bold;
                    margin: 20px 0;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }

                @property --bg-angle {
                    inherits: false;
                    initial-value: 0deg;
                    syntax: "<angle>";
                }

                @keyframes spin {
                    to {
                        --bg-angle: 360deg;
                    }
                }
            </style>
        </head>
        <body>
            <!-- Session Timer -->
            <div class="header">
                <h2>Session Timer</h2>
                <div class="border-session" id="timer">
                    00:00:00
                </div>
            </div>
            ${isConnected
                ? `
                <div class="header">
                    <h2>Leaderboard</h2>
                </div>
                <div class="leaderboard">
                    ${leaderboard
                    .map(
                        (user, index) => `
                    <div class="user-row">
                        ${this.getMedalIcon(index + 1)}
                        <span>${user.username} - ${this.formatTime(
                            user.totalCodingTime
                        )}</span>
                    </div>
                    `
                    )
                    .join("")}
                </div>
            `
                : `
                <div style="text-align: center; margin-top: 50px;">
                    <button class="connect-button" onclick="connectDiscord()">Connect to Discord</button>
                </div>
            `
            }
            <div style="text-align: center; margin-top: 50px;">
                <button class="connect-button" onclick="reconnectDiscord()">Re-link Discord</button>
            </div>
        <script>
            (function() {
                const vscode = acquireVsCodeApi();
                let startTime = Date.now();
                let timerInterval;

                function connectDiscord() {
                    vscode.postMessage({ command: 'connectDiscord' });
                }

                function reconnectDiscord() {
                    vscode.postMessage({ command: 'connectDiscord' });
                }

                function formatTime(seconds) {
                    const hours = Math.floor(seconds / 3600);
                    const minutes = Math.floor((seconds % 3600) / 60);
                    const secs = seconds % 60;
                    return String(hours).padStart(2, '0') + ':' +
                           String(minutes).padStart(2, '0') + ':' +
                           String(secs).padStart(2, '0');
                }

                function updateTimer() {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    document.getElementById('timer').textContent = formatTime(elapsed);
                }

                // Start the timer when the page loads
                timerInterval = setInterval(updateTimer, 1000);
                updateTimer();

                // Clean up when the webview is disposed
                window.addEventListener('unload', () => {
                    clearInterval(timerInterval);
                });
            })();
        </script>
        </body>
    </html>
    `;
    }

    private getMedalIcon(position: number) {
        if (position === 1) return "🥇";
        if (position === 2) return "🥈";
        if (position === 3) return "🥉";
        return `${position}.`;
    }

    private formatTime(seconds: number) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
}