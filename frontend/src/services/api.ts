export type ApiError = {
  code: string;
  message: string;
  requestId?: string;
};

type ApiResponse<T> = {
  code: string;
  message: string;
  data: T;
};

const API_PREFIX = "/api/v1";

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string | null
): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw error ?? {
      code: "NETWORK_ERROR",
      message: `Request failed with status ${response.status}`
    };
  }

  const payload = (await response.json()) as ApiResponse<T>;
  return payload.data;
}

