import { BottomDock } from '@/components/dashboard/BottomDock';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background bg-grain">
      <BottomDock />
      <main className="flex-1 pb-24 md:pb-0 md:pl-0">
        <div className="container mx-auto max-w-5xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
