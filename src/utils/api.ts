import axios from "axios";
import * as vscode from "vscode";
import { generateDeviceId } from "./device";
import { getGlobalStateValue, updateGlobalStateValue } from "../extension";
require("dotenv").config();

const EXTENSION_IDENTIFIER = "JayNightmare.dis-track";

export interface LeaderboardEntry {
    userId: string;
    username: string;
    displayName?: string | null;
    totalCodingTime: number;
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
}

export interface UserProfile {
    userId: string;
    username: string;
    displayName?: string | null;
    extensionLinked?: boolean;
    totalCodingTime?: number;
    streak?: StreakData;
    bio?: string | null;
    avatarUrl?: string | null;
    [key: string]: unknown;
}

export interface LinkAccountResult {
    success: boolean;
    userId?: string;
    linkApiKey?: string;
    error?: string;
}

let endpointUrl: string | null = null;
let endpointPromise: Promise<string> | null = null;

async function getAPILink(): Promise<string> {
    const extension = vscode.extensions.getExtension(EXTENSION_IDENTIFIER);
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

async function resolveEndpointUrl(): Promise<string> {
    if (endpointUrl) {
        return endpointUrl;
    }

    if (!endpointPromise) {
        endpointPromise = (async () => {
            const link = await getAPILink();
            endpointUrl = link.replace(/\/$/, "");
            return endpointUrl;
        })();
    }

    const resolved = await endpointPromise;
    if (!resolved) {
        throw new Error("DisTrack API endpoint URL is unavailable");
    }
    return resolved;
}

async function getBotToken(): Promise<string> {
    try {
        const token = process.env.DISCORD_BOT_TOKEN?.trim();

        if (!token) {
            throw new Error("Discord bot token is not configured");
        }

        return token;
        // TODO: Grab from endpoint than set it as vscode secret
    } catch (error) {
        vscode.window.showErrorMessage(
            "<< Failed to read token from discord.txt >>"
        );
        return "";
    }
}

export async function getAPIToken(
    deviceId: string,
    linkCode: string
): Promise<string> {
    try {
        // ? Grab from endpoint result from linking account
        if (!deviceId) {
            vscode.window.showErrorMessage(
                "<< Invalid Discord ID format | Enable Developer Mode In Discord And Try Again >>"
            );
            return "";
        }

        const baseUrl = await resolveEndpointUrl();
        const response = await axios.get(
            `${baseUrl}/extension/key/auth/${deviceId}/${linkCode}`
        );
        const token = response.data?.token ?? "";

        if (!token) {
            throw new Error("API token not found in response");
        }

        setApiToken(token);
        return token;
    } catch (error) {
        vscode.window.showErrorMessage(
            "<< Failed to read token from discord.txt >>"
        );
        return "";
    }
}

let cachedDeviceId: string | null = null;
let deviceIdPromise: Promise<string> | null = null;
let apiToken: string | null = null;

async function resolveDeviceId(): Promise<string> {
    if (cachedDeviceId) {
        return cachedDeviceId;
    }

    if (!deviceIdPromise) {
        deviceIdPromise = (async () => {
            const stateDeviceId = getGlobalStateValue<string>("deviceId");
            if (stateDeviceId) {
                cachedDeviceId = stateDeviceId;
                return stateDeviceId;
            }

            const { id } = await generateDeviceId();
            cachedDeviceId = id;
            await updateGlobalStateValue("deviceId", id);
            return id;
        })();
    }

    return deviceIdPromise;
}

export async function getOrCreateDeviceId(): Promise<string> {
    return resolveDeviceId();
}

function setApiToken(token: string | null) {
    if (!token) {
        apiToken = null;
        return;
    }
    apiToken = token.startsWith("Bearer ") ? token.slice(7) : token;
}

function buildAuthHeader(): Record<string, string> | null {
    if (!apiToken) {
        return null;
    }
    return { Authorization: `Bearer ${apiToken}` };
}

export function initializeApiToken(token: string | null): void {
    setApiToken(token ?? null);
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
        const baseUrl = await resolveEndpointUrl();
        const headers = buildAuthHeader();

        if (!headers) {
            vscode.window.showErrorMessage(
                "<< Missing API token. Please link your DisTrack account again. >>"
            );
            return;
        }

        await axios.post(
            `${baseUrl}/coding-session`,
            {
                userId,
                username,
                duration,
                sessionDate,
                languages,
                streakData,
            },
            {
                headers,
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

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
        const baseUrl = await resolveEndpointUrl();
        const headers = buildAuthHeader();

        if (!headers) {
            console.warn("<< Missing API token for leaderboard request >>");
            return [];
        }

        const response = await axios.get(`${baseUrl}/leaderboard`, {
            headers,
        });
        return response.data ?? [];
    } catch (error) {
        console.error("<< Failed to fetch leaderboard:", error);
        return [];
    }
}

export async function getUserProfile(
    userId: string
): Promise<UserProfile | null> {
    if (!userId) {
        return null;
    }

    try {
        const baseUrl = await resolveEndpointUrl();
        const headers = buildAuthHeader();

        if (!headers) {
            console.warn("<< Missing API token for user profile request >>");
            return null;
        }

        const response = await axios.get(`${baseUrl}/user-profile/${userId}`, {
            headers,
        });
        return response.data ?? null;
    } catch (error) {
        console.error("<< Failed to fetch user profile:", error);
        return null;
    }
}

export async function getStreakData(userId: string): Promise<StreakData> {
    if (!userId) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    try {
        const baseUrl = await resolveEndpointUrl();
        const headers = buildAuthHeader();

        if (!headers) {
            console.warn("<< Missing API token for streak request >>");
            return { currentStreak: 0, longestStreak: 0 };
        }

        const response = await axios.get(`${baseUrl}/streak/${userId}`, {
            headers,
        });
        return response.data ?? { currentStreak: 0, longestStreak: 0 };
    } catch (error) {
        console.error("<< Failed to fetch streak data:", error);
        return { currentStreak: 0, longestStreak: 0 };
    }
}

export async function getLanguageDurations(
    userId: string
): Promise<Record<string, number>> {
    if (!userId) {
        return {};
    }

    try {
        const baseUrl = await resolveEndpointUrl();
        const headers = buildAuthHeader();

        if (!headers) {
            console.warn("<< Missing API token for languages request >>");
            return {};
        }

        const response = await axios.get(`${baseUrl}/languages/${userId}`, {
            headers,
        });
        return response.data ?? {};
    } catch (error) {
        console.error("<< Failed to fetch language durations:", error);
        return {};
    }
}

export async function linkAccountWithCode(
    linkCode: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
        console.log(`<< Linking account with code ${linkCode} >>`);

        const baseUrl = await resolveEndpointUrl();
        const headers = buildAuthHeader();
        const config = headers ? { headers } : undefined;

        const response = await axios.post(
            `${baseUrl}/extension/link`,
            { linkCode },
            config
        );

        if (response.status === 200 && response.data.user?.userId) {
            return { success: true, userId: response.data.user.userId };
        }

        return { success: false, error: response.data?.error };
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

export async function isAccountLinked(userId: string): Promise<boolean> {
    if (!userId) {
        return false;
    }

    try {
        const baseUrl = await resolveEndpointUrl();
        const headers = buildAuthHeader();

        if (!headers) {
            console.warn("<< Missing API token for link status check >>");
            return false;
        }

        const response = await axios.get(`${baseUrl}/user-profile/${userId}`, {
            headers,
        });

        return response.status === 200 && response.data?.displayName !== null;
    } catch (error) {
        console.error("<< Failed to check if account is linked:", error);
        return false;
    }
}
