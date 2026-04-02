import { FormEvent } from "react";
import { CarInput } from "@/lib/car-types";
import { getMissingRequiredFields } from "@/lib/car-validation";
import { CarCard } from "@/components/CarCard";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

interface AddCarModalProps {
  open: boolean;
  car: CarInput | null;
  carIndex: number;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onChange: (car: CarInput) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
  canDuplicate: boolean;
}

export function AddCarModal({
  open,
  car,
  carIndex,
  onOpenChange,
  onConfirm,
  onChange,
  onRemove,
  onDuplicate,
  canRemove,
  canDuplicate,
}: AddCarModalProps) {
  const { t } = useI18n();
  if (!car) return null;
  const missingRequiredFields = getMissingRequiredFields(car, t);
  const canConfirm = missingRequiredFields.length === 0;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canConfirm) return;
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-x-0 border-b-0 bg-background/96 p-0 sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[92vh] sm:w-[90vw] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:border dark:border-white/10 dark:bg-slate-950/96">
        <div className="border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/88">
          <DialogTitle className="text-sm sm:text-base">
            {t({ en: "Configure car", sv: "Konfigurera bil" })}
          </DialogTitle>
          <p className="mt-1 text-[11px] text-muted-foreground sm:hidden">
            {t({
              en: "This opens full screen on smaller devices so the form is easier to use.",
              sv: "Detta visas i helskärm på mindre enheter så formuläret blir enklare att använda.",
            })}
          </p>
        </div>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            <div className="space-y-2">
              <CarCard
                car={car}
                index={carIndex}
                canRemove={canRemove}
                canDuplicate={canDuplicate}
                onChange={onChange}
                onRemove={onRemove}
                onDuplicate={onDuplicate}
              />
              {!canConfirm && (
                <p className="text-[11px] text-amber-700 px-1">
                  {t({
                    en: "Fill required fields before saving:",
                    sv: "Fyll i obligatoriska fält innan du sparar:",
                  })}{" "}
                  <span className="font-medium">{missingRequiredFields.join(", ")}</span>
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-border/60 bg-background/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-4 dark:border-white/10 dark:bg-slate-950/88">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto dark:border-white/12 dark:bg-transparent dark:hover:bg-white/5 dark:hover:text-slate-100"
            >
              {t({ en: "Cancel", sv: "Avbryt" })}
            </Button>
            <Button type="submit" disabled={!canConfirm} className="w-full sm:w-auto dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400">
              OK
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
