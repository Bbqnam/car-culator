import { CarInput } from "@/lib/car-types";
import { CarCard } from "@/components/CarCard";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface AddCarModalProps {
  open: boolean;
  car: CarInput | null;
  carIndex: number;
  onOpenChange: (open: boolean) => void;
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
  onChange,
  onRemove,
  onDuplicate,
  canRemove,
  canDuplicate,
}: AddCarModalProps) {
  if (!car) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-4xl max-h-[92vh] overflow-y-auto p-3 sm:p-4">
        <DialogTitle className="text-sm">Configure car</DialogTitle>
        <CarCard
          car={car}
          index={carIndex}
          canRemove={canRemove}
          canDuplicate={canDuplicate}
          onChange={onChange}
          onRemove={onRemove}
          onDuplicate={onDuplicate}
        />
      </DialogContent>
    </Dialog>
  );
}
