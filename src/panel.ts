import * as vscode from "vscode";
import { getDiscordUsername, getLeaderboard, getStreakData, getLanguageDurations } from "./utils/api";
import { sessionStartTime } from "./utils/timeTracker";

export class DiscordCodingViewProvider implements vscode.WebviewViewProvider {
    public async updateWebviewContent(status: string) {
        if (this._view) {
            this._view.webview.postMessage({
                command: 'reconnectStatus',
                success: status === 'success',
            });
        }
    }

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
                case "reconnectDiscord":
                    await vscode.commands.executeCommand(
                        "extension.reconnectDiscord"
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

        this._view.webview.html = await this.getHtmlContent(isConnected, leaderboard);
    }

    private async getHtmlContent(isConnected: boolean, leaderboard: any[]): Promise<string> {
        console.log("<< Getting HTML Content >>");

        // Load the HTML template
        const htmlPath = vscode.Uri.joinPath(this._context.extensionUri, 'src', '/html/panel.html');
        const htmlContent = await vscode.workspace.fs.readFile(htmlPath);
        let html = Buffer.from(htmlContent).toString('utf8');

        // Update connection status
        const connectButtonContainer = isConnected ? 'none' : 'block';
        
        // Get user data
        const discordId = this._context.globalState.get<string>("discordId");
        const username = discordId ? await getDiscordUsername(discordId) : '';
        const streakData = discordId ? await getStreakData(discordId) : { currentStreak: 0, longestStreak: 0 };
        const languageDurations = discordId ? await getLanguageDurations(discordId) : {};

        // Previous ranks stored in global state
        const previousRanks = this._context.globalState.get<Record<string, number>>("previousRank") || {};

        // Current ranks map
        const currentRanks: Record<string, number> = {};
        leaderboard.forEach((user, idx) => {
            currentRanks[user.userId] = idx + 1;
        });

        const userRank = discordId && currentRanks[discordId] ? currentRanks[discordId] : 'N/A';
        const userMedal = (typeof userRank === 'number' && userRank <= 3) ? this.getMedalIcon(userRank) : '';
        const rankDelta = (typeof userRank === 'number' && previousRanks[discordId || ''] !== undefined)
            ? previousRanks[discordId || ''] - userRank
            : 0;


        // Update profile content
        const deltaHtmlProfile = (typeof userRank === 'number' && userRank > 10)
            ? this.getDeltaElement(rankDelta)
            : '';

        const profileContent = isConnected ? `
            <div class="profile-section">
                <div class="profile-item">
                    <strong>Username:</strong> ${username}
                </div>
                <br>
                <div class="profile-item">
                    <strong>Current Streak:</strong> ${streakData.currentStreak} days
                </div>
                <br>
                <div class="profile-item">
                    <strong>Longest Streak:</strong> ${streakData.longestStreak} days
                </div>
                <br>
                <div class="profile-item"></div>
                    <strong>Languages:</strong>
                    <ul class="language-list">
                    ${Object.entries(languageDurations)
                        .map(([lang, duration]) => `<li>${lang}: ${this.formatTime(duration as number)}</li>`)
                        .join('')}
                    </ul>
                </div>
                <br>
                <div class="profile-item">
                    <strong>Leaderboard Ranking:</strong> ${userRank !== 'N/A' ? `${userRank} ${userMedal} ${deltaHtmlProfile}` : 'N/A'}
                </div>
            </div>
        ` : '<p>Connect to Discord to view your profile</p>';

        // Update leaderboard content
        let leaderboardContent = '';
        const currentUserId = discordId;
        if (isConnected && leaderboard.length > 0) {
            // Find current user in leaderboard using 'id'
            const currentUserIndex = leaderboard.findIndex(user => user.userId === currentUserId);
            const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : -1;

            // Get top 10 users
            const top10 = leaderboard.slice(0, 10);

            // Generate top 10 entries
            leaderboardContent = top10
                .map((user, index) => {
                    const rank = index + 1;
                    const delta = previousRanks[user.userId] !== undefined ? previousRanks[user.userId] - rank : 0;
                    const deltaHtml = this.getDeltaElement(delta);
                    return `
                    <div class="user-row ${user.userId === currentUserId ? 'current-user' : ''}">
                        ${this.getMedalIcon(rank)}
                        <span>${user.username} - ${this.formatTime(user.totalCodingTime)}</span>
                        ${deltaHtml}
                    </div>
                    `;
                })
                .join('');
            
            // Add ellipsis if there are more than 10 users
            if (leaderboard.length > 10) {
                leaderboardContent += `
                    <div class="ellipsis">...</div>
                `;
            }

            // Add current user at bottom if not in top 10
            if (currentUserRank > 10 && currentUserIndex >= 0) {
                const delta = previousRanks[currentUserId || ''] !== undefined ? previousRanks[currentUserId || ''] - currentUserRank : 0;
                const deltaHtml = this.getDeltaElement(delta);
                leaderboardContent += `
                    <div class="user-row current-user">
                        <span>${currentUserRank}. ${leaderboard[currentUserIndex].username} - ${this.formatTime(leaderboard[currentUserIndex].totalCodingTime)}</span>
                        ${deltaHtml}
                    </div>
                `;
            }
        } else {
            leaderboardContent = `
                <div class="user-row">
                    <span>Leaderboard is not available. Try Again Later</span>
                </div>
            `;
        }

        // Update timer with session start time
        const timerScript = `
            const sessionStart = ${sessionStartTime ? `new Date(${sessionStartTime.getTime()})` : 'null'};
            if (sessionStart) {
                const elapsed = Math.floor((Date.now() - sessionStart.getTime()) / 1000);
                document.getElementById('timer').textContent = formatTime(elapsed);
            }
        `;

        // Replace placeholders in the HTML
        html = html
            .replace('id="connect-button-container" style="text-align: center; margin-top: 50px;"', `id="connect-button-container" style="text-align: center; margin-top: 50px; display: ${connectButtonContainer};"`)
            .replace('<!-- Profile content will be inserted here -->', profileContent)
            .replace('<!-- Leaderboard items will be inserted here -->', leaderboardContent)
            .replace('const sessionStart = null; // Will be set from the extension', timerScript);
        await this._context.globalState.update('previousRank', currentRanks);

        return html;
    }

    private getMedalIcon(position: number) {
        if (position === 1) return "🥇";
        if (position === 2) return "🥈";
        if (position === 3) return "🥉";
        return `${position}.`;
    }

    private getDeltaElement(delta: number) {
        if (delta > 0) {
            return `<span class="rank-delta up">▲${delta}</span>`;
        } else if (delta < 0) {
            return `<span class="rank-delta down">▼${Math.abs(delta)}</span>`;
        }
        return `<span class="rank-delta same">—</span>`;
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