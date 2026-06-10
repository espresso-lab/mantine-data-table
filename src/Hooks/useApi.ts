import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useDataTable } from "./useDataTable.ts";
import type { GetHeaders } from "../Context/DataTableContext.tsx";

export interface FieldViolation {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly violations?: FieldViolation[];

  constructor(message: string, status: number, violations?: FieldViolation[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.violations = violations;
  }
}

export function getFieldViolations(error: unknown): FieldViolation[] | undefined {
  return error instanceof ApiError ? error.violations : undefined;
}

async function fetchWithError(url: string, init: RequestInit): Promise<Response> {
  const resp = await fetch(url, init);
  if (resp.status >= 400) {
    const responseText = await resp.text();
    if (!responseText) {
      throw new ApiError(`HTTP ${resp.status}: ${resp.statusText}`, resp.status);
    }
    let errorJson: { message?: string; error?: string; title?: string; violations?: FieldViolation[] } | null = null;
    try {
      errorJson = JSON.parse(responseText);
    } catch {
      throw new ApiError(responseText, resp.status);
    }
    const violations = Array.isArray(errorJson?.violations)
      ? errorJson.violations
          .filter((v) => v?.field && v?.message)
          .map((v) => ({ field: String(v.field), message: String(v.message) }))
      : undefined;
    throw new ApiError(
      errorJson?.message ?? errorJson?.error ?? errorJson?.title ?? responseText,
      resp.status,
      violations,
    );
  }
  return resp;
}

export interface BaseEntity {
  id: string | number;
}

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

const toKey = (queryKey: Array<string | number>): string[] => queryKey.map((k) => k.toString());

export async function getAll<T extends BaseEntity>(
  path: string,
  getHeaders: GetHeaders,
): Promise<T[]> {
  const resp = await fetchWithError(path, { method: "GET", headers: await getHeaders() });
  return resp.json();
}

export async function getOne<T extends BaseEntity>(
  path: string,
  id: string | number,
  getHeaders: GetHeaders,
): Promise<T> {
  const resp = await fetchWithError(`${path}/${id}`, { method: "GET", headers: await getHeaders() });
  return resp.json();
}

export async function deleteOne(
  path: string,
  id: string | number,
  getHeaders: GetHeaders,
): Promise<void> {
  await fetchWithError(`${path}/${id}`, { method: "DELETE", headers: await getHeaders() });
}

export async function createOne<C, T extends BaseEntity>(
  path: string,
  item: C,
  getHeaders: GetHeaders,
): Promise<T> {
  const resp = await fetchWithError(path, {
    method: "POST",
    headers: await getHeaders(),
    body: JSON.stringify(item),
  });
  if (resp.status === 204) return item as unknown as T;
  return resp.json();
}

export async function api<R, U>(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  path: string,
  getHeaders: GetHeaders,
  payload?: U,
): Promise<R> {
  const resp = await fetchWithError(path, {
    method,
    headers: await getHeaders(),
    body: payload ? JSON.stringify(payload) : undefined,
  });
  if (resp.status === 204) return undefined as R;
  return resp.json();
}

export async function updateOne<T extends BaseEntity>(
  path: string,
  item: AtLeast<T, "id">,
  getHeaders: GetHeaders,
): Promise<T> {
  const resp = await fetchWithError(`${path}/${item.id}`, {
    method: "PUT",
    headers: await getHeaders(),
    body: JSON.stringify(item),
  });
  if (resp.status === 204) return item as T;
  return resp.json();
}

export function useGetOne<T extends BaseEntity>(
  apiPath: string,
  queryKey: Array<string | number>,
  id?: string | number,
) {
  const { baseUrl, getHeaders } = useDataTable();
  return useQuery<T>({
    queryKey: [...toKey(queryKey), String(id?.toString())],
    queryFn: () => getOne<T>(`${baseUrl}${apiPath}`, id!, getHeaders),
    enabled: !!id,
  });
}

export function useGetAll<T extends BaseEntity>(
  apiPath: string,
  queryKey: Array<string | number>,
  enabled: boolean = true,
) {
  const { baseUrl, getHeaders } = useDataTable();
  return useQuery<T[]>({
    queryKey: toKey(queryKey),
    queryFn: () => getAll<T>(`${baseUrl}${apiPath}`, getHeaders),
    enabled,
  });
}

function invalidateAfterMutation(
  queryClient: QueryClient,
  queryKey: Array<string | number>,
  connectedQueryKeys?: Array<Array<string | number>>,
) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: toKey(queryKey) }),
    ...(connectedQueryKeys ?? []).map((connectedQueryKey) =>
      queryClient.invalidateQueries({ queryKey: connectedQueryKey }),
    ),
  ]);
}

export function useAddOne<T extends BaseEntity>(
  apiPath: string,
  queryKey: Array<string | number>,
  connectedQueryKeys?: Array<Array<string | number>>,
) {
  const { baseUrl, queryClient, getHeaders } = useDataTable();
  return useMutation<T, Error, Omit<T, "id">>({
    mutationKey: toKey(queryKey),
    mutationFn: (item) =>
      createOne<Omit<T, "id">, T>(`${baseUrl}${apiPath}`, item, getHeaders),
    onSettled: () => invalidateAfterMutation(queryClient, queryKey, connectedQueryKeys),
  });
}

export function useUpdateOne<T extends BaseEntity>(
  apiPath: string,
  queryKey: Array<string | number>,
  connectedQueryKeys?: Array<Array<string | number>>,
) {
  const { baseUrl, queryClient, getHeaders } = useDataTable();
  return useMutation<T, Error, AtLeast<T, "id">>({
    mutationKey: toKey(queryKey),
    mutationFn: (item) =>
      updateOne<T>(`${baseUrl}${apiPath}`, item, getHeaders),
    onSettled: () => invalidateAfterMutation(queryClient, queryKey, connectedQueryKeys),
  });
}

export function useDeleteOne(
  apiPath: string,
  queryKey: Array<string | number>,
  connectedQueryKeys?: Array<Array<string | number>>,
) {
  const { baseUrl, queryClient, getHeaders } = useDataTable();
  return useMutation<void, Error, string | number>({
    mutationKey: toKey(queryKey),
    mutationFn: (id) => deleteOne(`${baseUrl}${apiPath}`, id, getHeaders),
    onSettled: () => invalidateAfterMutation(queryClient, queryKey, connectedQueryKeys),
  });
}
