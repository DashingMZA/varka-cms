# VARKA — current memory

**Updated:** 2026-09-17

## Comments (WP-style)

- Filters: All / Pending / Approved / Spam / Trash (+ counts)
- Bulk: approve, unapprove, spam, trash, delete
- Search author/email/body
- Row actions: Approve, Unapprove, Spam, Not spam, Trash, Edit, Reply, Delete
- Staff reply → approved child comment
- API: GET list/search, PUT bulk, PATCH status|body|reply

## Media

- Original preserved; WebP derivatives only
- Sizes + folder settings; caption/keywords
- Insert size picker in editor
- Env: `MEDIA_CDN_URL`, `MEDIA_WEBP_QUALITY*`, S3 vars in `.env.example`

## Docs

- `ai/docs/MEDIA-CDN-WEBP.md`
- `ai/docs/MEDIA-AND-REVISIONS.md`
