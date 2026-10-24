import type { Job, ListResponse, Student } from './types.js';

const JOB_PORTAL_API_URL = process.env.JOB_PORTAL_API_URL ?? 'http://localhost:3001';
const CAMPUS_API_URL = process.env.CAMPUS_API_URL ?? 'http://localhost:3002';
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS ?? 30_000);

export class ApiError extends Error {}

type QueryValue = string | number | boolean | string[] | undefined;

async function getJson<T>(baseUrl: string, path: string, query: Record<string, QueryValue> = {}): Promise<T> {
  const url = new URL(path, baseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || (Array.isArray(value) && value.length === 0)) continue;
    url.searchParams.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  } catch (err) {
    throw new ApiError(`Cannot reach ${baseUrl} (${(err as Error).message}). Is the API running? Try \`npm run dev\` in the repo root.`);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join('; ') : body.message;
    throw new ApiError(`${res.status} from ${url.pathname}: ${message ?? res.statusText}`);
  }
  return (await res.json()) as T;
}

/** Caches the full job and student lists for a short TTL; matching needs everything in memory. */
class Snapshot<T> {
  private value?: { at: number; data: T[] };
  constructor(private readonly load: () => Promise<T[]>) {}

  async get(): Promise<T[]> {
    if (!this.value || Date.now() - this.value.at > CACHE_TTL_MS) {
      this.value = { at: Date.now(), data: await this.load() };
    }
    return this.value.data;
  }
}

const allJobs = new Snapshot(async () => (await getJson<ListResponse<Job>>(JOB_PORTAL_API_URL, '/jobs')).data);
const allStudents = new Snapshot(async () => (await getJson<ListResponse<Student>>(CAMPUS_API_URL, '/students')).data);

export const jobPortal = {
  all: () => allJobs.get(),
  search: (query: Record<string, QueryValue>) => getJson<ListResponse<Job>>(JOB_PORTAL_API_URL, '/jobs', query),
  get: (id: number) => getJson<Job>(JOB_PORTAL_API_URL, `/jobs/${id}`),
};

export const campus = {
  all: () => allStudents.get(),
  search: (query: Record<string, QueryValue>) => getJson<ListResponse<Student>>(CAMPUS_API_URL, '/students', query),
  /** Accepts a numeric id ("42") or a roll number ("27CSE014"). */
  get: (idOrRollNo: string) =>
    /^\d+$/.test(idOrRollNo.trim())
      ? getJson<Student>(CAMPUS_API_URL, `/students/${idOrRollNo.trim()}`)
      : getJson<Student>(CAMPUS_API_URL, `/students/roll/${encodeURIComponent(idOrRollNo.trim())}`),
};
