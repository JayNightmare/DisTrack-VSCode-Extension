import axios from "axios";
import * as vscode from "vscode";

console.log("--------\nVSCode Machine ID:", vscode.env.machineId);

const endpointUrl = "";

export async function sendSessionData(duration: number) {
    try {
        const response = await axios.post(endpointUrl, {
            user: vscode.env.machineId,
            duration: duration,
        });
        console.log("Data successfully sent to Discord:", response.data);
    } catch (error) {
        console.error("Failed to send session data:", error);
    }
}
