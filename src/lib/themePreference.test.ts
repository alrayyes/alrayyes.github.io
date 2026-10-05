import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  readThemePreference,
  THEME_BOOTSTRAP_SCRIPT,
  writeThemePreference,
} from "./themePreference";

const KEY = "alrayyes-apis:theme";

function stubStorage(store: Record<string, string>) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
    },
  });
}

function throwingStorage() {
  const fail = () => {
    throw new Error("SecurityError");
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: fail, setItem: fail },
  });
}

afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage;
});

describe("readThemePreference", () => {
  test.each(["light", "dark"])("returns a stored %s", (value) => {
    stubStorage({ [KEY]: value });

    expect(readThemePreference()).toBe(value as "light" | "dark");
  });

  test("returns null when nothing is stored", () => {
    stubStorage({});

    expect(readThemePreference()).toBeNull();
  });

  test("returns null for a value that isn't a theme", () => {
    stubStorage({ [KEY]: "sepia" });

    expect(readThemePreference()).toBeNull();
  });

  test("returns null when storage throws", () => {
    throwingStorage();

    expect(readThemePreference()).toBeNull();
  });
});

describe("writeThemePreference", () => {
  test("stores the choice under the site's key", () => {
    const store: Record<string, string> = {};
    stubStorage(store);

    writeThemePreference("dark");

    expect(store[KEY]).toBe("dark");
  });

  test("swallows a storage failure", () => {
    throwingStorage();

    expect(() => writeThemePreference("light")).not.toThrow();
  });
});

describe("THEME_BOOTSTRAP_SCRIPT", () => {
  const root = { dataset: {} as Record<string, string> };

  beforeEach(() => {
    root.dataset = {};
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { documentElement: root },
    });
  });

  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
    delete (globalThis as { window?: unknown }).window;
  });

  function run(prefersDark: boolean) {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { matchMedia: () => ({ matches: prefersDark }) },
    });
    new Function(THEME_BOOTSTRAP_SCRIPT)();
  }

  test("applies a stored choice over the OS preference", () => {
    stubStorage({ [KEY]: "light" });

    run(true);

    expect(root.dataset.theme).toBe("light");
  });

  test.each([
    [true, "dark"],
    [false, "light"],
  ])("follows prefers-color-scheme (dark: %p) with no stored choice", (prefersDark, expected) => {
    stubStorage({});

    run(prefersDark);

    expect(root.dataset.theme).toBe(expected);
  });

  test("ignores a stored value that isn't a theme", () => {
    stubStorage({ [KEY]: "sepia" });

    run(true);

    expect(root.dataset.theme).toBe("dark");
  });

  test("leaves the attribute unset rather than throwing when storage fails", () => {
    throwingStorage();

    expect(() => run(true)).not.toThrow();
    expect(root.dataset.theme).toBeUndefined();
  });
});
