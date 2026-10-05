/**
 * wordpress-import plugin — runtime entry.
 *
 * The VARKA admin loads this file at request time:
 * - `default` → the plugin's admin page (React Server Component)
 * - `GET`/`POST` → the plugin's API handlers
 */
export { default } from './admin';
export { GET, POST } from './handlers';
