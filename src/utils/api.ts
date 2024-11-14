import axios from "axios";
import * as vscode from "vscode";

const endpointUrl = "";

// Function to send session data
export async function sendSessionData(userId: string, duration: number, sessionDate: string, languages: Record<string, number>) {
    try {
        const response = await axios.post(endpointUrl, {
            userId,
            duration,
            sessionDate,
            languages
        });
        console.log("<< Data sent successfully:", response.data);
    } catch (error) {
        console.error("<< Failed to send session data: ", error);
    }
}

// Check if a Discord user ID has a valid format (17-18 numeric digits)
function isValidDiscordId(userId: string): boolean {
    return /^\d{17,18}$/.test(userId);
}

// Validate the Discord user ID by checking both format and API verification
export async function checkAndValidateUserId(userId: string): Promise<boolean> {
    // Check if the ID format is valid
    if (!isValidDiscordId(userId)) {
        vscode.window.showErrorMessage("<< Invalid Discord ID format | Enable Developer Mode In Discord And Try Again >>");
        return false;
    }

    // Check that the token is loaded
    // if (!process.env.DISCORD_TOKEN) {
    //     console.log("<< DISCORD_TOKEN:", process.env.DISCORD_TOKEN);
    //     vscode.window.showErrorMessage("<< Discord token is not loaded. Please check your .env configuration. >>");
    //     return false;
    // }

    // API call to verify if the ID exists on Discord
    try {
        const response = await axios.get(`https://discord.com/api/v10/users/${userId}`, {
            headers: { Authorization: `Bot BOT_TOKEN_HERE` }, // Has to be a string
        });
        
        // If the request is successful, ID exists
        if (response.status === 200) {
            console.log("<< Discord ID is valid >>");
            return true;
        }
    } catch (error: any) {  // 'any' type to access `response` properties
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
