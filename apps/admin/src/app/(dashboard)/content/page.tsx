import { redirect } from 'next/navigation';

/** Content root → All Posts (avoid empty duplicate menu page) */
export default function ContentIndex() {
  redirect('/content/posts');
}
