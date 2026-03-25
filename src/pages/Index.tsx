import { useState, useMemo } from "react";
import { CarInput, Currency, calculateResults, createDefaultCar } from "@/lib/car-types";
import { CarCard } from "@/components/CarCard";
import { ResultsPanel } from "@/components/ResultsPanel";
import { Plus } from "lucide-react";

let nextId = 3;

const Index = () => {
  const [cars, setCars] = useState<CarInput[]>([
    createDefaultCar("1", 0),
    createDefaultCar("2", 1),
  ]);
  const [currency, setCurrency] = useState<Currency>("SEK");

  const results = useMemo(() => cars.map(calculateResults), [cars]);

  const updateCar = (id: string, updated: CarInput) => {
    setCars((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const removeCar = (id: string) => {
    setCars((prev) => prev.filter((c) => c.id !== id));
  };

  const addCar = () => {
    if (cars.length >= 3) return;
    const id = String(nextId++);
    setCars((prev) => [...prev, createDefaultCar(id, prev.length)]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-surface-raised/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight">Carculator</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">— Real cost of car ownership</span>
          </div>
          <button
            onClick={() => setCurrency((c) => (c === "SEK" ? "EUR" : "SEK"))}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          >
            {currency}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Input section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold tracking-tight">Your cars</h1>
              {cars.length < 3 && (
                <button
                  onClick={addCar}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add car
                </button>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
              {cars.map((car, i) => (
                <CarCard
                  key={car.id}
                  car={car}
                  index={i}
                  canRemove={cars.length > 1}
                  onChange={(updated) => updateCar(car.id, updated)}
                  onRemove={() => removeCar(car.id)}
                />
              ))}
            </div>
          </div>

          {/* Results section */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ResultsPanel results={results} currency={currency} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
