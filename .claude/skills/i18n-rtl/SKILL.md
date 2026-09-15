---
name: i18n-rtl
description: DB-driven languages, translation matrix, RTL/LTR, scripts. Use for locale routing and translation UI.
---

# i18n / RTL — VARKA

- Query enabled languages; never hard-code the list in a renderer
- Language ≠ script. Punjabi = **one** row `pa` + `script` field (`Arab` | `Guru`)
- Default language `en` is prefixless; posts at `/post/{slug}`
- Other languages: `/{urlPrefix}/post/{slug}`
- `dir` from language row (Punjabi RTL only when script is `Arab`)
- Logical CSS
- Translation statuses: Published, Draft, Missing, Scheduled, Needs Update
- hreflang only for published; `x-default` = default language
