import { TodayHero } from '@/components/dashboard/TodayHero';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { TaskList } from '@/components/dashboard/TaskList';
import { TopNav } from '@/components/dashboard/TopNav';

export default function TodayPage() {
  return (
    <div className="flex flex-col min-h-full space-y-8 pb-12">
      <TopNav />

      {/* Hero Section: Day Ring & Focus */}
      <TodayHero />

      <div className="animate-fade-up-delay-2">
        <StatsRow />
      </div>

      <section className="flex flex-col space-y-4 animate-fade-up-delay-3">
        <TaskList />
      </section>
    </div>
  );
}
