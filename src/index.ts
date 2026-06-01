import { fetcheese, type IRequestConfig } from "./fetcheese";
import Default, { ot } from "./i18n";

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
      enableBasicAuth: true,
      onDataReceived: (data: IResponse<T>): T => {
        if (data.c !== "0") {
          throw data;
        }
        return data.d;
      },
      onError: async (e: unknown | Error, message: string): Promise<T> => {
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

export const XFileDigestHeader = "X-File-Digest";

export function upload(
  url: string,
  file: File | Blob,
  getFunc: GetFunc = get,
  config?: Config<string>,
): Promise<string> {
  return getFunc<string>(url, {
    ...config,
    method: "POST",
    body: file,
  });
}

export default class Crudy<T> {
  constructor(
    public readonly baseUrl: string,
    private readonly getFunc: GetFunc = get,
  ) {}

  static QuerySearchKeywordsStringify<KEYWORDS = object>(
    keywords?: KEYWORDS,
  ): string {
    if (!keywords) {
      return "";
    }
    Object.entries(keywords).forEach(([key, value]) => {
      if (value === undefined) {
        delete (keywords as Record<string, unknown>)[key];
      }
    });
    return `?${new URLSearchParams(keywords)}`;
  }

  static BodyKeywordsStringify<KEYWORDS = object>(keywords?: KEYWORDS): string {
    if (!keywords) {
      return "{}";
    }

    return JSON.stringify(keywords, (key, value) => {
      if (key === "") {
        return value;
      }

      if (value instanceof Array) {
        return value.join(",");
      }

      if (typeof value === "object") {
        return `${JSON.stringify(value)}`;
      }

      return `${value}`;
    });
  }

  /**
   * @deprecated use {@link all} instead
   */
  async _all<KEYWORDS = object>(
    keywords?: KEYWORDS,
    config?: Config<T[]>,
  ): Promise<T[]> {
    return this.getFunc<T[]>(
      `${this.baseUrl}/all${Crudy.QuerySearchKeywordsStringify<KEYWORDS>(keywords)}`,
      config,
    );
  }

  async all<KEYWORDS = object>(
    keywords?: KEYWORDS,
    config?: Config<T[]>,
  ): Promise<T[]> {
    return this.getFunc<T[]>(`${this.baseUrl}/all`, {
      ...config,
      method: "POST",
      body: Crudy.BodyKeywordsStringify<KEYWORDS>(keywords),
    });
  }

  async one(id: string | number, config?: Config<T>): Promise<T> {
    return this.getFunc<T>(`${this.baseUrl}/one/${id}`, config);
  }

  /**
   * @deprecated use {@link page} instead
   */
  async _page<KEYWORDS = object>(
    page: number,
    size: number,
    keywords?: KEYWORDS,
    config?: Config<T[]>,
  ): Promise<T[]> {
    return this.getFunc<T[]>(
      `${this.baseUrl}/page/${page}/${size}${Crudy.QuerySearchKeywordsStringify(keywords)}`,
      config,
    );
  }

  async page<KEYWORDS = object>(
    page: number,
    size: number,
    keywords?: KEYWORDS,
    config?: Config<T[]>,
  ): Promise<T[]> {
    return this.getFunc<T[]>(`${this.baseUrl}/page/${page}/${size}`, {
      ...config,
      method: "POST",
      body: Crudy.BodyKeywordsStringify<KEYWORDS>(keywords),
    });
  }

  /**
   * @deprecated use {@link count} instead
   */
  async _count<KEYWORDS = object>(
    keywords?: KEYWORDS,
    config?: Config<number>,
  ): Promise<number> {
    return this.getFunc<number>(
      `${this.baseUrl}/count${Crudy.QuerySearchKeywordsStringify(keywords)}`,
      config,
    );
  }

  async count<KEYWORDS = object>(
    keywords?: KEYWORDS,
    config?: Config<number>,
  ): Promise<number> {
    return this.getFunc<number>(`${this.baseUrl}/count`, {
      ...config,
      method: "POST",
      body: Crudy.BodyKeywordsStringify<KEYWORDS>(keywords),
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
