import { getIdToken } from "@espresso-lab/mantine-cognito";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

export interface BaseEntity {
  id: string | number;
}

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

type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>;

async function getAll<T extends BaseEntity>(path: string): Promise<T[]> {
  return fetch(path, {
    method: "GET",
    headers: await getApiHeaders(),
  })
    .then(async (resp) => {
      if (resp.status >= 400) {
        throw await resp.text();
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
        throw await resp.text();
      }
      return resp;
    })
    .then((resp) => resp.json())
    .then((data) => data as T);
}

async function deleteOne(path: string, id: string | number): Promise<void> {
  await fetch(`${path}/${id}`, {
    method: "DELETE",
    headers: await getApiHeaders(),
  }).then(async (resp) => {
    if (resp.status >= 400) {
      throw await resp.text();
    }
    return resp;
  });
}

async function createOne<C, T extends BaseEntity>(
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
        throw await resp.text();
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

async function updateOne<T extends BaseEntity>(
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
        throw await resp.text();
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
  queryKey: (string | number)[],
  id: string | number,
) {
  return useQuery<T>({
    queryKey: [...queryKey.map((k) => k.toString()), id?.toString()],
    queryFn: () => getOne<T>(apiPath, id),
    enabled: !!id,
  });
}

export function useGetMany<T extends BaseEntity>(
  apiPath: string,
  queryKey: (string | number)[],
  ids: string[] | number[],
) {
  return useQueries({
    queries: ids.map<UseQueryOptions<T>>((id) => ({
      queryKey: [...queryKey.map((k) => k.toString()), id.toString()],
      queryFn: () => getOne<T>(apiPath, id),
    })),
  });
}

export function useGetAll<T extends BaseEntity>(
  apiPath: string,
  queryKey: (string | number)[],
  enabled = true,
) {
  return useQuery<T[]>({
    queryKey: [...queryKey.map((k) => k.toString())],
    queryFn: () => getAll<T>(apiPath),
    enabled,
  });
}

interface MutationContext<T> {
  previousItems: T[] | undefined;
}

export function useAddOne<T extends BaseEntity>(
  apiPath: string,
  queryKey: (string | number)[],
) {
  const queryClient = useQueryClient();
  return useMutation<T, Error, Omit<T, "id">, MutationContext<T>>({
    mutationFn: (item) => createOne<Omit<T, "id">, T>(apiPath, item),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({
        queryKey: [...queryKey.map((k) => k.toString())],
      });
      const previousItems = queryClient.getQueryData<T[]>([
        ...queryKey.map((k) => k.toString()),
      ]);
      queryClient.setQueryData<T[]>(
        [...queryKey.map((k) => k.toString())],
        (old) =>
          old
            ? [...old, { ...newItem, id: "temp" } as T]
            : [{ ...newItem, id: "temp" } as T],
      );
      return { previousItems };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(
          [...queryKey.map((k) => k.toString())],
          context.previousItems,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKey.map((k) => k.toString())],
      });
    },
  });
}

export function useUpdateOne<T extends BaseEntity>(
  apiPath: string,
  queryKey: (string | number)[],
) {
  const queryClient = useQueryClient();
  return useMutation<T, Error, AtLeast<T, "id">, MutationContext<T>>({
    mutationFn: (item: AtLeast<T, "id">) => updateOne<T>(apiPath, item),
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({
        queryKey: [...queryKey.map((k) => k.toString())],
      });
      const previousItems = queryClient.getQueryData<T[]>([
        ...queryKey.map((k) => k.toString()),
      ]);
      queryClient.setQueryData<T[]>(
        [...queryKey.map((k) => k.toString())],
        (old) =>
          old?.map((item) =>
            item.id !== newItem.id
              ? item
              : {
                  ...item,
                  ...newItem,
                },
          ),
      );
      queryClient.setQueryData<T>(
        [...queryKey.map((k) => k.toString()), newItem.id.toString()],
        (old) =>
          ({
            ...old,
            ...newItem,
          }) as T,
      );
      return { previousItems };
    },
    onError: (_err, _newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(
          [...queryKey.map((k) => k.toString())],
          context.previousItems,
        );
      }
    },
    onSettled: (data) => {
      queryClient.invalidateQueries({
        queryKey: [...queryKey.map((k) => k.toString())],
      });
      if (data) {
        queryClient.invalidateQueries({
          queryKey: [...queryKey.map((k) => k.toString()), data.id.toString()],
        });
      }
    },
  });
}

export function useDeleteOne<T extends BaseEntity>(
  apiPath: string,
  queryKey: (string | number)[],
) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string | number, MutationContext<T>>({
    mutationFn: (id) => deleteOne(apiPath, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: [...queryKey.map((k) => k.toString())],
      });
      const previousItems = queryClient.getQueryData<T[]>([
        ...queryKey.map((k) => k.toString()),
      ]);
      queryClient.setQueryData<T[]>(
        [...queryKey.map((k) => k.toString())],
        (old) => old?.filter((item) => item.id !== id),
      );
      queryClient.removeQueries({
        queryKey: [...queryKey.map((k) => k.toString()), id.toString()],
      });
      return { previousItems };
    },
    onError: (_err, _id, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(
          [...queryKey.map((k) => k.toString())],
          context.previousItems,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKey.map((k) => k.toString())],
      });
    },
  });
}
