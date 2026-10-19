import Crudy, { Config, get, GetFunc } from "./index";
import { IBase, ID } from "./model";

export class M2MHandler<
  M1 extends IBase,
  M2 extends IBase,
  M2M,
  SearchParams = object,
> {
  constructor(
    public readonly baseUrl: string,
    protected readonly m1Crudy: Crudy<M1>,
    protected readonly m2Crudy: Crudy<M2>,
    protected readonly m1IdFieldName: keyof M2M,
    protected readonly m2IdFieldName: keyof M2M,
    protected readonly getFunc: GetFunc = get,
  ) {}

  static GroupBy<M2M, T extends IBase>(
    m2ms: M2M[],
    groupByField: keyof M2M,
    idField: keyof M2M,
    records: T[],
  ): Record<ID, T[]> {
    const groupedRecords: Record<ID, T[]> = {};
    m2ms.forEach((c) => {
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
    config?: Config<boolean>,
  ): Promise<boolean> {
    return this.getFunc<boolean>(
      `${this.baseUrl}?${this.m1IdFieldName as string}=${m1Id}&${this.m2IdFieldName as string}=${m2Id}`,
      {
        method: "DELETE",
        ...config,
      },
    );
  }

  /**
   * Example:
   * ```TypeScript
   *   const m1s: M1[] = [...];
   *   await handler.get<M2>("m1Id", m1s, {}, (m1, m2s) => {
   *     m1._m2s = m2s;
   *   });
   * ```
   * ```TypeScript
   *   const [m2ms, ts, groupedTs] = await handler.get<T>("dId", [1, 2, 3]);
   * ```
   * @param byField Search field, opposite of T
   * @param byDs D or ID, opposite of T when D
   * @param searchParams Extra search params for M2M m2ms
   * @param forEachHandleFunc Loop over the result, will do nothing if {@link byDs} is {@link ID[]}
   *
   * Short for:
   * ```TypeScript
   *   const m1s: M1[] = [...];
   *   const [m2ms, m2s, grouped] = await handler.get<M2>("m1Ids", m1s, {});
   *   Object.entries(grouped).forEach(([m1Id, m2s]) => {
   *     // do as forEachHandleFunc do
   *   });
   * ```
   * @param config extra network config
   * @typeParam T The target type to retrieve
   * @typeParam D The search source
   * @typeParam ByField The search field type
   */
  async get<
    T extends M1 | M2,
    D extends IBase = T extends M1 ? M2 : M1,
    ByField extends typeof this.m1IdFieldName | typeof this.m2IdFieldName =
      T extends M1 ? typeof this.m2IdFieldName : typeof this.m1IdFieldName,
  >(
    byField: ByField,
    byDs: D[] | ID[],
    searchParams?: SearchParams,
    forEachHandleFunc?: (d: D, ts: T[], m2ms: M2M[]) => void,
    config?: Pick<Config, "signal">,
  ): Promise<[M2M[], T[], Record<ID, T[]>]> {
    if (byDs.length === 0) {
      return [[], [], {}];
    }

    const isByIds = typeof byDs[0] === "number";

    const idField: ByField = (byField === this.m1IdFieldName
      ? this.m2IdFieldName
      : this.m1IdFieldName) as unknown as ByField;

    const crudy: Crudy<T> = (byField === this.m1IdFieldName
      ? this.m2Crudy
      : this.m1Crudy) as unknown as Crudy<T>;

    const m2ms = await this.getAll(
      byField,
      isByIds ? (byDs as ID[]) : (byDs as D[]).map((i) => i.id),
      searchParams,
      config,
    );
    if (m2ms.length === 0) {
      return [[], [], {}];
    }

    const tIds = Array.from(new Set(m2ms.map((c) => c[idField]))) as ID[];
    const ts: T[] = await crudy.all({
      in_id: tIds,
    });

    const grouped = M2MHandler.GroupBy<M2M, T>(
      m2ms,
      byField,
      idField,
      ts as T[],
    );

    if (forEachHandleFunc && !isByIds) {
      Object.entries(grouped).forEach(([id, records]) => {
        const found = (byDs as D[]).find((i) => i.id === parseInt(id));
        if (!found) {
          return;
        }
        forEachHandleFunc(
          found,
          records,
          m2ms.filter((c) => c[byField] === found.id),
        );
      });
    }

    return [m2ms, ts, grouped];
  }
}
