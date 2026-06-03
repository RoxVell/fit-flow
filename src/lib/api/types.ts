export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiQueued {
  ok: true;
  queued: true;
  id: string;
}

export interface ApiFailure {
  ok: false;
  status: number;
  error: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiQueued | ApiFailure;
