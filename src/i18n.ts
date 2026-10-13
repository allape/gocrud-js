import i18next, { t } from "i18next";

const Default = {
  gocrud: {
    retryQuestionMark: "Retry?",
  },
};

export default Default;

export type TFunc = typeof t;
export type TFuncArgs = Parameters<TFunc>;
export type TFuncTailArgs<T extends TFuncArgs = TFuncArgs> = T extends [
  unknown,
  ...infer R,
]
  ? R
  : [];

/**
 * ot == Optional Translate
 */
export function ot(
  key: string,
  defaultValue?: string,
  myT: TFunc = t,
  ...args: TFuncTailArgs
): string {
  return i18next.isInitialized ? myT(key, ...args) : defaultValue || key;
}
