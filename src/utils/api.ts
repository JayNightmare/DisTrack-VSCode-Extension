import { request } from "../api/client";

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalCodingTime: number;
}

export interface UserProfile {
  userId: string;
  username: string;
  displayName: string;
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
