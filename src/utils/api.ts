import axios from "axios";
import * as vscode from "vscode";
import { generateDeviceId } from "./device";
import { exportCode } from "../extension";
require("dotenv").config();

async function getAPILink() {
    const extension = vscode.extensions.getExtension("JayNightmare.dis-track");
    if (!extension) {
        vscode.window.showErrorMessage(
            "<< Extension 'JayNightmare.dis-track' not found >>"
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

async function getBotToken(
    deviceId: string,
    linkCode: string
): Promise<string> {
    try {
        const token = await getTokens(deviceId, linkCode);

        if (!token) {
            throw new Error("Discord bot token is not configured");
        }

        return token.botToken;
    } catch (error) {
        vscode.window.showErrorMessage(
            "<< Failed to read token from discord.txt >>"
        );
        return "";
    }
}

// String to store the API endpoint URL
let endpointUrl = "";
getAPILink().then((link) => {
    endpointUrl = link;
});

let deviceId = "";
generateDeviceId().then(({ id }) => {
    deviceId = id;
});

// Fetch the API token from the file
let apiToken = "";
getTokens(deviceId, exportCode)
    .then((data) => {
        apiToken = data.user?.linkAPIKey ?? "";
    })
    .catch((error) => {
        console.error("<< Failed to fetch API token:", error);
        apiToken = "";
    });

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
        const botToken = await getBotToken(deviceId, exportCode);

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
        const botToken = await getBotToken(deviceId, exportCode);

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
        const response = await axios.get(`${endpointUrl}/languages/${userId}`, {
            headers: { Authorization: `${apiToken}` },
        });
        return response.data;
    } catch (error) {
        console.error("<< Failed to fetch language durations:", error);
        return {};
    }
}

// New function to link account with 6-digit code
export async function linkAccountWithCode(
    linkCode: string,
    deviceId: string
): Promise<{
    success: boolean;
    userId?: string;
    token?: string;
    error?: string;
}> {
    try {
        console.log(`<< Linking account with code ${linkCode} >>`);

        const response = await axios.post(
            `${endpointUrl}/extension/link`,
            { linkCode, deviceId },
            {
                headers: { Authorization: `${apiToken}` },
            }
        );

        if (response.status === 200 && response.data.user.userId) {
            return {
                success: true,
                userId: response.data.user.userId,
                token: response.data.discord.token,
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
        const response = await axios.get(
            `${endpointUrl}/user-profile/${userId}`,
            {
                headers: { Authorization: `${apiToken}` },
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
