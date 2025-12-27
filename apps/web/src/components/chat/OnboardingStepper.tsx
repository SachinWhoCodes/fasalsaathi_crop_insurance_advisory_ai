import { OnboardingStep } from '@/lib/types';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OnboardingStepperProps {
  currentStep: OnboardingStep;
}

const steps: OnboardingStep[] = ['details', 'ideals', 'forecast', 'risk', 'insurance', 'indexed', 'ready'];

export const OnboardingStepper = ({ currentStep }: OnboardingStepperProps) => {
  const { t } = useTranslation();
  const currentIndex = steps.indexOf(currentStep);

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground mb-4">Onboarding Progress</h3>
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;
        
        return (
          <div key={step} className="flex items-center gap-3">
            <div className={`rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 transition-all ${
              isCompleted 
                ? 'bg-primary text-primary-foreground' 
                : isActive
                ? 'bg-primary/20 border-2 border-primary'
                : 'bg-muted text-muted-foreground'
            }`}>
              {isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-xs font-semibold">{index + 1}</span>
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isActive ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {t(`step_${step}`)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
