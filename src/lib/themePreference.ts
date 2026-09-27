const KEY = "alrayyes-apis:theme";

export type ThemePreference = "light" | "dark";

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark";
}

/**
 * The visitor's explicit light/dark choice, if they've ever made one. `null`
 * means "no explicit choice" -- the page follows `prefers-color-scheme`.
 *
 * Wrapped in a `try`: private browsing can throw on `localStorage` itself,
 * not just leave it empty.
 */
export function readThemePreference(): ThemePreference | null {
  try {
    const raw = localStorage.getItem(KEY);
    return isThemePreference(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeThemePreference(theme: ThemePreference): void {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Private browsing, a full quota, or no storage at all -- the toggle
    // still works for this visit, it just doesn't carry over to the next.
  }
}

/**
 * The bootstrap script's own source, as a string -- Layout.astro inlines
 * this verbatim as the first thing in <head>, before anything paints, so
 * the right theme applies with no flash of the other mode. Kept here
 * rather than written twice (once here, once inline in the .astro file)
 * so the two can never drift apart.
 *
 * Unlike washy-washy-web's own bootstrap script (which leaves
 * `data-theme` unset when there's no stored preference, since its
 * `light-dark()` CSS already follows the OS on its own), this one always
 * resolves and sets the attribute -- this site's `dark:` classes are
 * driven entirely by Tailwind's `data-theme="dark"` custom variant
 * (global.css), which has nothing to fall back to if the attribute is
 * simply absent. Matches washy-washy-web's own DOCS_THEME_BOOTSTRAP_SCRIPT
 * shape instead, for the same reason its Starlight pages need it.
 */
export const THEME_BOOTSTRAP_SCRIPT = `(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(KEY)});
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();`;
