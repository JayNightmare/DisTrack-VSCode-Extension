import axios from "axios";
import { getApiBaseUrl } from "./baseUrl";

export interface LinkStartResponse {
    pollToken: string;
    linkCode: string;
    expiresIn: number;
}

export interface LinkFinishResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

export interface VerifyLinkResponse {
    success: boolean;
    user: {
        userId: string;
        username: string;
        displayName: string;
        extensionLinked: boolean;
        totalCodingTime: number;
    };
}

export async function verifyLinkCode(
    code: string
): Promise<VerifyLinkResponse> {
    const baseUrl = await getApiBaseUrl();
    const response = await axios.post(`${baseUrl}/extension/link`, { code });

    const { success, user } = response.data ?? {};

    if (
        success !== true ||
        !user ||
        typeof user.userId !== "string" ||
        typeof user.username !== "string" ||
        typeof user.displayName !== "string" ||
        typeof user.extensionLinked !== "boolean" ||
        typeof user.totalCodingTime !== "number"
    ) {
        throw new Error("Invalid response when verifying link code");
    }

    return { success, user };
}

export async function startLink(deviceId: string): Promise<LinkStartResponse> {
    const baseUrl = await getApiBaseUrl();
    const response = await axios.post(`${baseUrl}/v1/link/start`, {
        device_id: deviceId,
    });

    const {
        code: linkCode,
        poll_token: pollToken,
        expires_in: expiresIn,
    } = response.data ?? {};

    if (!pollToken || !linkCode || !expiresIn) {
        throw new Error("Malformed link start response");
    }

    return {
        linkCode,
        pollToken,
        expiresIn,
    };
}

export async function finishLink(
    deviceId: string,
    pollToken: string
): Promise<LinkFinishResponse> {
    const baseUrl = await getApiBaseUrl();
    const response = await axios.post(`${baseUrl}/v1/link/finish`, {
        device_id: deviceId,
        poll_token: pollToken,
    });

    const { access_token, refresh_token, expires_in } = response.data ?? {};

    if (!access_token || !refresh_token || !expires_in) {
        throw new Error("Link finish did not provide tokens");
    }

    return { access_token, refresh_token, expires_in };
}
