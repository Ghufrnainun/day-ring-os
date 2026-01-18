import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grain p-4">
      <div className="w-full max-w-4xl flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center shadow-glow mb-6">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 orbit-ring" />
          </div>
        </div>

        <OnboardingWizard />

        <p className="text-center text-xs text-muted-foreground mt-8">
          You can change these settings later.
        </p>
      </div>
    </div>
  );
}
