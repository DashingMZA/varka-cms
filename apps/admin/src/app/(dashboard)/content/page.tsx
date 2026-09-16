import { redirect } from 'next/navigation';

/** Content hub → Posts (WordPress default habit). */
export default function ContentIndexPage() {
  redirect('/content/posts');
}
