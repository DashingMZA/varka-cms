'use client';

import { Field, SettingsForm, inputStyle, selectStyle } from '@/components/settings/settings-form';

const DEFAULTS = {
  defaultNotifyLinked: true,
  allowPingbacks: true,
  allowCommentsNewPosts: true,
  requireNameEmail: true,
  requireRegistration: false,
  closeCommentsOld: false,
  closeCommentsDays: 14,
  showCookiesOptIn: true,
  threadComments: true,
  threadDepth: 5,
  pageComments: false,
  commentsPerPage: 50,
  defaultCommentsPage: 'newest',
  commentOrder: 'asc',
  emailOnComment: true,
  emailOnModeration: true,
  moderationKeys: '',
  blacklistKeys: '',
  commentModeration: true,
};

export default function DiscussionSettingsPage() {
  return (
    <SettingsForm
      group="discussion"
      title="Discussion Settings"
      description="Default post comment behavior, threading, moderation, and notifications."
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <h2 style={{ fontSize: 15, margin: 0 }}>Default post settings</h2>
          <label style={check}>
            <input
              type="checkbox"
              checked={Boolean(v.defaultNotifyLinked)}
              onChange={(e) => set('defaultNotifyLinked', e.target.checked)}
            />
            Attempt to notify any blogs linked to from the post
          </label>
          <label style={check}>
            <input
              type="checkbox"
              checked={Boolean(v.allowPingbacks)}
              onChange={(e) => set('allowPingbacks', e.target.checked)}
            />
            Allow link notifications from other blogs (pingbacks and trackbacks) on new posts
          </label>
          <label style={check}>
            <input
              type="checkbox"
              checked={Boolean(v.allowCommentsNewPosts)}
              onChange={(e) => set('allowCommentsNewPosts', e.target.checked)}
            />
            Allow people to submit comments on new posts
          </label>

          <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>Other comment settings</h2>
          <label style={check}>
            <input
              type="checkbox"
              checked={Boolean(v.requireNameEmail)}
              onChange={(e) => set('requireNameEmail', e.target.checked)}
            />
            Comment author must fill out name and email
          </label>
          <label style={check}>
            <input
              type="checkbox"
              checked={Boolean(v.requireRegistration)}
              onChange={(e) => set('requireRegistration', e.target.checked)}
            />
            Users must be registered and logged in to comment
          </label>
          <label style={check}>
            <input
              type="checkbox"
              checked={Boolean(v.closeCommentsOld)}
              onChange={(e) => set('closeCommentsOld', e.target.checked)}
            />
            Automatically close comments on posts older than{' '}
            <input
              type="number"
              min={1}
              style={{ width: 56, margin: '0 6px' }}
              value={Number(v.closeCommentsDays ?? 14)}
              onChange={(e) => set('closeCommentsDays', Number(e.target.value))}
            />{' '}
            days
          </label>
          <label style={check}>
            <input
              type="checkbox"
              checked={Boolean(v.showCookiesOptIn)}
              onChange={(e) => set('showCookiesOptIn', e.target.checked)}
            />
            Show comments cookies opt-in checkbox
          </label>
          <label style={check}>
            <input
              type="checkbox"
              checked={Boolean(v.threadComments)}
              onChange={(e) => set('threadComments', e.target.checked)}
            />
            Enable threaded (nested) comments
          </label>
          <Field label="Number of levels for threaded comments">
            <select
              style={selectStyle}
              value={Number(v.threadDepth ?? 5)}
              onChange={(e) => set('threadDepth', Number(e.target.value))}
            >
              {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>

          <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>Comment Pagination</h2>
          <label style={check}>
            <input
              type="checkbox"
              checked={Boolean(v.pageComments)}
              onChange={(e) => set('pageComments', e.target.checked)}
            />
            Break comments into pages
          </label>
          <Field label="Top level comments per page">
            <input
              type="number"
              style={{ ...inputStyle, maxWidth: 100 }}
              value={Number(v.commentsPerPage ?? 50)}
              onChange={(e) => set('commentsPerPage', Number(e.target.value))}
            />
          </Field>

          <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>Email me whenever</h2>
          <label style={check}>
            <input
              type="checkbox"
              checked={Boolean(v.emailOnComment)}
              onChange={(e) => set('emailOnComment', e.target.checked)}
            />
            Anyone posts a comment
          </label>
          <label style={check}>
            <input
              type="checkbox"
              checked={Boolean(v.emailOnModeration)}
              onChange={(e) => set('emailOnModeration', e.target.checked)}
            />
            A comment is held for moderation
          </label>
        </>
      )}
    </SettingsForm>
  );
}

const check: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'flex-start',
  fontSize: 14,
};
