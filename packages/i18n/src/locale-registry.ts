/* locale registry — EN static imports; other locales fall back to EN until their JSON is shipped */
import type { MessageTree } from './messages-types';

import en_actions from "../locales/en/actions.json";
import en_admins from "../locales/en/admins.json";
import en_appearance from "../locales/en/appearance.json";
import en_auth from "../locales/en/auth.json";
import en_blogs from "../locales/en/blogs.json";
import en_brands from "../locales/en/brands.json";
import en_categories from "../locales/en/categories.json";
import en_comments from "../locales/en/comments.json";
import en_common from "../locales/en/common.json";
import en_confirmations from "../locales/en/confirmations.json";
import en_dashboard from "../locales/en/dashboard.json";
import en_email from "../locales/en/email.json";
import en_emptyStates from "../locales/en/empty-states.json";
import en_errors from "../locales/en/errors.json";
import en_forms from "../locales/en/forms.json";
import en_language from "../locales/en/language.json";
import en_media from "../locales/en/media.json";
import en_nav from "../locales/en/nav.json";
import en_navigation from "../locales/en/navigation.json";
import en_notifications from "../locales/en/notifications.json";
import en_pages from "../locales/en/pages.json";
import en_pagination from "../locales/en/pagination.json";
import en_profile from "../locales/en/profile.json";
import en_security from "../locales/en/security.json";
import en_seo from "../locales/en/seo.json";
import en_settings from "../locales/en/settings.json";
import en_storage from "../locales/en/storage.json";
import en_tables from "../locales/en/tables.json";
import en_tags from "../locales/en/tags.json";
import en_themes from "../locales/en/themes.json";
import en_users from "../locales/en/users.json";
import en_validation from "../locales/en/validation.json";

export const SUPPORTED_LOCALES = [
  'en',
  'ur',
  'ar',
  'es',
  'zh-CN',
  'hi',
  'pt-BR',
  'fr',
  'de',
  'ja',
  'ko',
] as const;

const enBag: Record<string, MessageTree> = {
  actions: en_actions,
  admins: en_admins,
  appearance: en_appearance,
  auth: en_auth,
  blogs: en_blogs,
  brands: en_brands,
  categories: en_categories,
  comments: en_comments,
  common: en_common,
  confirmations: en_confirmations,
  dashboard: en_dashboard,
  email: en_email,
  emptyStates: en_emptyStates,
  errors: en_errors,
  forms: en_forms,
  language: en_language,
  media: en_media,
  nav: en_nav,
  navigation: en_navigation,
  notifications: en_notifications,
  pages: en_pages,
  pagination: en_pagination,
  profile: en_profile,
  security: en_security,
  seo: en_seo,
  settings: en_settings,
  storage: en_storage,
  tables: en_tables,
  tags: en_tags,
  themes: en_themes,
  users: en_users,
  validation: en_validation,
};

/** All locales resolve to EN until per-locale JSON is deployed. */
export const LOCALE_REGISTRY: Record<string, Record<string, MessageTree>> = {
  'en': enBag,
  'ur': enBag,
  'ar': enBag,
  'es': enBag,
  'zh-CN': enBag,
  'hi': enBag,
  'pt-BR': enBag,
  'fr': enBag,
  'de': enBag,
  'ja': enBag,
  'ko': enBag,
};
