import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const port = host.split(':')[1] || '';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (port === '3001' || port === '4001' || port === '3011') redirect('/judge');
  if (port === '3002' || port === '4002' || port === '3012') redirect('/team');
  if (port === '3003' || port === '4003' || port === '3013') redirect('/ops/scanner');

  // Fetch role securely server-side using service client
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role || (user.user_metadata?.role as string | undefined);

  switch (role) {
    case 'admin':
      redirect('/admin');
    case 'judge':
      redirect('/judge');
    case 'staff':
    case 'organizer':
      redirect('/ops/scanner');
    case 'participant':
    case 'leader':
      redirect('/team/submission');
    default:
      redirect('/login');
  }

  return null;
}
