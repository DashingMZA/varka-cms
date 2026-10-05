import { PluginUpload } from '@/components/plugin-upload';

export default function AddPluginPage() {
  return (
    <main>
      <div className="v-page-header">
        <h1 className="v-page-title">Add Plugins</h1>
      </div>
      <PluginUpload />
    </main>
  );
}
