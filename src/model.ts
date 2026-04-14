export interface IBase {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface IBaseSearchParams {
  deleted?: boolean;
}

export const BaseSearchParams: IBaseSearchParams = {
  deleted: false,
};

export type SortType = "asc" | "desc";

export interface ITimeSortSearchParams {
  orderBy_createdAt?: SortType;
  orderBy_updatedAt?: SortType;
  orderBy_deletedAt?: SortType;
}
