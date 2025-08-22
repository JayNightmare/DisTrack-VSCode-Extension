import * as vscode from "vscode";

export class SecretManager {
    private static instance: SecretManager;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public static getInstance(
        context?: vscode.ExtensionContext
    ): SecretManager {
        if (!SecretManager.instance && context) {
            SecretManager.instance = new SecretManager(context);
        } else if (!SecretManager.instance) {
            throw new Error(
                "SecretManager must be initialized with context first"
            );
        }
        return SecretManager.instance;
    }

    // Store API token securely
    async storeApiToken(apiToken: string): Promise<void> {
        await this.context.secrets.store("distrack.apiToken", apiToken);
        console.log("<< API token stored securely >>");
    }

    // Retrieve API token
    async getApiToken(): Promise<string | undefined> {
        return await this.context.secrets.get("distrack.apiToken");
    }

    // Store Discord bot token securely
    async storeDiscordBotToken(botToken: string): Promise<void> {
        await this.context.secrets.store("distrack.discordBotToken", botToken);
        console.log("<< Discord bot token stored securely >>");
    }

    // Retrieve Discord bot token
    async getDiscordBotToken(): Promise<string | undefined> {
        return await this.context.secrets.get("distrack.discordBotToken");
    }

    // Store API endpoint URL (this could be in regular config since it's not sensitive)
    async storeEndpointUrl(endpointUrl: string): Promise<void> {
        const config = vscode.workspace.getConfiguration("distrack");
        await config.update(
            "endpointUrl",
            endpointUrl,
            vscode.ConfigurationTarget.Global
        );
        console.log("<< Endpoint URL stored in configuration >>");
    }

    // Retrieve API endpoint URL
    getEndpointUrl(): string {
        const config = vscode.workspace.getConfiguration("distrack");
        return (
            config.get<string>("endpointUrl") ||
            "https://api.endpoint-system.uk"
        );
    }

    // Check if all required secrets are configured
    async areSecretsConfigured(): Promise<boolean> {
        const apiToken = await this.getApiToken();
        const botToken = await this.getDiscordBotToken();
        const endpointUrl = this.getEndpointUrl();

        return !!(apiToken && botToken && endpointUrl);
    }

    // Delete all stored secrets (for reset/logout functionality)
    async clearAllSecrets(): Promise<void> {
        await this.context.secrets.delete("distrack.apiToken");
        await this.context.secrets.delete("distrack.discordBotToken");
        console.log("<< All secrets cleared >>");
    }

    // New method: Store credentials received from link-account
    async storeCredentialsFromLinking(credentials: {
        apiToken: string;
        botToken: string;
        endpointUrl: string;
    }): Promise<void> {
        try {
            await this.storeApiToken(credentials.apiToken);
            await this.storeDiscordBotToken(credentials.botToken);
            await this.storeEndpointUrl(credentials.endpointUrl);
            console.log(
                "<< Credentials from account linking stored securely >>"
            );
        } catch (error) {
            console.error(
                "<< Error storing credentials from linking >>",
                error
            );
            throw error;
        }
    }

    // Migration function to move from file-based storage to secret storage
    async migrateFromFiles(): Promise<boolean> {
        try {
            const extension = vscode.extensions.getExtension(
                "JayNightmare.dis-track"
            );
            if (!extension) {
                return false;
            }

            // Check if secrets are already configured
            if (await this.areSecretsConfigured()) {
                console.log(
                    "<< Secrets already configured, skipping migration >>"
                );
                return true;
            }

            // Read from existing files and store in secret storage
            try {
                const apiTokenPath = vscode.Uri.joinPath(
                    extension.extensionUri,
                    "assets",
                    "api.txt"
                );
                const apiTokenData = await vscode.workspace.fs.readFile(
                    apiTokenPath
                );
                const apiToken = Buffer.from(apiTokenData)
                    .toString("utf8")
                    .trim();
                if (apiToken) {
                    await this.storeApiToken(apiToken);
                }
            } catch (error) {
                console.log("<< No api.txt file found or error reading it >>");
            }

            try {
                const botTokenPath = vscode.Uri.joinPath(
                    extension.extensionUri,
                    "assets",
                    "discord.txt"
                );
                const botTokenData = await vscode.workspace.fs.readFile(
                    botTokenPath
                );
                const botToken = Buffer.from(botTokenData)
                    .toString("utf8")
                    .trim();
                if (botToken) {
                    await this.storeDiscordBotToken(botToken);
                }
            } catch (error) {
                console.log(
                    "<< No discord.txt file found or error reading it >>"
                );
            }

            try {
                const linkPath = vscode.Uri.joinPath(
                    extension.extensionUri,
                    "assets",
                    "link.txt"
                );
                const linkData = await vscode.workspace.fs.readFile(linkPath);
                const endpointUrl = Buffer.from(linkData)
                    .toString("utf8")
                    .trim();
                if (endpointUrl) {
                    await this.storeEndpointUrl(endpointUrl);
                }
            } catch (error) {
                console.log("<< No link.txt file found or error reading it >>");
            }

            console.log("<< Migration from files completed >>");
            return true;
        } catch (error) {
            console.error("<< Error during migration >>", error);
            return false;
        }
    }

    // Setup wizard - now directs users to link Discord account instead of manual entry
    async runSetupWizard(): Promise<boolean> {
        const choice = await vscode.window.showInformationMessage(
            "To configure DisTrack, please link your Discord account. This will automatically set up all necessary credentials.",
            "Link Discord Account"
        );

        if (choice === "Link Discord Account") {
            vscode.commands.executeCommand("extension.updateDiscordId");
            return false; // User needs to go through Discord linking process
        }

        return false;
    }
}
