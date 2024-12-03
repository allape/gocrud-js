export type Headers = Record<string, string>;
export type URLString = ReturnType<URL["toString"]>;

export function parseURL(url: string): [URLString, Headers] {
  // noinspection HttpUrlsUsage
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return [url, {}];
  }

  const u = new URL(url);
  const headers: Headers = {};

  if (u.username) {
    headers["Authorization"] = `Basic ${btoa(`${u.username}:${u.password}`)}`;
    u.username = "";
    u.password = "";
  }

  return [u.toString(), headers];
}

export interface IRequestConfig<T = unknown, D = T> extends RequestInit {
  enableBasicAuth?: boolean;
  onHeadersReceived?: (res: Response) => Promise<void> | void;
  onDataReceived?: (data: T) => Promise<D> | D;
  onError?: (e: unknown | Error) => Promise<D> | D;
}

export async function fetcheese<
  T = unknown,
  D = T,
  C extends IRequestConfig<T, D> = IRequestConfig<T, D>,
>(url: string, config?: C): Promise<D> {
  try {
    const [u, headers] = config?.enableBasicAuth ? parseURL(url) : [url, {}];

    const res = await fetch(u, {
      ...config,
      headers: {
        ...headers,
        ...config?.headers,
      },
    });

    config?.onHeadersReceived?.(res);

    const data = await res.json();

    return config?.onDataReceived ? await config.onDataReceived(data) : data;
  } catch (e) {
    if (config?.onError) {
      return config.onError(e);
    }
    throw e;
  }
}

export function stringify(err: Error | unknown): string {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return `${err?.message || err?.m || err?.msg || err}`;
}
