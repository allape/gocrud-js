import { fetcheese, type IRequestConfig } from "./fetcheese";
import Default, { ot } from "./i18n";
import { IBase, IBaseSearchParams, ID } from "./model";

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

export default class Crudy<
  T extends IBase,
  SearchParams extends IBaseSearchParams = IBaseSearchParams,
> {
  constructor(
    public readonly baseUrl: string,
    private readonly getFunc: GetFunc = get,
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

export class M2MConnectorHandler<
  M1 extends IBase,
  M2 extends IBase,
  M2M,
  SearchParams = object,
> {
  constructor(
    public readonly baseUrl: string,
    private readonly m1Crudy: Crudy<M1>,
    private readonly m2Crudy: Crudy<M2>,
    private readonly m1IdFieldName: keyof M2M,
    private readonly m2IdFieldName: keyof M2M,
    private readonly getFunc: GetFunc = get,
  ) {}

  static GroupByConnector<M2M, T extends IBase>(
    connectors: M2M[],
    groupByField: keyof M2M,
    idField: keyof M2M,
    records: T[],
  ): Record<ID, T[]> {
    const groupedRecords: Record<ID, T[]> = {};
    connectors.forEach((c) => {
      const id = c[idField] as ID;
      const record = records.find((r) => r.id === id);
      if (!record) {
        return;
      }

      const groupByValue = c[groupByField] as ID;
      if (!groupedRecords[groupByValue]) {
        groupedRecords[groupByValue] = [];
      }
      groupedRecords[groupByValue].push(record);
    });

    return groupedRecords;
  }

  async getAll(
    byField: typeof this.m1IdFieldName | typeof this.m2IdFieldName,
    ids: M1["id"][] | M2["id"][],
    searchParams?: SearchParams,
    config?: Config<M2M[]>,
  ): Promise<M2M[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.getFunc<M2M[]>(`${this.baseUrl}/all`, {
      method: "POST",
      body: Crudy.BodySearchParamsStringify({
        ...searchParams,
        [`in_${byField as string}`]: ids.join(","),
      }),
      ...config,
    });
  }

  async save(
    records: Partial<M2M>[],
    config?: Config<number>,
  ): Promise<number> {
    return this.getFunc<number>(`${this.baseUrl}/save`, {
      method: "PUT",
      body: JSON.stringify(records),
      ...config,
    });
  }

  async saveAfterDelete(
    deleteByField: keyof M2M,
    deleteById: M1["id"] | M2["id"],
    records: Partial<M2M>[],
    config?: Config<number>,
  ): Promise<number> {
    return this.getFunc<number>(
      `${this.baseUrl}/save/${deleteByField as string}/${deleteById}`,
      {
        method: "POST",
        body: JSON.stringify(records),
        ...config,
      },
    );
  }

  async delete(
    m1Id: M1["id"],
    m2Id: M2["id"],
    config?: Config<number>,
  ): Promise<number> {
    return this.getFunc<number>(
      `${this.baseUrl}?${this.m1IdFieldName as string}=${m1Id}&${this.m2IdFieldName as string}=${m2Id}`,
      {
        method: "DELETE",
        ...config,
      },
    );
  }

  async get<T extends M1 | M2>(
    byField: typeof this.m1IdFieldName | typeof this.m2IdFieldName,
    ids: M1["id"][] | M2["id"][],
    searchParams?: SearchParams,
    config?: Pick<Config, "signal">,
  ): Promise<Record<ID, T[]>> {
    if (ids.length === 0) {
      return {} as Record<ID, T[]>;
    }

    const groupByField = byField;
    const idField =
      groupByField === this.m1IdFieldName
        ? this.m2IdFieldName
        : this.m1IdFieldName;
    const crudy =
      groupByField === this.m1IdFieldName ? this.m2Crudy : this.m1Crudy;

    const connectors = await this.getAll(
      groupByField,
      ids,
      searchParams,
      config,
    );
    if (connectors.length === 0) {
      return {} as Record<ID, T[]>;
    }

    const recordIds = Array.from(
      new Set(connectors.map((c) => c[idField])),
    ) as ID[];
    const records = await crudy.all({
      in_id: recordIds,
    });

    return M2MConnectorHandler.GroupByConnector<M2M, T>(
      connectors,
      groupByField,
      idField,
      records as T[],
    );
  }
}
