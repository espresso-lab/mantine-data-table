// Utility to parse API errors into a standard object
export function parseApiError(error: unknown): { message: string; code?: string; details?: any } {
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

// Helper function to handle HTTP error responses consistently
async function handleHttpError(resp: Response): Promise<never> {
  // Read the response body as text first, then try to parse as JSON
  // This approach avoids the "body already consumed" issue entirely
  const responseText = await resp.text();
  
  if (!responseText) {
    // No body content, use status info
    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  }
  
  // Try to parse as JSON
  let errorJson: { message?: string; error?: string; details?: string } | null = null;
  try {
    errorJson = JSON.parse(responseText);
  } catch {
    // Not valid JSON, use the raw text
    throw new Error(responseText);
  }
  
  // Extract the message from the parsed JSON
  if (errorJson?.message) {
    throw new Error(errorJson.message);
  } else if (errorJson?.error) {
    throw new Error(errorJson.error);
  } else {
    // JSON was parsed but no message/error field found
    throw new Error(responseText);
  }
}
import { useMutation, useQuery } from "@tanstack/react-query";
import { getIdToken } from "@espresso-lab/mantine-cognito";
import { useDataTable } from "./useDataTable.ts";

export interface BaseEntity {
  id: string | number;
}

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

function getAssumeOrg(): HeadersInit {
  const org = localStorage.getItem("a360.assumed-org");
  return org ? { "X-Assume-Org": org } : {};
}

export async function getApiHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${(await getIdToken()) ?? ""}`,
    ...getAssumeOrg(),
  };
}

export async function getAll<T extends BaseEntity>(path: string): Promise<T[]> {
  return fetch(path, {
    method: "GET",
    headers: await getApiHeaders(),
  })
    .then(async (resp) => {
      if (resp.status >= 400) {
        await handleHttpError(resp);
      }
      return resp;
    })
    .then((resp) => resp.json())
    .then((data) => data as T[]);
}

export async function getOne<T extends BaseEntity>(
  path: string,
  id: string | number,
): Promise<T> {
  return fetch(`${path}/${id}`, {
    method: "GET",
    headers: await getApiHeaders(),
  })
    .then(async (resp) => {
      if (resp.status >= 400) {
        await handleHttpError(resp);
      }
      return resp;
    })
    .then((resp) => resp.json())
    .then((data) => data as T);
}

export async function deleteOne(
  path: string,
  id: string | number,
): Promise<void> {
  const resp = await fetch(`${path}/${id}`, {
    method: "DELETE",
    headers: await getApiHeaders(),
  });
  
  if (resp.status >= 400) {
    await handleHttpError(resp);
  }
}

export async function createOne<C, T extends BaseEntity>(
  path: string,
  item: C,
): Promise<T> {
  return fetch(path, {
    method: "POST",
    headers: await getApiHeaders(),
    body: JSON.stringify(item),
  })
    .then(async (resp) => {
      if (resp.status >= 400) {
        await handleHttpError(resp);
      }
      return resp;
    })
    .then((resp) => {
      if (resp.status == 204) {
        return item;
      } else {
        return resp.json();
      }
    })
    .then((data) => data as T);
}

export async function api<R, U>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  payload?: U,
): Promise<R> {
  return fetch(path, {
    method,
    headers: await getApiHeaders(),
    body: payload ? JSON.stringify(payload) : undefined,
  })
    .then(async (resp) => {
      if (resp.status >= 400) {
        await handleHttpError(resp);
      }
      return resp;
    })
    .then((resp) => {
      if (resp.status == 204) {
        return;
      } else {
        return resp.json();
      }
    })
    .then((data) => data as R);
}

export async function updateOne<T extends BaseEntity>(
  path: string,
  item: AtLeast<T, "id">,
): Promise<T> {
  return fetch(`${path}/${item.id}`, {
    method: "PUT",
    headers: await getApiHeaders(),
    body: JSON.stringify(item),
  })
    .then(async (resp) => {
      if (resp.status >= 400) {
        await handleHttpError(resp);
      }
      return resp;
    })
    .then((resp) => {
      if (resp.status == 204) {
        return item;
      } else {
        return resp.json();
      }
    })
    .then((data) => data as T);
}

export function useGetOne<T extends BaseEntity>(
  apiPath: string,
  queryKey: Array<string | number>,
  id?: string | number,
) {
  const { baseUrl } = useDataTable();
  return useQuery<T>({
    queryKey: [...queryKey.map((k) => k.toString()), String(id?.toString())],
    queryFn: () => getOne<T>(`${baseUrl}${apiPath}`, id!),
    enabled: !!id,
  });
}

export function useGetAll<T extends BaseEntity>(
  apiPath: string,
  queryKey: Array<string | number>,
  enabled: boolean = true,
) {
  const { baseUrl } = useDataTable();
  return useQuery<T[]>({
    queryKey: [...queryKey.map((k) => k.toString())],
    queryFn: () => getAll<T>(`${baseUrl}${apiPath}`),
    enabled
  });
}

export function useAddOne<T extends BaseEntity>(
  apiPath: string,
  queryKey: Array<string | number>,
) {
  const { baseUrl, queryClient } = useDataTable();
  return useMutation<T, Error, Omit<T, "id">>({
    mutationKey: [...queryKey.map((k) => k.toString())],
    mutationFn: (item) =>
      createOne<Omit<T, "id">, T>(`${baseUrl}${apiPath}`, item),
    onSettled() {
      return queryClient.invalidateQueries({
        queryKey: [...queryKey.map((k) => k.toString())]
      });
    },
    onError(error) {
      parseApiError(error);
    },
  });
}

export function useUpdateOne<T extends BaseEntity>(
  apiPath: string,
  queryKey: Array<string | number>,
) {
  const { baseUrl, queryClient } = useDataTable();
  return useMutation<T, Error, AtLeast<T, "id">>({
    mutationKey: [...queryKey.map((k) => k.toString())],
    mutationFn: (item: AtLeast<T, "id">) =>
      updateOne<T>(`${baseUrl}${apiPath}`, item),
    onSettled() {
      return queryClient.invalidateQueries({
        queryKey: [...queryKey.map((k) => k.toString())]
      });
    },
    onError(error) {
      parseApiError(error);
    },
  });
}

export function useDeleteOne(
  apiPath: string,
  queryKey: Array<string | number>,
) {
  const { baseUrl, queryClient } = useDataTable();
  return useMutation<void, Error, string | number>({
    mutationKey: [...queryKey.map((k) => k.toString())],
    mutationFn: (id) => deleteOne(`${baseUrl}${apiPath}`, id),
    onSettled() {
      return queryClient.invalidateQueries({
        queryKey: [...queryKey.map((k) => k.toString())]
      });
    },
    onError(error) {
      parseApiError(error);
    },
  });
}
