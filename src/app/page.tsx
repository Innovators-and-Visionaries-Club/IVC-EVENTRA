import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

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
