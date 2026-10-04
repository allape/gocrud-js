import i18next, { t } from "i18next";

const Default = {
  gocrud: {
    retryQuestionMark: "Retry?",
  },
};

export default Default;

export type MutatedTFunction = (key: string, ...args: unknown[]) => string;

/**
 * ot == Optional Translate
 */
export function ot(
  key: string,
  defaultValue?: string,
  myT: typeof t = t,
  ...args: unknown[]
): string {
  return i18next.isInitialized
    ? (myT as unknown as MutatedTFunction)(key, ...args)
    : defaultValue || key;
}
