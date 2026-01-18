import { getPublicProfile } from '@/actions/public-profile';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Flame, CheckCircle2, Repeat } from 'lucide-react';
import { ActivityHeatmap } from '@/components/dashboard/reviews/ActivityHeatmap';

interface PublicProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { username } = await params;

  const profile = await getPublicProfile(username);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center">
            <span className="text-4xl text-muted-foreground">🔒</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Profile is Private
            </h1>
            <p className="text-muted-foreground">
              This user has chosen to keep their profile private.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ChevronLeft size={16} />
            Go to Orbit
          </Link>
        </div>
      </div>
    );
  }

  // Prepare heatmap data
  const heatmapData = profile.activity_heatmap.reduce(
    (acc, item) => {
      acc[item.date] = item.count;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary/5 border-b border-border/50 py-12">
        <div className="container mx-auto max-w-4xl px-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {(profile.display_name || profile.username)[0].toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-sm text-muted-foreground">
                  @{profile.username}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto max-w-4xl px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Current Streak */}
          <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground">
                  {profile.stats.current_streak} days
                </p>
              </div>
            </div>
          </div>

          {/* Tasks Completed */}
          <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <CheckCircle2 className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks Done</p>
                <p className="text-2xl font-bold text-foreground">
                  {profile.stats.total_tasks_completed}
                </p>
              </div>
            </div>
          </div>

          {/* Habits Completed */}
          <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Repeat className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Habits Done</p>
                <p className="text-2xl font-bold text-foreground">
                  {profile.stats.total_habits_completed}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Activity Over Time
          </h2>
          <ActivityHeatmap data={heatmapData} />
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Each square represents daily activity (tasks + habits completed)
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <Link href="/" className="text-primary hover:underline font-medium">
              Orbit
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
