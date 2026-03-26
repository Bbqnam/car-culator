import { useState, useMemo, useRef } from "react";
import { CarInput, Currency, calculateResults, createEmptyCar } from "@/lib/car-types";
import { CarCard } from "@/components/CarCard";
import { ResultsPanel } from "@/components/ResultsPanel";
import { Plus } from "lucide-react";

const Index = () => {
  const nextId = useRef(2);
  const [cars, setCars] = useState<CarInput[]>([createEmptyCar("1")]);
  const [currency, setCurrency] = useState<Currency>("SEK");

  const configuredCars = cars.filter((c) => c.isConfigured);

  const results = useMemo(
    () => configuredCars.map((c) => calculateResults(c)),
    [configuredCars]
  );

  const updateCar = (id: string, updated: CarInput) => {
    setCars((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const removeCar = (id: string) => {
    setCars((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      return filtered.length === 0
        ? [createEmptyCar(String(nextId.current++))]
        : filtered;
    });
  };

  const addCar = () => {
    if (cars.length >= 6) return;
    setCars((prev) => [...prev, createEmptyCar(String(nextId.current++))]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/60 bg-surface-raised/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <img
              src="/logo.png"
              alt="Carculator logo"
              className="h-12 w-auto object-contain"
            />
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight">Carculator</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                — Car ownership decision tool
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
            >
              <option value="SEK">kr SEK</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">

          {/* Left — car setup */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                Your cars
              </h1>
              {cars.length < 6 && (
                <button
                  onClick={addCar}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add car
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
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

          {/* Right — sticky results */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            {results.length > 0 ? (
              <ResultsPanel results={results} currency={currency} />
            ) : (
              <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg">🚗</span>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  No cars configured yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Select a brand and model on the left to see cost comparison
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
