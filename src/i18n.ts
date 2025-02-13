import i18next, { t } from "i18next";

const Default = {
  gocrud: {
    retryQuestionMark: "Retry?",
  },
};

export default Default;

/**
 * ot == Optional Translate, but no InterpolationMap allowed
 */
export function ot(key: string, defaultValue?: string, myT: typeof t = t) {
  return i18next.isInitialized ? myT(key) : defaultValue || key;
}
