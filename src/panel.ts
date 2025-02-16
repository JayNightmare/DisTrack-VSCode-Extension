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
                    background: linear-gradient(#131313, #131313) padding-box, linear-gradient(145deg, #000000, #4A81E6) border-box;
                    border: 1px solid transparent;
                    border-radius: 3px;
                }
                .medal {
                    width: 20px;
                    height: 20px;
                    margin-right: 10px;
                }
            </style>
        </head>
        <body>
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
                    <button class="connect-button" onclick="reconnectDiscord()">Re-link Discord</button>
                </div>
            `
            }
        <script>
            const vscode = acquireVsCodeApi();
            function connectDiscord() {
                vscode.postMessage({ command: 'connectDiscord' });
            }
            function reconnectDiscord() {
                vscode.postMessage({ command: 'connectDiscord' });
            }
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
