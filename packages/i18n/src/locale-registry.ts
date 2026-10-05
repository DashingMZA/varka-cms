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

import ur_appearance from "../locales/ur/appearance.json";
import ur_auth from "../locales/ur/auth.json";
import ur_blogs from "../locales/ur/blogs.json";
import ur_categories from "../locales/ur/categories.json";
import ur_comments from "../locales/ur/comments.json";
import ur_common from "../locales/ur/common.json";
import ur_dashboard from "../locales/ur/dashboard.json";
import ur_forms from "../locales/ur/forms.json";
import ur_language from "../locales/ur/language.json";
import ur_media from "../locales/ur/media.json";
import ur_nav from "../locales/ur/nav.json";
import ur_navigation from "../locales/ur/navigation.json";
import ur_pages from "../locales/ur/pages.json";
import ur_profile from "../locales/ur/profile.json";
import ur_security from "../locales/ur/security.json";
import ur_seo from "../locales/ur/seo.json";
import ur_settings from "../locales/ur/settings.json";
import ur_tables from "../locales/ur/tables.json";
import ur_tags from "../locales/ur/tags.json";
import ur_themes from "../locales/ur/themes.json";
import ur_users from "../locales/ur/users.json";
import ar_appearance from "../locales/ar/appearance.json";
import ar_auth from "../locales/ar/auth.json";
import ar_blogs from "../locales/ar/blogs.json";
import ar_categories from "../locales/ar/categories.json";
import ar_comments from "../locales/ar/comments.json";
import ar_common from "../locales/ar/common.json";
import ar_dashboard from "../locales/ar/dashboard.json";
import ar_forms from "../locales/ar/forms.json";
import ar_language from "../locales/ar/language.json";
import ar_media from "../locales/ar/media.json";
import ar_nav from "../locales/ar/nav.json";
import ar_pages from "../locales/ar/pages.json";
import ar_profile from "../locales/ar/profile.json";
import ar_security from "../locales/ar/security.json";
import ar_seo from "../locales/ar/seo.json";
import ar_settings from "../locales/ar/settings.json";
import ar_tables from "../locales/ar/tables.json";
import ar_tags from "../locales/ar/tags.json";
import ar_themes from "../locales/ar/themes.json";
import ar_users from "../locales/ar/users.json";
import es_appearance from "../locales/es/appearance.json";
import es_blogs from "../locales/es/blogs.json";
import es_categories from "../locales/es/categories.json";
import es_comments from "../locales/es/comments.json";
import es_common from "../locales/es/common.json";
import es_dashboard from "../locales/es/dashboard.json";
import es_forms from "../locales/es/forms.json";
import es_language from "../locales/es/language.json";
import es_media from "../locales/es/media.json";
import es_nav from "../locales/es/nav.json";
import es_pages from "../locales/es/pages.json";
import es_profile from "../locales/es/profile.json";
import es_security from "../locales/es/security.json";
import es_seo from "../locales/es/seo.json";
import es_settings from "../locales/es/settings.json";
import es_tables from "../locales/es/tables.json";
import es_tags from "../locales/es/tags.json";
import es_themes from "../locales/es/themes.json";
import es_users from "../locales/es/users.json";

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


const urBag: Record<string, MessageTree> = {
  actions: en_actions,
  admins: en_admins,
  appearance: ur_appearance,
  auth: ur_auth,
  blogs: ur_blogs,
  brands: en_brands,
  categories: ur_categories,
  comments: ur_comments,
  common: ur_common,
  confirmations: en_confirmations,
  dashboard: ur_dashboard,
  email: en_email,
  emptyStates: en_emptyStates,
  errors: en_errors,
  forms: ur_forms,
  language: ur_language,
  media: ur_media,
  nav: ur_nav,
  navigation: ur_navigation,
  notifications: en_notifications,
  pages: ur_pages,
  pagination: en_pagination,
  profile: ur_profile,
  security: ur_security,
  seo: ur_seo,
  settings: ur_settings,
  storage: en_storage,
  tables: ur_tables,
  tags: ur_tags,
  themes: ur_themes,
  users: ur_users,
  validation: en_validation,
};


const arBag: Record<string, MessageTree> = {
  actions: en_actions,
  admins: en_admins,
  appearance: ar_appearance,
  auth: ar_auth,
  blogs: ar_blogs,
  brands: en_brands,
  categories: ar_categories,
  comments: ar_comments,
  common: ar_common,
  confirmations: en_confirmations,
  dashboard: ar_dashboard,
  email: en_email,
  emptyStates: en_emptyStates,
  errors: en_errors,
  forms: ar_forms,
  language: ar_language,
  media: ar_media,
  nav: ar_nav,
  navigation: en_navigation,
  notifications: en_notifications,
  pages: ar_pages,
  pagination: en_pagination,
  profile: ar_profile,
  security: ar_security,
  seo: ar_seo,
  settings: ar_settings,
  storage: en_storage,
  tables: ar_tables,
  tags: ar_tags,
  themes: ar_themes,
  users: ar_users,
  validation: en_validation,
};


const esBag: Record<string, MessageTree> = {
  actions: en_actions,
  admins: en_admins,
  appearance: es_appearance,
  auth: en_auth,
  blogs: es_blogs,
  brands: en_brands,
  categories: es_categories,
  comments: es_comments,
  common: es_common,
  confirmations: en_confirmations,
  dashboard: es_dashboard,
  email: en_email,
  emptyStates: en_emptyStates,
  errors: en_errors,
  forms: es_forms,
  language: es_language,
  media: es_media,
  nav: es_nav,
  navigation: en_navigation,
  notifications: en_notifications,
  pages: es_pages,
  pagination: en_pagination,
  profile: es_profile,
  security: es_security,
  seo: es_seo,
  settings: es_settings,
  storage: en_storage,
  tables: es_tables,
  tags: es_tags,
  themes: es_themes,
  users: es_users,
  validation: en_validation,
};

/** All locales resolve to EN until per-locale JSON is deployed. */
export const LOCALE_REGISTRY: Record<string, Record<string, MessageTree>> = {
  'en': enBag,
  'ur': urBag,
  'ar': arBag,
  'es': esBag,
  'zh-CN': enBag,
  'hi': enBag,
  'pt-BR': enBag,
  'fr': enBag,
  'de': enBag,
  'ja': enBag,
  'ko': enBag,
};
