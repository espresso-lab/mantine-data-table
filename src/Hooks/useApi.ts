import { useMutation, useQuery } from "@tanstack/react-query";
import { useDataTable } from "./useDataTable.ts";
import type { GetHeaders } from "../Context/DataTableContext.tsx";

export function parseApiError(error: unknown): { message: string; code?: string; details?: unknown } {
  if (typeof error === "string") {
    try {
      const parsed = JSON.parse(error);
      return {
        message: parsed.message || error,
        code: parsed.code,
        details: parsed.details,
      };
    } catch {
      return { message: error };
    }
  }
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: "Unbekannter Fehler" };
}

async function fetchWithError(url: string, init: RequestInit): Promise<Response> {
  const resp = await fetch(url, init);
  if (resp.status >= 400) {
    const responseText = await resp.text();
    if (!responseText) {
      throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
    }
    let errorJson: { message?: string; error?: string } | null = null;
    try {
      errorJson = JSON.parse(responseText);
    } catch {
      throw new Error(responseText);
    }
    throw new Error(errorJson?.message ?? errorJson?.error ?? responseText);
  }
  return resp;
}

export interface BaseEntity {
  id: string | number;
}

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

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
    queryKey: [...queryKey.map((k) => k.toString()), String(id?.toString())],
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
    queryKey: [...queryKey.map((k) => k.toString())],
    queryFn: () => getAll<T>(`${baseUrl}${apiPath}`, getHeaders),
    enabled,
  });
}

export function useAddOne<T extends BaseEntity>(
  apiPath: string,
  queryKey: Array<string | number>,
) {
  const { baseUrl, queryClient, getHeaders } = useDataTable();
  return useMutation<T, Error, Omit<T, "id">>({
    mutationKey: [...queryKey.map((k) => k.toString())],
    mutationFn: (item) =>
      createOne<Omit<T, "id">, T>(`${baseUrl}${apiPath}`, item, getHeaders),
    onSettled() {
      return queryClient.invalidateQueries({
        queryKey: [...queryKey.map((k) => k.toString())]
      });
    },
  });
}

export function useUpdateOne<T extends BaseEntity>(
  apiPath: string,
  queryKey: Array<string | number>,
) {
  const { baseUrl, queryClient, getHeaders } = useDataTable();
  return useMutation<T, Error, AtLeast<T, "id">>({
    mutationKey: [...queryKey.map((k) => k.toString())],
    mutationFn: (item) =>
      updateOne<T>(`${baseUrl}${apiPath}`, item, getHeaders),
    onSettled() {
      return queryClient.invalidateQueries({
        queryKey: [...queryKey.map((k) => k.toString())]
      });
    },
  });
}

export function useDeleteOne(
  apiPath: string,
  queryKey: Array<string | number>,
) {
  const { baseUrl, queryClient, getHeaders } = useDataTable();
  return useMutation<void, Error, string | number>({
    mutationKey: [...queryKey.map((k) => k.toString())],
    mutationFn: (id) => deleteOne(`${baseUrl}${apiPath}`, id, getHeaders),
    onSettled() {
      return queryClient.invalidateQueries({
        queryKey: [...queryKey.map((k) => k.toString())]
      });
    },
  });
}
