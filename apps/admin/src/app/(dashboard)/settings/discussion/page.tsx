'use client';

import { Field, SettingsForm, inputStyle, selectStyle } from '@/components/settings/settings-form';
import { useMessages } from '@/lib/i18n';

/** Label with hard fallback so missing i18n never shows raw keys */
function L(
  t: (ns: 'settings' | 'common', key: string) => string,
  key: string,
  fallback: string,
): string {
  const v = t('settings', key);
  if (!v || v === key || v.startsWith('settings.')) return fallback;
  return v;
}

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
  const { t } = useMessages();
  return (
    <SettingsForm
      group="discussion"
      title={L(t, 'discussionTitle', 'Discussion Settings')}
      description={L(t, 'discussionDesc', 'Default post comment behavior, threading, moderation, and notifications.')}
      defaults={DEFAULTS}
    >
      {(v, set) => (
        <>
          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: 0 }}>{L(t, 'defaultPostSettings', 'Default post settings')}</h2>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.defaultNotifyLinked)}
                  onChange={(e) => set('defaultNotifyLinked', e.target.checked)}
                />
                {L(t, 'notifyLinked', 'Attempt to notify any blogs linked to from the post')}
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.allowPingbacks)}
                  onChange={(e) => set('allowPingbacks', e.target.checked)}
                />
                {L(t, 'allowPingbacks', 'Allow link notifications from other blogs (pingbacks and trackbacks) on new posts')}
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.allowCommentsNewPosts)}
                  onChange={(e) => set('allowCommentsNewPosts', e.target.checked)}
                />
                {L(t, 'allowCommentsNew', 'Allow people to submit comments on new posts')}
              </label>
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>{L(t, 'otherCommentSettings', 'Other comment settings')}</h2>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.requireNameEmail)}
                  onChange={(e) => set('requireNameEmail', e.target.checked)}
                />
                {L(t, 'requireNameEmail', 'Comment author must fill out name and email')}
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.requireRegistration)}
                  onChange={(e) => set('requireRegistration', e.target.checked)}
                />
                {L(t, 'requireRegistration', 'Users must be registered and logged in to comment')}
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={checkInline}>
                <input
                  type="checkbox"
                  checked={Boolean(v.closeCommentsOld)}
                  onChange={(e) => set('closeCommentsOld', e.target.checked)}
                />
                <span>{L(t, 'closeCommentsOld', 'Automatically close comments on posts older than')}</span>
                <input
                  type="number"
                  min={1}
                  style={{ width: 70 }}
                  value={Number(v.closeCommentsDays ?? 14)}
                  onChange={(e) => set('closeCommentsDays', Number(e.target.value))}
                />
                <span>days</span>
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.showCookiesOptIn)}
                  onChange={(e) => set('showCookiesOptIn', e.target.checked)}
                />
                {L(t, 'showCookiesOptIn', 'Show comments cookies opt-in checkbox')}
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.threadComments)}
                  onChange={(e) => set('threadComments', e.target.checked)}
                />
                {L(t, 'threadComments', 'Enable threaded (nested) comments')}
              </label>
            </td>
          </tr>
          <Field label={L(t, 'threadDepth', 'Number of levels for threaded comments')}>
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

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>{L(t, 'commentPagination', 'Comment Pagination')}</h2>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.pageComments)}
                  onChange={(e) => set('pageComments', e.target.checked)}
                />
                {L(t, 'breakCommentsPages', 'Break comments into pages')}
              </label>
            </td>
          </tr>
          <Field label={L(t, 'topLevelPerPage', 'Top level comments per page')}>
            <input
              type="number"
              style={{ ...inputStyle, maxWidth: 100 }}
              value={Number(v.commentsPerPage ?? 50)}
              onChange={(e) => set('commentsPerPage', Number(e.target.value))}
            />
          </Field>

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>{L(t, 'emailMeWhenever', 'Email me whenever')}</h2>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.emailOnComment)}
                  onChange={(e) => set('emailOnComment', e.target.checked)}
                />
                {L(t, 'anyonePostsComment', 'Anyone posts a comment')}
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.emailOnModeration)}
                  onChange={(e) => set('emailOnModeration', e.target.checked)}
                />
                {L(t, 'commentHeldModeration', 'A comment is held for moderation')}
              </label>
            </td>
          </tr>
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

// For labels with inline inputs (text + input on one line): vertically center
const checkInline: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
  fontSize: 14,
  flexWrap: 'wrap',
};
