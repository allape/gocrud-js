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
