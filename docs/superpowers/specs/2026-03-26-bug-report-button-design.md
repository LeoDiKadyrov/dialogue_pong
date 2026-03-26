# Bug Report Button — Design Spec

**Date:** 2026-03-26
**Status:** Approved

---

## Summary

Add a persistent 🐛 button (fixed bottom-left) visible on every screen. Clicking it opens the Google Form bug report in a new tab. The form URL is appended with `?hl=XX` to localize the Google UI chrome (Submit button, Required indicators) based on the player's currently selected language.

---

## Architecture

Single `<a>` tag added directly in `App.jsx`, outside the mode-switching block. `App.jsx` already controls all screen transitions, so placing the button here guarantees it's always rendered. No new component file needed.

Uses `useTranslation` (already a project dependency) to read `i18n.language` and map it to a Google Forms `hl` code.

---

## Files

| File | Change |
|-|-|
| `client/src/App.jsx` | Add `useTranslation` import, `HL_MAP` constant, `bugFormUrl` derivation, and `<a>` tag |
| `client/src/App.css` | Add `.report-bug-btn` and `.report-bug-btn:hover` styles |
| All 9 locale JSON files | Add `"controls.reportBugAria"` key |

---

## Implementation Details

### `App.jsx`

Add to imports:
```jsx
import { useTranslation } from 'react-i18next';
```

Add inside the `App` component function (before return):
```jsx
const { i18n, t } = useTranslation();

const BUG_REPORT_BASE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScGaAcscqVJCTBO63QjhFAcchOeGuDoKxYHnMdEO1BGqNyI4g/viewform';

const HL_MAP = {
  en: 'en', fr: 'fr', de: 'de', es: 'es',
  pt: 'pt-BR', ru: 'ru', zh: 'zh-CN', ja: 'ja', ar: 'ar',
};

const bugFormUrl = `${BUG_REPORT_BASE_URL}?hl=${HL_MAP[i18n.language] || 'en'}`;
```

Add inside the returned `<div id="root">`, after the mode-switching blocks:
```jsx
<a
  href={bugFormUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="report-bug-btn"
  aria-label={t('controls.reportBugAria')}
>
  🐛
</a>
```

### `App.css`

Add at end of file:
```css
/* Bug report button — fixed bottom-left, mirrors "?" button at bottom-right */
.report-bug-btn {
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  border: 2px solid rgba(255, 0, 110, 0.5);
  background: rgba(10, 14, 39, 0.8);
  color: #ff006e;
  font-size: 1.25rem;
  font-family: "Courier New", monospace;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.report-bug-btn:hover {
  border-color: #ff006e;
  box-shadow: 0 0 16px #ff006e;
  background: rgba(255, 0, 110, 0.1);
}
```

Uses magenta (#ff006e) to visually differentiate from the cyan "?" button.

### Locale files — `controls.reportBugAria`

| File | Value |
|-|-|
| en.json | "Report a bug" |
| fr.json | "Signaler un bug" |
| de.json | "Fehler melden" |
| es.json | "Reportar un error" |
| pt.json | "Reportar um bug" |
| ru.json | "Сообщить об ошибке" |
| zh.json | "报告错误" |
| ja.json | "バグを報告" |
| ar.json | "الإبلاغ عن خطأ" |

### Language → `hl` mapping

| i18next key | Google Forms hl |
|-|-|
| en | en |
| fr | fr |
| de | de |
| es | es |
| pt | pt-BR |
| ru | ru |
| zh | zh-CN |
| ja | ja |
| ar | ar |

---

## Out of Scope

- Email sending (deferred to future Option A/B)
- In-app form modal (deferred)
- Per-language form content (Google Forms limitation — questions remain in English)
