import * as vscode from "vscode";

/**
 * Centralized configuration management for the DisTrack extension
 */
export class ConfigManager {
    private static instance: ConfigManager;

    private constructor() {}

    static getInstance(): ConfigManager {
        if (!this.instance) {
            this.instance = new ConfigManager();
        }
        return this.instance;
    }

    /**
     * Get the timer format configuration
     */
    getTimerFormat(): string {
        return vscode.workspace
            .getConfiguration("extension")
            .get<string>("sessionTimerFormat", "hh:mm:ss");
    }

    /**
     * Check if Rich Presence is enabled
     */
    isRichPresenceEnabled(): boolean {
        return vscode.workspace
            .getConfiguration("extension")
            .get<boolean>("enableRichPresence", true);
    }

    /**
     * Get Discord ID from configuration
     */
    getConfigDiscordId(): string | undefined {
        return vscode.workspace
            .getConfiguration("extension")
            .get<string>("updateDiscordId");
    }

    /**
     * Get language detection debounce delay in milliseconds
     */
    getLanguageDetectionDelay(): number {
        return vscode.workspace
            .getConfiguration("extension")
            .get<number>("languageDetectionDelay", 500);
    }

    /**
     * Listen for configuration changes
     */
    onConfigurationChanged(
        callback: (e: vscode.ConfigurationChangeEvent) => void
    ): vscode.Disposable {
        return vscode.workspace.onDidChangeConfiguration(callback);
    }

    /**
     * Check if a specific configuration section has changed
     */
    hasConfigurationChanged(
        e: vscode.ConfigurationChangeEvent,
        section: string
    ): boolean {
        return e.affectsConfiguration(section);
    }
}
