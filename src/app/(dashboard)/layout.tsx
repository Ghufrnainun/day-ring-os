import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BottomDock } from '@/components/dashboard/BottomDock';
import { TimeProvider } from '@/components/providers/time-provider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('setup_completed')
    .eq('user_id', user.id)
    .single();

  if (profile && !profile.setup_completed) {
    redirect('/onboarding');
  }

  return (
    <TimeProvider>
      <div className="flex min-h-screen bg-background bg-grain">
        <BottomDock />
        <main className="flex-1 pb-24 md:pb-0 md:pl-0">
          <div className="container mx-auto max-w-5xl p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </TimeProvider>
  );
}
