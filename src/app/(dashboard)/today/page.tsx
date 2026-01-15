import { DayRing } from '@/components/dashboard/DayRing';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { TopNav } from '@/components/dashboard/TopNav';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TodayPage() {
  return (
    <div className="flex flex-col min-h-full space-y-8">
      <TopNav />

      <section className="flex flex-col items-center justify-center py-6">
        <DayRing progress={35} size={260} />
      </section>

      <StatsRow />

      <section className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Up Next</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            See All
          </Button>
        </div>

        {/* Placeholder for Task List */}
        <div className="bg-card border border-border/50 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-sm">
          <div className="p-3 bg-muted rounded-full">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium">No tasks remaining</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Enjoy your free time!
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-2">
            Add Task
          </Button>
        </div>
      </section>
    </div>
  );
}
