import type {
  ApiErrorBody,
  BuildingOption,
  GameView,
  LegacyImportRequest,
  Me,
} from '../shared/types';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code = 'unknown', status = 0) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      credentials: 'same-origin',
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError('Could not reach the game server. Check your connection.', 'network');
  }

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = null;
    }
    throw new ApiError(
      body?.error.message ?? `Request failed with HTTP ${response.status}.`,
      body?.error.code ?? 'http_error',
      response.status,
    );
  }

  return (await response.json()) as T;
}

let buildingsPromise: Promise<BuildingOption[]> | null = null;

export function loadBuildings(): Promise<BuildingOption[]> {
  if (!buildingsPromise) {
    buildingsPromise = request<BuildingOption[]>('/api/buildings').catch((error) => {
      buildingsPromise = null;
      throw error;
    });
  }
  return buildingsPromise;
}

export function loadMe(): Promise<Me> {
  return request<Me>('/api/me');
}

export function importLegacy(payload: LegacyImportRequest): Promise<Me> {
  return request<Me>('/api/me/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loadDailyGame(): Promise<GameView> {
  return request<GameView>('/api/games/daily');
}

export function loadPracticeGame(newGame = false, excludeId?: string): Promise<GameView> {
  const params = new URLSearchParams();
  if (newGame) params.set('new', '1');
  if (excludeId) params.set('exclude', excludeId);
  const query = params.toString();
  return request<GameView>(`/api/games/practice${query ? `?${query}` : ''}`);
}

export function submitGameGuess(gameId: string, buildingId: string): Promise<GameView> {
  return request<GameView>(`/api/games/${encodeURIComponent(gameId)}/guess`, {
    method: 'POST',
    body: JSON.stringify({ buildingId }),
  });
}

export async function signOut(): Promise<void> {
  await request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export async function deleteAccount(): Promise<void> {
  await request<{ ok: boolean }>('/api/me', { method: 'DELETE' });
}

export const exportDataUrl = '/api/me/export';
