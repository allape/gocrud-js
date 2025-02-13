import { fetcheese, IRequestConfig, stringify } from "./fetcheese";
import Default, { ot } from "./i18n";

export type Code = string;
export type Message = string;

export interface IResponse<Data = unknown> {
  c: Code;
  m: Message;
  d: Data;
}

export async function get<
  T = unknown,
  C extends IRequestConfig<IResponse<T>, T> = IRequestConfig<IResponse<T>, T>,
>(url: string, config?: C): Promise<T> {
  return await fetcheese<IResponse<T>, T>(url, {
    enableBasicAuth: true,
    onDataReceived: (data: IResponse<T>): T => {
      if (data.c !== "0") {
        throw data;
      }
      return data.d;
    },
    onError: async (e: unknown | Error): Promise<T> => {
      if (
        confirm(
          `${stringify(e)} | ${ot("gocrud.retryQuestionMark", Default.gocrud.retryQuestionMark)}`,
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
}

export type GetFunc = typeof get;

export function upload(
  url: string,
  file: File | Blob,
  getty: GetFunc = get,
  config?: IRequestConfig<IResponse<string>, string>,
): Promise<string> {
  return getty<string>(url, {
    ...config,
    method: "POST",
    body: file,
  });
}

export default class Crudy<T> {
  constructor(
    public readonly baseUrl: string,
    private readonly getty: GetFunc = get,
  ) {}

  static KeywordsStringify<KEYWORDS = object>(keywords?: KEYWORDS): string {
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

  async all<KEYWORDS = object>(
    keywords?: KEYWORDS,
    config?: IRequestConfig<IResponse<T[]>, T[]>,
  ): Promise<T[]> {
    return this.getty<T[]>(
      `${this.baseUrl}/all${Crudy.KeywordsStringify(keywords)}`,
      config,
    );
  }

  async one(
    id: string | number,
    config?: IRequestConfig<IResponse<T>, T>,
  ): Promise<T> {
    return this.getty<T>(`${this.baseUrl}/one/${id}`, config);
  }

  async page<KEYWORDS = object>(
    page: number,
    size: number,
    keywords?: KEYWORDS,
    config?: IRequestConfig<IResponse<T[]>, T[]>,
  ): Promise<T[]> {
    return this.getty<T[]>(
      `${this.baseUrl}/page/${page}/${size}${Crudy.KeywordsStringify(keywords)}`,
      config,
    );
  }

  async count<KEYWORDS = object>(
    keywords?: KEYWORDS,
    config?: IRequestConfig<IResponse<number>, number>,
  ): Promise<number> {
    return this.getty<number>(
      `${this.baseUrl}/count${Crudy.KeywordsStringify(keywords)}`,
      config,
    );
  }

  async save(
    data: Partial<T>,
    config?: IRequestConfig<IResponse<T>, T>,
  ): Promise<T> {
    return this.getty<T>(this.baseUrl, {
      method: "PUT",
      body: JSON.stringify(data),
      ...config,
    });
  }

  async delete(
    id: string | number,
    config?: IRequestConfig<IResponse<boolean>, boolean>,
  ): Promise<boolean> {
    return this.getty<boolean>(`${this.baseUrl}/${id}`, {
      method: "DELETE",
      ...config,
    });
  }
}
