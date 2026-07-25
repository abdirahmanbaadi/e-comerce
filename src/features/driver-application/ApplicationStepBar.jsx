import { APPLICATION_STEPS } from './applicationShared';

export default function ApplicationStepBar({ activeStep = 0 }) {
  return (
    <div className="mb-6 flex items-center gap-1">
      {APPLICATION_STEPS.map((step, idx) => {
        const done = idx < activeStep;
        const current = idx === activeStep;
        return (
          <div key={step.key} className="flex flex-1 items-center gap-1">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[0.68rem] ${
                  done
                    ? 'bg-emerald-500 text-white'
                    : current
                      ? 'bg-deepGreen text-white ring-4 ring-deepGreen/15'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                <i className={`fa-solid ${step.icon}`} aria-hidden="true" />
              </span>
              <span
                className={`max-w-full truncate text-center text-[0.62rem] font-bold leading-tight ${
                  current || done ? 'text-deepGreen' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < APPLICATION_STEPS.length - 1 && (
              <div
                className={`mb-4 h-0.5 flex-1 rounded-full ${done ? 'bg-emerald-400' : 'bg-gray-200'}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
