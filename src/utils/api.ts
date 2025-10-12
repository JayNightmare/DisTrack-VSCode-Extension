import axios from "axios";
import * as vscode from "vscode";
import { generateDeviceId } from "./device";
require("dotenv").config();

async function getAPILink() {
    const extension = vscode.extensions.getExtension("JayNightmare.distrack");
    if (!extension) {
        vscode.window.showErrorMessage(
            "<< Extension 'JayNightmare.distrack' not found >>"
        );
        return "";
    }
    const linkPath = vscode.Uri.joinPath(
        extension.extensionUri,
        "assets",
        "link.txt"
    );

    try {
        const linkData = await vscode.workspace.fs.readFile(linkPath);
        return Buffer.from(linkData).toString("utf8").trim();
    } catch (error) {
        vscode.window.showErrorMessage("<< Failed to read link.txt >>");
        return "";
    }
}

async function getTokens(deviceId: string, linkCode: string) {
    try {
        const response = await axios.get(
            `${endpointUrl}/extension/key/auth/${deviceId}/${linkCode}`
        );
        const token = response.data ?? "";

        return token;
    } catch (err) {
        throw err;
    }
}

// (initialization moved to initializeApi)

// String to store the API endpoint URL and tokens
let endpointUrl = "";
let deviceId = "";
let apiToken = "";
let botToken = "";

const DEVICE_SECRET_KEY = "deviceId";
const API_TOKEN_SECRET_KEY = "apiToken";
const BOT_TOKEN_SECRET_KEY = "botToken";

// Exported initializer: ensures endpointUrl/deviceId are available and persists deviceId in secrets.
export async function initializeApi(
    context: vscode.ExtensionContext,
    linkCode?: string
): Promise<boolean> {
    try {
        endpointUrl = await getAPILink();

        // Ensure deviceId exists in secret storage
        let storedDeviceId = await context.secrets.get(DEVICE_SECRET_KEY);
        if (!storedDeviceId) {
            const generated = await generateDeviceId();
            storedDeviceId = generated.id;
            await context.secrets.store(DEVICE_SECRET_KEY, storedDeviceId);
            console.log("<< Generated and stored new deviceId in secrets >>");
        }

        deviceId = storedDeviceId ?? "";
        console.log(`<< Device Id: ${deviceId} >>`);

        if (!linkCode) {
            apiToken = (await context.secrets.get(API_TOKEN_SECRET_KEY)) ?? "";
            botToken = (await context.secrets.get(BOT_TOKEN_SECRET_KEY)) ?? "";
            if (!apiToken) {
                console.log("<< No stored API token found in secrets >>");
            }
        }

        // If a linkCode is provided, attempt to fetch tokens immediately
        if (linkCode) {
            try {
                const data = await getTokens(deviceId, linkCode);
                apiToken = data.user.linkAPIKey ?? "";
                botToken = data.discord.token ?? data.token ?? "";
                console.log(`<< Api Token: ${apiToken} >>`);
                if (apiToken) {
                    await context.secrets.store(API_TOKEN_SECRET_KEY, apiToken);
                }
                if (botToken) {
                    await context.secrets.store(BOT_TOKEN_SECRET_KEY, botToken);
                }
                return !!apiToken;
            } catch (err) {
                console.error(
                    "<< Failed to fetch tokens during initializeApi >>",
                    err
                );
                apiToken = "";
                botToken = "";
                return false;
            }
        }

        return !!apiToken;
    } catch (error) {
        console.error("<< initializeApi failed >>", error);
        return false;
    }
}

// Getter for bot token (may be populated by initializeApi)
export async function getBotToken(): Promise<string> {
    if (botToken) {
        return botToken;
    }
    vscode.window.showErrorMessage(
        "Discord bot token not available. Please link your account via the DisTrack website."
    );
    throw new Error("Bot token unavailable");
}

// Function to send session data
export async function sendSessionData(
    userId: string,
    username: string,
    duration: number,
    sessionDate: string,
    languages: Record<string, number>,
    streakData: {
        currentStreak: number;
        longestStreak: number;
    }
) {
    try {
        if (!apiToken) {
            vscode.window.showErrorMessage(
                "Cannot send coding session data. Please link your account again."
            );
            throw new Error("Missing API token");
        }

        await axios.post(
            `${endpointUrl}/coding-session`,
            {
                userId,
                username,
                duration,
                sessionDate,
                languages,
                streakData,
            },
            {
                headers: { Authorization: `Bearer ${apiToken}` },
            }
        );
    } catch (error) {
        console.error("<< Failed to send session data: ", error);
        throw error; // Re-throw to allow calling code to handle the error
    }
}

// Check if a Discord user ID has a valid format (15-32 numeric digits)
function isValidDiscordId(userId: string): boolean {
    return /^\d{15,32}$/.test(userId);
}

// Validate the Discord user ID by checking both format and API verification
export async function checkAndValidateUserId(userId: string): Promise<boolean> {
    if (!isValidDiscordId(userId)) {
        vscode.window.showErrorMessage(
            "<< Invalid Discord ID format | Enable Developer Mode In Discord And Try Again >>"
        );
        return false;
    }

    try {
        const botToken = await getBotToken();

        const response = await axios.get(
            `https://discord.com/api/v10/users/${userId}`,
            {
                headers: { Authorization: `Bot ${botToken}` },
            }
        );

        if (response.status === 200) {
            console.log("<< Discord ID is valid >>");
            return true;
        }
    } catch (error: any) {
        const status = error.response?.status;
        if (status === 401) {
            vscode.window.showErrorMessage(
                "<< Unauthorized: Check bot token permissions >>"
            );
        } else if (status === 404) {
            vscode.window.showErrorMessage(
                "<< The Discord ID does not exist | Please enter a valid ID >>"
            );
        } else {
            console.error(
                "<< Error checking Discord ID:",
                error.response?.data || error.message
            );
            vscode.window.showErrorMessage(
                "<< Error connecting to Discord API | Please try again later >>"
            );
        }
    }
    return false;
}

// Function to fetch the username from the Discord API
export async function getDiscordUsername(
    userId: string
): Promise<string | null> {
    try {
        if (userId === null) {
            return null;
        }
        const botToken = await getBotToken();

        const response = await axios.get(
            `https://discord.com/api/v10/users/${userId}`,
            {
                headers: { Authorization: `Bot ${botToken}` },
            }
        );

        if (response.status === 200) {
            const username = response.data.username;
            return username;
        }
    } catch (error: any) {
        const status = error.response?.status;
        if (status === 401) {
            vscode.window.showErrorMessage(
                "<< Unauthorized: Check bot token permissions >>"
            );
        } else if (status === 404) {
            vscode.window.showErrorMessage(
                "<< The Discord ID does not exist | Please enter a valid ID >>"
            );
        } else {
            console.error(
                "<< Error fetching Discord username:",
                error.response?.data || error.message
            );
            vscode.window.showErrorMessage(
                "<< Error connecting to Discord API | Please try again later >>"
            );
        }
    }
    return null;
}

export async function getLeaderboard() {
    try {
        if (!apiToken) {
            console.error("<< Missing API token for leaderboard >>");
            return [];
        }
        const response = await axios.get(`${endpointUrl}/leaderboard`, {
            headers: { Authorization: `Bearer ${apiToken}` },
        });
        return response.data;
    } catch (error) {
        console.error("<< Failed to fetch leaderboard:", error);
        return [];
    }
}

// New function to fetch user profile
export async function getUserProfile(userId: string) {
    try {
        if (!apiToken) {
            console.error("<< Missing API token for user profile >>");
            return null;
        }
        const response = await axios.get(
            `${endpointUrl}/user-profile/${userId}`,
            {
                headers: { Authorization: `Bearer ${apiToken}` },
            }
        );
        return response.data;
    } catch (error) {
        console.error("<< Failed to fetch user profile:", error);
        return null;
    }
}

export async function getStreakData(userId: string) {
    try {
        if (!apiToken) {
            console.error("<< Missing API token for streak data >>");
            return { currentStreak: 0, longestStreak: 0 };
        }
        const response = await axios.get(`${endpointUrl}/streak/${userId}`, {
            headers: { Authorization: `Bearer ${apiToken}` },
        });
        return response.data;
    } catch (error) {
        console.error("<< Failed to fetch streak data:", error);
        return { currentStreak: 0, longestStreak: 0 };
    }
}

export async function getLanguageDurations(userId: string) {
    try {
        if (!apiToken) {
            console.error("<< Missing API token for language durations >>");
            return {};
        }
        const response = await axios.get(`${endpointUrl}/languages/${userId}`, {
            headers: { Authorization: `Bearer ${apiToken}` },
        });
        return response.data;
    } catch (error) {
        console.error("<< Failed to fetch language durations:", error);
        return {};
    }
}

// New function to link account with 6-digit code
export async function linkAccountWithCode(
    context: vscode.ExtensionContext,
    linkCode: string,
    deviceId: string
): Promise<{
    success: boolean;
    userId?: string;
    token?: string;
    apiToken?: string;
    error?: string;
}> {
    try {
        console.log(`<< Linking account with code ${linkCode} >>`);

        const response = await axios.post(
            `${endpointUrl}/extension/link`,
            { linkCode, deviceId },
            {
                headers: apiToken
                    ? { Authorization: `Bearer ${apiToken}` }
                    : undefined,
            }
        );

        if (response.status === 200 && response.data.user.userId) {
            const apiKey =
                response.data.user?.linkAPIKey ||
                response.data.user?.apiKey ||
                response.data.apiToken ||
                "";
            const discordToken =
                response.data.discord?.token || response.data.token || "";

            if (apiKey) {
                apiToken = apiKey;
                await context.secrets.store(API_TOKEN_SECRET_KEY, apiToken);
            }

            if (discordToken) {
                botToken = discordToken;
                await context.secrets.store(BOT_TOKEN_SECRET_KEY, botToken);
            }

            return {
                success: true,
                userId: response.data.user.userId,
                token: discordToken,
                apiToken: apiKey,
            };
        } else {
            return { success: false, error: response.data.error };
        }
    } catch (error: any) {
        const status = error.response?.status;
        let errorMessage = "Failed to link account";

        if (status === 400) {
            errorMessage = `Invalid code format ${linkCode}`;
        } else if (status === 404) {
            errorMessage = "Code not found or expired";
        } else if (status === 409) {
            errorMessage = "Code already used";
        } else {
            console.error(
                "<< Error linking account with code:",
                error.response?.data || error.message
            );
        }

        return { success: false, error: errorMessage };
    }
}

// Return true or false if the user has linked their account
export async function isAccountLinked(userId: string): Promise<boolean> {
    try {
        if (!apiToken) {
            console.error("<< Missing API token for link check >>");
            return false;
        }
        const response = await axios.get(
            `${endpointUrl}/user-profile/${userId}`,
            {
                headers: { Authorization: `Bearer ${apiToken}` },
            }
        );

        if (response.status === 200 && response.data.displayName !== null) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error("<< Failed to check if account is linked:", error);
        return false;
    }
}
