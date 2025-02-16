import * as vscode from 'vscode';
import { getStreakData, getLanguageDurations } from './utils/timeTracker';
import { getDiscordUsername, getLeaderboard } from './utils/api';

export class DiscordCodingPanel {
    private static readonly viewType = 'discordCodingPanel';
    private _panel: vscode.WebviewPanel | undefined;
    private _context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    public show() {
        if (!this._panel) {
            this._panel = vscode.window.createWebviewPanel(
                DiscordCodingPanel.viewType,
                'Discord Coding Stats',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            this._panel.onDidDispose(() => {
                this._panel = undefined;
            });

            this.updateWebview();
        }
    }

    public async updateWebview() {
        if (!this._panel) { return; }

        const discordId = this._context.globalState.get<string>('discordId');
        const isConnected = !!discordId;
        const leaderboard = await getLeaderboard();
        
        this._panel.webview.html = this.getHtmlContent(isConnected, leaderboard);
        
        this._panel.webview.onDidReceiveMessage(async message => {
            switch (message.command) {
                case 'connectDiscord':
                    await vscode.commands.executeCommand('extension.updateDiscordId');
                    this.updateWebview();
                    break;
            }
        });
    }

    public getHtmlContent(isConnected: boolean, leaderboard: any[]) {
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
                        background: #f5f5f5;
                        border-radius: 4px;
                    }
                    .medal { 
                        width: 20px; 
                        height: 20px; 
                        margin-right: 10px;
                    }
                </style>
            </head>
            <body>
                ${isConnected ? `
                    <div class="header">
                        <h2>Leaderboard</h2>
                        <button class="connect-button" onclick="reconnectDiscord()">Re-link Discord</button>
                    </div>
                    <div class="leaderboard">
                        ${leaderboard.map((user, index) => `
                            <div class="user-row">
                                ${this.getMedalIcon(index + 1)}
                                <span>${user.username} - ${this.formatTime(user.totalCodingTime)}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="text-align: center; margin-top: 50px;">
                        <button class="connect-button" onclick="connectDiscord()">Connect to Discord</button>
                    </div>
                `}
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
        if (position === 1) { return '🥇'; }
        if (position === 2) { return '🥈'; }
        if (position === 3) { return '🥉'; }
        return `${position}.`;
    }

    private formatTime(seconds: number) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        // if time is > 24 hours than display days
        if (days > 0) { return `${days}d ${hours}h ${minutes}m`; }
        else { return `${hours}h ${minutes}m`; }
    }
}