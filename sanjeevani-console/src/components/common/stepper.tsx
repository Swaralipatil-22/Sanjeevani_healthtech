import { CheckIcon } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  activeStep: number;
}

export default function Stepper(props: StepperProps) {
  return (
    <div className="mb-9 flex items-start">
      {props.steps.map((step, index) => {
        const isComplete = index < props.activeStep;
        const isCurrent = index === props.activeStep;

        return (
          <div
            key={step}
            className={cn(
              "flex items-center",
              index < props.steps.length - 1 && "flex-1",
            )}
          >
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-colors",
                  isComplete && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary text-primary",
                  !isComplete && !isCurrent && "border-muted text-foreground/40",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isComplete ? <CheckIcon className="size-4" /> : index + 1}
              </div>

              <span
                className={cn(
                  "absolute top-11 text-center text-[10px] font-semibold whitespace-nowrap",
                  isCurrent ? "text-primary" : "text-muted-foreground",
                )}
              >
                {step}
              </span>
            </div>

            {index < props.steps.length - 1 && (
              <Separator
                className={cn(
                  "mx-2 h-[2.5px] flex-1 rounded",
                  isComplete ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
