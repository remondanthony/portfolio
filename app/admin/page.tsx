import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/admin/session';

export default async function AdminIndex() {
  await requireSession();
  redirect('/admin/dashboard');
}
