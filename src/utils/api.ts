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

async function getAPIToken(
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

        const response = await axios.get(
            `${endpointUrl}/extension/key/auth/${deviceId}/${linkCode}`
        );
        const token = response.data?.token ?? "";

        if (!token) {
            throw new Error("API token not found in response");
        }

        return token;
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
getAPIToken(deviceId, exportCode).then((token) => {
    apiToken = token;
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

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await request<LeaderboardEntry[]>("/v1/leaderboard", {
      method: "GET",
    });
    return response.data ?? [];
  } catch (error) {
    console.error("<< Failed to fetch leaderboard >>", error);
    return [];
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const response = await request<UserProfile>("/v1/me/profile", {
      method: "GET",
    });
    return response.data ?? null;
  } catch (error) {
    console.error("<< Failed to fetch user profile >>", error);
    return null;
  }
}

export async function getStreakData(): Promise<StreakData> {
  try {
    const response = await request<StreakData>("/v1/me/streak", {
      method: "GET",
    });
    return (
      response.data ?? {
        currentStreak: 0,
        longestStreak: 0,
      }
    );
  } catch (error) {
    console.error("<< Failed to fetch streak data >>", error);
    return { currentStreak: 0, longestStreak: 0 };
  }
}

export async function getLanguageDurations(): Promise<Record<string, number>> {
  try {
    const response = await request<Record<string, number>>("/v1/me/languages", {
      method: "GET",
    });
    return response.data ?? {};
  } catch (error) {
    console.error("<< Failed to fetch language durations >>", error);
    return {};
  }
}
