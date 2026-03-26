# Bug Report Button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent 🐛 button (fixed bottom-left) on every screen that opens a Google Form bug report in a new tab, with the form UI localized to the player's current language.

**Architecture:** A single `<a>` tag placed in `App.jsx` outside the mode-switching block so it renders on all screens. `useTranslation` reads the current language and maps it to a Google Forms `hl` parameter. Styles go in the existing `App.css`. No new files, no backend changes.

**Tech Stack:** React 19, react-i18next, CSS

---

## File Map

| File | Change |
|-|-|
| `client/src/App.jsx` | Add `useTranslation` import, `HL_MAP` + `bugFormUrl`, and `<a>` tag |
| `client/src/App.css` | Add `.report-bug-btn` and `.report-bug-btn:hover` |
| `client/src/i18n/locales/en.json` | Add `controls.reportBugAria` |
| `client/src/i18n/locales/fr.json` | Add `controls.reportBugAria` |
| `client/src/i18n/locales/de.json` | Add `controls.reportBugAria` |
| `client/src/i18n/locales/es.json` | Add `controls.reportBugAria` |
| `client/src/i18n/locales/pt.json` | Add `controls.reportBugAria` |
| `client/src/i18n/locales/ru.json` | Add `controls.reportBugAria` |
| `client/src/i18n/locales/zh.json` | Add `controls.reportBugAria` |
| `client/src/i18n/locales/ja.json` | Add `controls.reportBugAria` |
| `client/src/i18n/locales/ar.json` | Add `controls.reportBugAria` |

---

## Task 1: Add `controls.reportBugAria` to all 9 locale files

**Files:**
- Modify: `client/src/i18n/locales/en.json`
- Modify: `client/src/i18n/locales/fr.json`
- Modify: `client/src/i18n/locales/de.json`
- Modify: `client/src/i18n/locales/es.json`
- Modify: `client/src/i18n/locales/pt.json`
- Modify: `client/src/i18n/locales/ru.json`
- Modify: `client/src/i18n/locales/zh.json`
- Modify: `client/src/i18n/locales/ja.json`
- Modify: `client/src/i18n/locales/ar.json`

- [ ] **Step 1: Add the key to each locale file**

Add `"controls.reportBugAria"` as the last key in each file (before the closing `}`). Each file already ends with `"controls.opponentInstructions": "..."` — add a comma after that line, then the new key.

`en.json` — add:
```json
"controls.reportBugAria": "Report a bug"
```

`fr.json` — add:
```json
"controls.reportBugAria": "Signaler un bug"
```

`de.json` — add:
```json
"controls.reportBugAria": "Fehler melden"
```

`es.json` — add:
```json
"controls.reportBugAria": "Reportar un error"
```

`pt.json` — add:
```json
"controls.reportBugAria": "Reportar um bug"
```

`ru.json` — add:
```json
"controls.reportBugAria": "Сообщить об ошибке"
```

`zh.json` — add:
```json
"controls.reportBugAria": "报告错误"
```

`ja.json` — add:
```json
"controls.reportBugAria": "バグを報告"
```

`ar.json` — add:
```json
"controls.reportBugAria": "الإبلاغ عن خطأ"
```

- [ ] **Step 2: Verify JSON is valid**

Run:
```bash
cd dialogue_pong/client
node -e "import('fs').then(({readFileSync})=>['en','fr','de','es','pt','ru','zh','ja','ar'].forEach(l=>{try{JSON.parse(readFileSync('src/i18n/locales/'+l+'.json','utf8'));console.log(l+': OK')}catch(e){console.error(l+': INVALID',e.message)}}))"
```
Expected: all 9 lines print `OK`.

- [ ] **Step 3: Commit**

```bash
cd dialogue_pong
git add client/src/i18n/locales/
git commit -m "[Phase 7] i18n: add reportBugAria label to all 9 locales"
```

---

## Task 2: Add the bug report button to `App.jsx` and `App.css`

**Files:**
- Modify: `client/src/App.jsx`
- Modify: `client/src/App.css`

- [ ] **Step 1: Add `useTranslation` import to `App.jsx`**

Find the existing imports at the top of `client/src/App.jsx`. The file currently does NOT import from `react-i18next`. Add this import after the last existing import:

```jsx
import { useTranslation } from 'react-i18next';
```

- [ ] **Step 2: Add constants and URL derivation inside the `App` component**

In `client/src/App.jsx`, find this line near the top of the `App` function body:

```js
const [mode, setMode] = useState('menu');
```

Add the following immediately before it:

```jsx
const { i18n, t } = useTranslation();

const BUG_REPORT_BASE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLScGaAcscqVJCTBO63QjhFAcchOeGuDoKxYHnMdEO1BGqNyI4g/viewform';

const HL_MAP = {
  en: 'en', fr: 'fr', de: 'de', es: 'es',
  pt: 'pt-BR', ru: 'ru', zh: 'zh-CN', ja: 'ja', ar: 'ar',
};

const bugFormUrl = `${BUG_REPORT_BASE_URL}?hl=${HL_MAP[i18n.language] || 'en'}`;
```

- [ ] **Step 3: Add the `<a>` tag to the JSX**

In `client/src/App.jsx`, find the closing `</div>` of `<div id="root">`:

```jsx
    </div>
  );
}
```

Add the link just before that closing `</div>`:

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
    </div>
  );
}
```

- [ ] **Step 4: Add `.report-bug-btn` styles to `App.css`**

Append to the end of `client/src/App.css`:

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

- [ ] **Step 5: Run the test suite to confirm nothing is broken**

```bash
cd dialogue_pong/client && npm test
```

Expected: all 89 tests pass. (No new tests needed — this is a link element with no logic to unit test.)

- [ ] **Step 6: Commit**

```bash
cd dialogue_pong
git add client/src/App.jsx client/src/App.css
git commit -m "[Phase 7] menu: add persistent bug report button"
```
