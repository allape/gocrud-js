export type ID = number;

export interface IBase {
  id: ID;
  priority: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export type SortType = "asc" | "desc";

export interface IBaseSearchParams {
  in_id?: ID[];
  deleted?: boolean;

  orderBy_createdAt?: SortType;
  orderBy_updatedAt?: SortType;
  orderBy_deletedAt?: SortType;
  orderBy_priority?: SortType;

  sortByPriorityThenUpdatedAt?: boolean;
}

export const BaseSearchParams: IBaseSearchParams = {
  deleted: false,
};
