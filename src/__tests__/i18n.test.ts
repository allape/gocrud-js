import i18next from "i18next";
import { expect, test } from "vitest";
import Default, { ot } from "../i18n";

test("OT", () => {
  expect(i18next.isInitialized).toBeFalsy();
  expect(ot("notExists", "shouldBeMe", i18next.t)).toBe("shouldBeMe");
});
test("TFunc", async () => {
  const t = await i18next.init({
    resources: {
      en: {
        translation: {
          ...Default,
          total: "total {{count}}",
        },
      },
    },
    lng: navigator.language,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

  expect(t).toBeInstanceOf(Function);

  expect(ot("gocrud.retryQuestionMark", "defaultValue", t)).toBe("Retry?");

  expect(
    ot("total", `total ${99}`, t, {
      count: 10,
    }),
  ).toBe("total 10");
});
