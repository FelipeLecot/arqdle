import type {
  ApiErrorBody,
  BuildingOption,
  GuessResponse,
  Mode,
  PuzzleStart,
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

export function startPuzzle(mode: Mode, excludeId?: string): Promise<PuzzleStart> {
  const params = new URLSearchParams({ mode });
  if (mode === 'practice' && excludeId) params.set('exclude', excludeId);
  return request<PuzzleStart>(`/api/puzzle?${params.toString()}`);
}

export function submitGuess(token: string, guessId: string): Promise<GuessResponse> {
  return request<GuessResponse>('/api/guess', {
    method: 'POST',
    body: JSON.stringify({ token, guessId }),
  });
}
