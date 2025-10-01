import * as vscode from "vscode";
import { v4 as uuidv4 } from "uuid";
import { request } from "../api/client";

const QUEUE_KEY = "distrack.session_queue";
const MAX_QUEUE_ITEMS = 500;
const FLUSH_INTERVAL_MS = 60_000;

export interface SessionPayload {
    session_id: string;
    duration: number;
    sessionDate: string;
    languages: Record<string, number>;
    streakData: {
        currentStreak: number;
        longestStreak: number;
    };
}

interface StoredSession extends SessionPayload {
    queuedAt: string;
    attempts: number;
    lastError?: string;
}

export class SessionQueue implements vscode.Disposable {
    private readonly context: vscode.ExtensionContext;
    private flushTimer: NodeJS.Timeout | null = null;
    private isFlushing = false;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    start() {
        if (this.flushTimer) {
            return;
        }
        this.flushTimer = setInterval(() => {
            this.flush().catch((error) => {
                console.warn("<< Session queue flush failed >>", error);
            });
        }, FLUSH_INTERVAL_MS);
    }

    stop() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    dispose() {
        this.stop();
    }

    async enqueue(payload: Omit<SessionPayload, "session_id"> & {
        session_id?: string;
    }): Promise<string> {
        const sessionId = payload.session_id ?? uuidv4();
        const storedPayload: StoredSession = {
            session_id: sessionId,
            duration: payload.duration,
            sessionDate: payload.sessionDate,
            languages: payload.languages,
            streakData: payload.streakData,
            queuedAt: new Date().toISOString(),
            attempts: 0,
        };

        const queue = await this.loadQueue();
        queue.push(storedPayload);

        if (queue.length > MAX_QUEUE_ITEMS) {
            queue.splice(0, queue.length - MAX_QUEUE_ITEMS);
        }

        await this.saveQueue(queue);
        void this.flush();
        return sessionId;
    }

    async flush(): Promise<void> {
        if (this.isFlushing) {
            return;
        }
        this.isFlushing = true;

        try {
            const queue = await this.loadQueue();
            if (!queue.length) {
                return;
            }

            const remaining: StoredSession[] = [];

            for (const item of queue) {
                const { attempts, queuedAt, lastError, ...payload } = item;
                try {
                    await request("/v1/sessions", {
                        method: "POST",
                        body: payload,
                    });
                } catch (error: any) {
                    remaining.push({
                        ...item,
                        attempts: attempts + 1,
                        lastError: error?.message ?? String(error),
                    });
                }
            }

            await this.saveQueue(remaining);
        } finally {
            this.isFlushing = false;
        }
    }

    private async loadQueue(): Promise<StoredSession[]> {
        const stored = this.context.globalState.get<StoredSession[]>(
            QUEUE_KEY,
            []
        );
        return Array.isArray(stored) ? [...stored] : [];
    }

    private async saveQueue(queue: StoredSession[]): Promise<void> {
        await this.context.globalState.update(QUEUE_KEY, queue);
    }
}
