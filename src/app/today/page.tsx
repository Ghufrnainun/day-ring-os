import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';

export default async function TodayPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <h1 className="text-4xl font-display font-bold mb-4">Today</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back, {user.user_metadata.full_name || user.email}!
      </p>
      <div className="p-6 border rounded-3xl bg-secondary/20">
        <p>This is the protected dashboard.</p>
        <p className="text-sm text-muted-foreground mt-2">User ID: {user.id}</p>
      </div>

      <form action="/auth/signout" method="post" className="mt-8">
        <Button variant="outline" type="submit">
          Sign Out
        </Button>
      </form>
    </div>
  );
}
