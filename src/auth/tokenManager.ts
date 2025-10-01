import axios from "axios";
import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";
import { getApiBaseUrl } from "../api/baseUrl";

const ACCESS_TOKEN_KEY = "distrack.access_token";
const REFRESH_TOKEN_KEY = "distrack.refresh_token";
const ACCESS_EXPIRES_KEY = "distrack.access_token_expires_at";
const DEVICE_ID_KEY = "distrack.device_id";

interface TokenState {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
}

export class NotLinkedError extends Error {
    constructor(message = "DisTrack device is not linked") {
        super(message);
        this.name = "NotLinkedError";
    }
}

let context: vscode.ExtensionContext | undefined;
let tokensLoaded = false;
let cachedTokens: TokenState = {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
};

let refreshPromise: Promise<void> | null = null;

export interface PersistedTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export async function initializeTokenManager(
    ctx: vscode.ExtensionContext
): Promise<void> {
    context = ctx;
    await ensureDeviceId();
    await ensureTokensLoaded();
}

export async function getDeviceId(): Promise<string> {
    if (!context) {
        throw new Error("Token manager not initialized");
    }
    const existing = context.globalState.get<string>(DEVICE_ID_KEY);
    if (existing) {
        return existing;
    }

    const deviceId = uuidv4();
    await context.globalState.update(DEVICE_ID_KEY, deviceId);
    return deviceId;
}

export async function hasLinkedAccount(): Promise<boolean> {
    await ensureTokensLoaded();
    return Boolean(cachedTokens.refreshToken);
}

export async function getAuthHeader(): Promise<{ Authorization: string }> {
    await ensureTokensLoaded();

    if (!isAccessTokenValid()) {
        await refresh();
        await ensureTokensLoaded();
    }

    if (!cachedTokens.accessToken) {
        throw new NotLinkedError();
    }

    return { Authorization: `Bearer ${cachedTokens.accessToken}` };
}

export async function refresh(): Promise<void> {
    if (!context) {
        throw new Error("Token manager not initialized");
    }

    await ensureTokensLoaded();

    if (refreshPromise) {
        return refreshPromise;
    }

    const runRefresh = async () => {
        const refreshToken = cachedTokens.refreshToken;
        if (!refreshToken) {
            throw new NotLinkedError();
        }

        const deviceId = await getDeviceId();
        const baseUrl = await getApiBaseUrl();

        try {
            const response = await axios.post(`${baseUrl}/v1/auth/refresh`, {
                device_id: deviceId,
                refresh_token: refreshToken,
            });

            const {
                access_token: accessToken,
                refresh_token: newRefreshToken,
                expires_in: expiresIn,
            } = response.data ?? {};

            if (!accessToken || !expiresIn) {
                throw new Error("Malformed refresh response");
            }

            await storeTokens({
                accessToken,
                refreshToken: newRefreshToken ?? refreshToken,
                expiresIn,
            });
        } catch (error: any) {
            const status = error?.response?.status;
            if (status === 401 || status === 404) {
                await clearTokens();
                throw new NotLinkedError();
            }
            throw error;
        }
    };

    refreshPromise = runRefresh();
    try {
        await refreshPromise;
    } finally {
        refreshPromise = null;
    }
}

export async function storeTokens(tokens: PersistedTokens): Promise<void> {
    if (!context) {
        throw new Error("Token manager not initialized");
    }

    const { accessToken, refreshToken, expiresIn } = tokens;

    await context.secrets.store(ACCESS_TOKEN_KEY, accessToken);
    await context.secrets.store(REFRESH_TOKEN_KEY, refreshToken);
    const expiresAt = Date.now() + expiresIn * 1000;
    await context.globalState.update(ACCESS_EXPIRES_KEY, expiresAt);

    cachedTokens = {
        accessToken,
        refreshToken,
        expiresAt,
    };
    tokensLoaded = true;
}

export async function clearTokens(): Promise<void> {
    if (!context) {
        throw new Error("Token manager not initialized");
    }

    await context.secrets.delete(ACCESS_TOKEN_KEY);
    await context.secrets.delete(REFRESH_TOKEN_KEY);
    await context.globalState.update(ACCESS_EXPIRES_KEY, undefined);

    cachedTokens = {
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
    };
    tokensLoaded = true;
}

function isAccessTokenValid(): boolean {
    const { accessToken, expiresAt } = cachedTokens;
    if (!accessToken || !expiresAt) {
        return false;
    }
    return expiresAt - Date.now() > 60_000;
}

async function ensureTokensLoaded(): Promise<void> {
    if (!context || tokensLoaded) {
        return;
    }

    const accessToken = await context.secrets.get(ACCESS_TOKEN_KEY);
    const refreshToken = await context.secrets.get(REFRESH_TOKEN_KEY);
    const expiresAt = context.globalState.get<number>(ACCESS_EXPIRES_KEY);

    cachedTokens = {
        accessToken: accessToken ?? null,
        refreshToken: refreshToken ?? null,
        expiresAt: expiresAt ?? null,
    };
    tokensLoaded = true;
}

async function ensureDeviceId(): Promise<void> {
    if (!context) {
        throw new Error("Token manager not initialized");
    }
    const existing = context.globalState.get<string>(DEVICE_ID_KEY);
    if (existing) {
        return;
    }
    const deviceId = uuidv4();
    await context.globalState.update(DEVICE_ID_KEY, deviceId);
}
