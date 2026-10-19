import { fetcheese, type IRequestConfig } from "./fetcheese";
import Default, { ot } from "./i18n";
import { isFetchAbortError } from "./misc";
import { IBase, IBaseSearchParams } from "./model";

export type Code = string;
export type Message = string;

export interface IResponse<Data = unknown> {
  c: Code;
  m: Message;
  d: Data;
}

export type Config<T = unknown> = IRequestConfig<IResponse<T>, T>;

export type GetFunc = <T = unknown>(
  url: string,
  config?: Config<T>,
) => Promise<T>;

export function newGetFunc<T = unknown>(defaultConfig?: Config<T>): GetFunc {
  return async <T = unknown>(
    url: string,
    config: Config<T> = {},
  ): Promise<T> => {
    return await fetcheese<IResponse<T>, T>(url, {
      ...defaultConfig,
      useBasicAuth: true,
      onDataReceived: (data: IResponse<T>): T => {
        if (data.c !== "0") {
          throw data;
        }
        return data.d;
      },
      onError: async (e: unknown | Error, message: string): Promise<T> => {
        if (isFetchAbortError(e)) {
          throw e;
        }

        if (
          confirm(
            `${message} | ${ot("gocrud.retryQuestionMark", Default.gocrud.retryQuestionMark, config.tFunc)}`,
          )
        ) {
          return get(url, config);
        } else {
          throw e;
        }
      },
      onHeadersReceived: (res: Response): void => {
        if (res.status < 200 || res.status >= 300) {
          throw new Error(res.statusText);
        }
      },
      ...config,
    });
  };
}

export const get = newGetFunc();

export default class Crudy<
  T extends IBase,
  SearchParams extends IBaseSearchParams = IBaseSearchParams,
> {
  constructor(
    public readonly baseUrl: string,
    protected readonly getFunc: GetFunc = get,
  ) {}

  static QuerySearchSearchParamsStringify<SearchParams = object>(
    searchParams?: SearchParams,
  ): string {
    if (!searchParams) {
      return "";
    }
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value === undefined) {
        delete (searchParams as Record<string, unknown>)[key];
      }
    });
    return `?${new URLSearchParams(searchParams)}`;
  }

  static BodySearchParamsStringify<SearchParams = object>(
    searchParams?: SearchParams,
  ): string {
    if (!searchParams) {
      return "{}";
    }

    return JSON.stringify(searchParams, (key, value) => {
      if (key === "") {
        return value;
      }

      // ignore all kinds of this value
      if (value === undefined || value === null || Number.isNaN(value)) {
        return undefined;
      }

      if (value instanceof Array) {
        return value.join(",");
      }

      // only one depth
      if (typeof value === "object") {
        return `${JSON.stringify(value)}`;
      }

      return `${value}`;
    });
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * @deprecated use {@link all} instead
   */
  async _all(searchParams?: SearchParams, config?: Config<T[]>): Promise<T[]> {
    return this.getFunc<T[]>(
      `${this.baseUrl}/all${Crudy.QuerySearchSearchParamsStringify<SearchParams>(searchParams)}`,
      config,
    );
  }

  async all(searchParams?: SearchParams, config?: Config<T[]>): Promise<T[]> {
    return this.getFunc<T[]>(`${this.baseUrl}/all`, {
      ...config,
      method: "POST",
      body: Crudy.BodySearchParamsStringify<SearchParams>(searchParams),
    });
  }

  async one(id: string | number, config?: Config<T>): Promise<T> {
    return this.getFunc<T>(`${this.baseUrl}/one/${id}`, config);
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * @deprecated use {@link page} instead
   */
  async _page(
    page: number,
    size: number,
    searchParams?: SearchParams,
    config?: Config<T[]>,
  ): Promise<T[]> {
    return this.getFunc<T[]>(
      `${this.baseUrl}/page/${page}/${size}${Crudy.QuerySearchSearchParamsStringify(searchParams)}`,
      config,
    );
  }

  async page(
    page: number,
    size: number,
    searchParams?: SearchParams,
    config?: Config<T[]>,
  ): Promise<T[]> {
    return this.getFunc<T[]>(`${this.baseUrl}/page/${page}/${size}`, {
      ...config,
      method: "POST",
      body: Crudy.BodySearchParamsStringify<SearchParams>(searchParams),
    });
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * @deprecated use {@link count} instead
   */
  async _count(
    searchParams?: SearchParams,
    config?: Config<number>,
  ): Promise<number> {
    return this.getFunc<number>(
      `${this.baseUrl}/count${Crudy.QuerySearchSearchParamsStringify(searchParams)}`,
      config,
    );
  }

  async count(
    searchParams?: SearchParams,
    config?: Config<number>,
  ): Promise<number> {
    return this.getFunc<number>(`${this.baseUrl}/count`, {
      ...config,
      method: "POST",
      body: Crudy.BodySearchParamsStringify<SearchParams>(searchParams),
    });
  }

  async save(data: Partial<T>, config?: Config<T>): Promise<T> {
    return this.getFunc<T>(this.baseUrl, {
      method: "PUT",
      body: JSON.stringify(data),
      ...config,
    });
  }

  async delete(
    id: string | number,
    config?: Config<boolean>,
  ): Promise<boolean> {
    return this.getFunc<boolean>(`${this.baseUrl}/${id}`, {
      method: "DELETE",
      ...config,
    });
  }
}
