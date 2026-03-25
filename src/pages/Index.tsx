import { useState, useMemo } from "react";
import { CarInput, Currency, calculateResults, createEmptyCar } from "@/lib/car-types";
import { CarCard } from "@/components/CarCard";
import { ResultsPanel } from "@/components/ResultsPanel";
import { Plus } from "lucide-react";

let nextId = 2;

const Index = () => {
  const [cars, setCars] = useState<CarInput[]>([createEmptyCar("1")]);
  const [currency, setCurrency] = useState<Currency>("SEK");

  const configuredCars = cars.filter((c) => c.isConfigured);
  const results = useMemo(
    () =>
      configuredCars.map((c) => ({
        ...calculateResults(c),
        brand: c.brand,
        fuelType: c.fuelType,
      })),
    [configuredCars]
  );

  const updateCar = (id: string, updated: CarInput) => {
    setCars((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const removeCar = (id: string) => {
    setCars((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      return filtered.length === 0 ? [createEmptyCar(String(nextId++))] : filtered;
    });
  };

  const addCar = () => {
    if (cars.length >= 3) return;
    setCars((prev) => [...prev, createEmptyCar(String(nextId++))]);
  };

  return (
  <div className="min-h-screen bg-background">
  <header className="border-b border-border/60 bg-surface-raised/80 backdrop-blur-sm sticky top-0 z-10">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
      
      {/* LEFT: Logo + Title */}
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Carculator logo"
          className="h-8 w-auto object-contain"
        />

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight">
            Carculator
          </span>

          <span className="text-xs text-muted-foreground hidden sm:inline">
            — Real cost of car ownership
          </span>
        </div>
      </div>

      {/* RIGHT: Currency Toggle */}
      <button
        onClick={() => setCurrency((c) => (c === "SEK" ? "EUR" : "SEK"))}
        className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
      >
        {currency}
      </button>

    </div>
  </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Mobile: stack vertically. Desktop: side-by-side */}
        <div className="flex flex-col lg:grid lg:grid-cols-[1fr_420px] gap-6 lg:gap-8">
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

            {/* Mobile: single column. Tablet+: 2 cols. Large desktop in sidebar layout: adapt */}
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

          <div className="lg:sticky lg:top-24 lg:self-start">
            {results.length > 0 ? (
              <ResultsPanel results={results} currency={currency} />
            ) : (
              <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Select a car to see cost breakdown
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
