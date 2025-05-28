import axios from "axios";
import * as vscode from "vscode";
require('dotenv').config();

async function getAPILink() {
    const extension = vscode.extensions.getExtension('JayNightmare.dis-track');
    if (!extension) {
        vscode.window.showErrorMessage("<< Extension 'JayNightmare.dis-track' not found >>");
        return "";
    }
    const linkPath = vscode.Uri.joinPath(
        extension.extensionUri,
        'assets',
        'link.txt'
    );

    try {
        const linkData = await vscode.workspace.fs.readFile(linkPath);
        return Buffer.from(linkData).toString('utf8').trim();
    } catch (error) {
        vscode.window.showErrorMessage("<< Failed to read link.txt >>");
        return "";
    }
}


async function getBotToken() {
    const tokenPath = vscode.Uri.joinPath(
        vscode.extensions.getExtension('JayNightmare.dis-track')!.extensionUri,
        'assets',
        'discord.txt'
    );

    try {
        const tokenData = await vscode.workspace.fs.readFile(tokenPath);
        return Buffer.from(tokenData).toString('utf8').trim();
    } catch (error) {
        vscode.window.showErrorMessage("<< Failed to read token from discord.txt >>");
        return "";
    }
}

async function getAPIToken() {
    const tokenPath = vscode.Uri.joinPath(
        vscode.extensions.getExtension('JayNightmare.dis-track')!.extensionUri,
        'assets',
        'api.txt'
    );

    try {
        const tokenData = await vscode.workspace.fs.readFile(tokenPath);
        return Buffer.from(tokenData).toString('utf8').trim();
    } catch (error) {
        vscode.window.showErrorMessage("<< Failed to read token from discord.txt >>");
        return "";
    }
}

// String to store the API endpoint URL
let endpointUrl: string;

// Fetch the API endpoint URL from the file
getAPILink().then(link => endpointUrl = link);

// Fetch the API token from the file
let apiToken: string;
getAPIToken().then(token => { apiToken = token; });

// Function to send session data
export async function sendSessionData(
    userId: string,
    username: string,
    duration: number,
    sessionDate: string,
    languages: Record<string, number>,
    streakData: {
        currentStreak: number;
        longestStreak: number
    }) {
    try {
        console.log("<< Send Session Data Endpoint: ", endpointUrl, " >>");

        const response = await axios.post(`${endpointUrl}/coding-session`,
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
        console.log("<< Data sent successfully:", response.data);
    } catch (error) {
        console.error("<< Failed to send session data: ", error);
        throw error; // Re-throw to allow calling code to handle the error
    }
}

// Check if a Discord user ID has a valid format (15-32 numeric digits)
function isValidDiscordId(userId: string): boolean {
    return /^\d{15,32}$/.test(userId);
}

getBotToken().then(token => console.log("<< Bot Token: ", token, " >>"));
getAPIToken().then(token => console.log("<< API Token: ", token, " >>"));

// Validate the Discord user ID by checking both format and API verification
export async function checkAndValidateUserId(userId: string): Promise<boolean> {
    if (!isValidDiscordId(userId)) {
        vscode.window.showErrorMessage("<< Invalid Discord ID format | Enable Developer Mode In Discord And Try Again >>");
        return false;
    }

    try {
        const botToken = await getBotToken();

        const response = await axios.get(`https://discord.com/api/v10/users/${userId}`, {
            headers: { Authorization: `Bot ${botToken}` },
        });
        
        if (response.status === 200) {
            console.log("<< Discord ID is valid >>");
            return true;
        }
    } catch (error: any) {
        const status = error.response?.status;
        if (status === 401) {
            vscode.window.showErrorMessage("<< Unauthorized: Check bot token permissions >>");
        } else if (status === 404) {
            vscode.window.showErrorMessage("<< The Discord ID does not exist | Please enter a valid ID >>");
        } else {
            console.error("<< Error checking Discord ID:", error.response?.data || error.message);
            vscode.window.showErrorMessage("<< Error connecting to Discord API | Please try again later >>");
        }
    }
    return false;
}

// Function to fetch the username from the Discord API
export async function getDiscordUsername(userId: string): Promise<string | null> {
    try {
        if (userId === null) { return null;}
        const botToken = await getBotToken();

        const response = await axios.get(`https://discord.com/api/v10/users/${userId}`, {
            headers: { Authorization: `Bot ${botToken}` },
        });

        if (response.status === 200) {
            const username = response.data.username; // Assuming the API returns `username` in the response
            console.log(`<< Fetched Discord username: ${username} >>`);
            return username;
        }
    } catch (error: any) {
        const status = error.response?.status;
        if (status === 401) {
            vscode.window.showErrorMessage("<< Unauthorized: Check bot token permissions >>");
        } else if (status === 404) {
            vscode.window.showErrorMessage("<< The Discord ID does not exist | Please enter a valid ID >>");
        } else {
            console.error("<< Error fetching Discord username:", error.response?.data || error.message);
            vscode.window.showErrorMessage("<< Error connecting to Discord API | Please try again later >>");
        }
    }
    return null;
}

export async function getLeaderboard() {
    try {
        console.log("<< Get Leaderboard Endpoint: ", endpointUrl, " >>");
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
        console.log("<< Get User Profile Endpoint: ", endpointUrl, " >>");
        const response = await axios.get(`${endpointUrl}/user-profile/${userId}`, {
            headers: { Authorization: `${apiToken}` },
        });
        return response.data;
    } catch (error) {
        console.error("<< Failed to fetch user profile:", error);
        return null;
    }
}

export async function getStreakData(userId: string) {
    try {
        console.log("<< Get Streak Data Endpoint: ", endpointUrl, " >>");
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
        console.log("<< Get Language Durations Endpoint: ", endpointUrl, " >>");
        const response = await axios.get(`${endpointUrl}/languages/${userId}`, {
            headers: { Authorization: `${apiToken}` },
        });
        return response.data;
    } catch (error) {
        console.error("<< Failed to fetch language durations:", error);
        return {};
    }
}