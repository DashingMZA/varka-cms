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
  commentManualApproval: false,
  commentPrevApproved: true,
  moderationMaxLinks: 2,
  moderationKeys: '',
  blacklistKeys: '',
  showAvatars: true,
  avatarRating: 'G',
  avatarDefault: 'mystery',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minHeight: 90,
  fontFamily: 'monospace',
  fontSize: 13,
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
                <span>{L(t, 'days', 'days')}</span>
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

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>{L(t, 'beforeCommentAppears', 'Before a comment appears')}</h2>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.commentManualApproval)}
                  onChange={(e) => set('commentManualApproval', e.target.checked)}
                />
                {L(t, 'commentManualApproval', 'Comment must be manually approved')}
              </label>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.commentPrevApproved)}
                  onChange={(e) => set('commentPrevApproved', e.target.checked)}
                />
                {L(t, 'commentPrevApproved', 'Comment author must have a previously approved comment')}
              </label>
            </td>
          </tr>

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>{L(t, 'commentModeration', 'Comment Moderation')}</h2>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={checkInline}>
                <span>{L(t, 'holdIfLinks', 'Hold a comment in the queue if it contains')}</span>
                <input
                  type="number"
                  min={0}
                  style={{ width: 70 }}
                  value={Number(v.moderationMaxLinks ?? 2)}
                  onChange={(e) => set('moderationMaxLinks', Number(e.target.value))}
                />
                <span>{L(t, 'orMoreLinks', 'or more links. (A common characteristic of comment spam is a large number of hyperlinks.)')}</span>
              </label>
            </td>
          </tr>
          <Field
            label={L(t, 'moderationKeysLabel', 'Moderation keys')}
            hint={L(
              t,
              'moderationKeysDesc',
              'When a comment contains any of these words in its content, author name, URL, email, IP address, or browser user agent, it will be held in the moderation queue. One word or IP address per line. It will match inside words, so "press" will match "WordPress".',
            )}
          >
            <textarea
              style={textareaStyle}
              value={String(v.moderationKeys ?? '')}
              onChange={(e) => set('moderationKeys', e.target.value)}
            />
          </Field>

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>{L(t, 'disallowedKeys', 'Disallowed Comment Keys')}</h2>
            </td>
          </tr>
          <Field
            label={L(t, 'disallowedKeysLabel', 'Disallowed keys')}
            hint={L(
              t,
              'disallowedKeysDesc',
              'When a comment contains any of these words in its content, author name, URL, email, IP address, or browser user agent, it will be moved to Trash. One word or IP address per line. It will match inside words, so "press" will match "WordPress".',
            )}
          >
            <textarea
              style={textareaStyle}
              value={String(v.blacklistKeys ?? '')}
              onChange={(e) => set('blacklistKeys', e.target.value)}
            />
          </Field>

          <tr>
            <td colSpan={2}>
              <h2 style={{ fontSize: 15, margin: '8px 0 0' }}>{L(t, 'avatars', 'Avatars')}</h2>
            </td>
          </tr>
          <tr>
            <td colSpan={2}>
              <label style={check}>
                <input
                  type="checkbox"
                  checked={Boolean(v.showAvatars)}
                  onChange={(e) => set('showAvatars', e.target.checked)}
                />
                {L(t, 'showAvatars', 'Show Avatars')}
              </label>
            </td>
          </tr>
          <Field label={L(t, 'maxRating', 'Maximum Rating')}>
            <select
              style={selectStyle}
              value={String(v.avatarRating ?? 'G')}
              onChange={(e) => set('avatarRating', e.target.value)}
            >
              <option value="G">{L(t, 'ratingG', 'G — Suitable for all audiences')}</option>
              <option value="PG">{L(t, 'ratingPG', 'PG — Possibly offensive, usually for audiences 13 and above')}</option>
              <option value="R">{L(t, 'ratingR', 'R — Intended for adult audiences above 17')}</option>
              <option value="X">{L(t, 'ratingX', 'X — Even more mature than above')}</option>
            </select>
          </Field>
          <Field label={L(t, 'defaultAvatar', 'Default avatar')}>
            <select
              style={selectStyle}
              value={String(v.avatarDefault ?? 'mystery')}
              onChange={(e) => set('avatarDefault', e.target.value)}
            >
              <option value="mystery">{L(t, 'avatarMystery', 'Mystery Person')}</option>
              <option value="blank">{L(t, 'avatarBlank', 'Blank')}</option>
              <option value="gravatar">{L(t, 'avatarGravatar', 'Gravatar Logo')}</option>
              <option value="identicon">{L(t, 'avatarIdenticon', 'Identicon (Generated)')}</option>
              <option value="wavatar">{L(t, 'avatarWavatar', 'Wavatar (Generated)')}</option>
              <option value="monsterid">{L(t, 'avatarMonster', 'MonsterID (Generated)')}</option>
              <option value="retro">{L(t, 'avatarRetro', 'Retro (Generated)')}</option>
            </select>
          </Field>
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
