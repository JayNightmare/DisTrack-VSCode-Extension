import axios from "axios";

const endpointUrl = ""; 
// * Endpoint URL - I use -> http://server-ip:port/listening-link | http://localhost:8080 if you're hosting from your local machine.

export async function sendSessionData(discordId: string, duration: number, sessionDate: string) {
    try {
        const response = await axios.post(endpointUrl, {
            userId: discordId,
            duration: duration,
            sessionDate: sessionDate,
        });
        console.log("<< Data successfully sent to Discord: >>");
        console.log(response.data);
    } catch (error) {
        console.error(`<< Failed to send session data: ${error} >>`);
    }
}