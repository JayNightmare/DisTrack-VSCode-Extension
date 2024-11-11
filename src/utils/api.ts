import axios from "axios";

const endpointUrl = ""; 
// * Endpoint URL - I use -> http://server-ip:port/listening-link | http://localhost:8080 if you're hosting from your local machine.

export async function sendSessionData(userId: string, duration: number, sessionDate: string, languages: Record<string, number>) {
    try {
        const response = await axios.post(endpointUrl, {
            userId,
            duration,
            sessionDate,
            languages
        });
        console.log("Data sent successfully:", response.data);
    } catch (error) {
        console.error("Failed to send session data:", error);
    }
}