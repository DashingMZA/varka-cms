---
name: content-workflow
description: Posts/pages statuses, autosave, revisions, optimistic concurrency, scheduled publish. Use in phase 2 and 9.
---

# Content workflow

Statuses: DRAFT, PENDING_REVIEW, SCHEDULED, PUBLISHED, PRIVATE, TRASHED

Publish in a **transaction**: row + revision + SEO + audit; enqueue jobs after commit.

Autosave: debounce, don’t explode revision table; show last-saved; version check so two editors don’t clobber.

Schedule: worker/cron, site timezone — not “hope someone hits the URL.”
