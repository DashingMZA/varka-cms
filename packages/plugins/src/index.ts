export { pluginManifestSchema, parseManifest } from './manifest';
export type { PluginManifest } from './manifest';
export { resolvePluginDir, pluginPath, pluginManifestPath } from './paths';
export {
  discoverInstalledPlugins,
  readInstalledManifest,
} from './registry';
export type { DiscoveredPlugin } from './registry';
export { installPluginFromZip, uninstallPluginFiles } from './installer';
export type { InstallResult } from './installer';
