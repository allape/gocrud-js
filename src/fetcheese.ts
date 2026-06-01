import { TFunction } from "i18next";

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

export interface IErrorHandler<T = unknown, D = T> {
  retriedCount?: number;
  onError?: (e: unknown | Error, parsedMessage: string) => Promise<D> | D;
  errorMessageTranslator?: (errorMessage: string) => string | Promise<string>;
}

export interface IRequestConfig<T = unknown, D = T>
  extends RequestInit, IErrorHandler<T, D> {
  enableBasicAuth?: boolean;
  tFunc?: TFunction;
  onHeadersReceived?: (res: Response) => Promise<void> | void;
  onDataReceived?: (data: T) => Promise<D> | D;
}

export async function fetcheese<T = unknown, D = T>(
  url: string,
  config: IRequestConfig<T, D> = {},
): Promise<D> {
  try {
    const [u, headers] = config.enableBasicAuth ? parseURL(url) : [url, {}];

    const res = await fetch(u, {
      ...config,
      headers: {
        Accept: "application/json; charset=utf-8",
        ...headers,
        ...config.headers,
      },
    });

    config.onHeadersReceived?.(res);

    const data: T = await res.json();

    return config.onDataReceived
      ? await config.onDataReceived(data)
      : (data as unknown as D);
  } catch (e) {
    config.retriedCount = (config?.retriedCount || 0) + 1;
    if (config.onError) {
      let errorMessage = stringify(e);
      errorMessage = config.errorMessageTranslator
        ? await config.errorMessageTranslator(errorMessage)
        : errorMessage;
      return config.onError(e, errorMessage);
    }
    throw e;
  }
}

export function stringify(err: Error | unknown): string {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return `${err?.message || err?.m || err?.msg || err}`;
}
