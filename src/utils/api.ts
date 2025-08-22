import axios from "axios";
import * as vscode from "vscode";
import { SecretManager } from "./secretManager";
require("dotenv").config();

async function getAPILink(): Promise<string> {
    const secretManager = SecretManager.getInstance();
    const endpointUrl = secretManager.getEndpointUrl();

    if (!endpointUrl) {
        vscode.window.showErrorMessage(
            "<< API endpoint URL not configured. Please run setup first. >>"
        );
        return "";
    }

    return endpointUrl;
}

async function getBotToken(): Promise<string> {
    const secretManager = SecretManager.getInstance();
    const botToken = await secretManager.getDiscordBotToken();

    if (!botToken) {
        vscode.window.showErrorMessage(
            "<< Discord bot token not configured. Please run setup first. >>"
        );
        return "";
    }

    return botToken;
}

async function getAPIToken(): Promise<string> {
    const secretManager = SecretManager.getInstance();
    const apiToken = await secretManager.getApiToken();

    if (!apiToken) {
        vscode.window.showErrorMessage(
            "<< API token not configured. Please run setup first. >>"
        );
        return "";
    }

    return apiToken;
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
        const endpointUrl = await getAPILink();
        const apiToken = await getAPIToken();

        if (!endpointUrl || !apiToken) {
            throw new Error("Missing API configuration");
        }

        const response = await axios.post(
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
                headers: { Authorization: `${apiToken}` },
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
        const endpointUrl = await getAPILink();
        const apiToken = await getAPIToken();

        if (!endpointUrl || !apiToken) {
            console.error("<< Missing API configuration for leaderboard >>");
            return [];
        }

        const response = await axios.get(`${endpointUrl}/leaderboard`, {
            headers: { Authorization: `${apiToken}` },
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
        const endpointUrl = await getAPILink();
        const apiToken = await getAPIToken();

        if (!endpointUrl || !apiToken) {
            console.error("<< Missing API configuration for user profile >>");
            return null;
        }

        const response = await axios.get(
            `${endpointUrl}/user-profile/${userId}`,
            {
                headers: { Authorization: `${apiToken}` },
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
        const endpointUrl = await getAPILink();
        const apiToken = await getAPIToken();

        if (!endpointUrl || !apiToken) {
            console.error("<< Missing API configuration for streak data >>");
            return { currentStreak: 0, longestStreak: 0 };
        }

        const response = await axios.get(`${endpointUrl}/streak/${userId}`, {
            headers: { Authorization: `${apiToken}` },
        });
        return response.data;
    } catch (error) {
        console.error("<< Failed to fetch streak data:", error);
        return { currentStreak: 0, longestStreak: 0 };
    }
}

export async function getLanguageDurations(userId: string) {
    try {
        const endpointUrl = await getAPILink();
        const apiToken = await getAPIToken();

        if (!endpointUrl || !apiToken) {
            console.error(
                "<< Missing API configuration for language durations >>"
            );
            return {};
        }

        const response = await axios.get(`${endpointUrl}/languages/${userId}`, {
            headers: { Authorization: `${apiToken}` },
        });
        return response.data;
    } catch (error) {
        console.error("<< Failed to fetch language durations:", error);
        return {};
    }
}

// New function to link account with 6-digit code and receive credentials
export async function linkAccountWithCode(linkCode: string): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
    credentials?: {
        apiToken: string;
        botToken: string;
        endpointUrl: string;
    };
}> {
    try {
        console.log(`<< Linking account with code ${linkCode} >>`);

        // Use the default endpoint URL for linking since we don't have credentials yet
        const secretManager = SecretManager.getInstance();
        const defaultEndpointUrl = secretManager.getEndpointUrl();

        const response = await axios.post(
            `${defaultEndpointUrl}/extension/link`,
            {
                linkCode,
                extensionVersion: vscode.extensions.getExtension(
                    "JayNightmare.dis-track"
                )?.packageJSON.version,
                vsCodeVersion: vscode.version,
            }
        );

        if (response.status === 200 && response.data.success) {
            console.log("<< Account linking successful >>");
            return {
                success: true,
                userId: response.data.userId,
                credentials: response.data.credentials, // New: API credentials from backend
            };
        } else {
            return {
                success: false,
                error: response.data.error || "Failed to link account",
            };
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
