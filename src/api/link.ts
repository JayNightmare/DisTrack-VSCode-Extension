import axios from "axios";
import { getApiBaseUrl } from "./baseUrl";

export interface LinkStartResponse {
  pollToken: string;
  linkCode: string;
  verificationUrl: string;
  expiresIn: number;
  pollInterval?: number;
}

export interface LinkFinishResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export async function startLink(deviceId: string): Promise<LinkStartResponse> {
  const baseUrl = await getApiBaseUrl();
  const response = await axios.post(`${baseUrl}/v1/link/start`, {
    device_id: deviceId,
  });

  const {
    poll_token: pollToken,
    link_code: linkCode,
    verification_url: verificationUrl,
    expires_in: expiresIn,
    poll_interval: pollInterval,
  } = response.data ?? {};

  if (!pollToken || !linkCode || !verificationUrl || !expiresIn) {
    throw new Error("Malformed link start response");
  }

  return {
    pollToken,
    linkCode,
    verificationUrl,
    expiresIn,
    pollInterval,
  };
}

export async function finishLink(
  deviceId: string,
  pollToken: string,
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
