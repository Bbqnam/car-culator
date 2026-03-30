import { useState, useMemo, useRef } from "react";
import { CarInput, Currency, calculateResults, createEmptyCar } from "@/lib/car-types";
import { ResultsPanel } from "@/components/ResultsPanel";
import { CommercialTrialSection } from "@/components/CommercialTrialSection";
import { Plus } from "lucide-react";
import { CarChip } from "@/components/CarChip";
import { AddCarModal } from "@/components/AddCarModal";

const Index = () => {
  const nextId = useRef(2);
  const [cars, setCars] = useState<CarInput[]>([createEmptyCar("1")]);
  const [currency, setCurrency] = useState<Currency>("SEK");
  const [activeCarId, setActiveCarId] = useState<string | null>(cars[0]?.id ?? null);

  const configuredCars = cars.filter((c) => c.isConfigured);

  const results = useMemo(
    () => configuredCars.map((c) => calculateResults(c)),
    [configuredCars]
  );

  const winnerId = useMemo(() => {
    if (results.length === 0) return null;
    return [...results].sort((a, b) => a.monthlyCost - b.monthlyCost)[0]?.id ?? null;
  }, [results]);

  const winner = useMemo(
    () => (results.length > 0 ? [...results].sort((a, b) => a.monthlyCost - b.monthlyCost)[0] : null),
    [results]
  );

  const activeCar = cars.find((c) => c.id === activeCarId) ?? null;
  const activeCarIndex = activeCar ? cars.findIndex((c) => c.id === activeCar.id) : 0;

  const updateCar = (id: string, updated: CarInput) => {
    setCars((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const removeCar = (id: string) => {
    setCars((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const fallback = createEmptyCar(String(nextId.current++));
        setActiveCarId(fallback.id);
        return [fallback];
      }
      if (activeCarId === id) setActiveCarId(null);
      return filtered;
    });
  };

  const addCar = () => {
    if (cars.length >= 6) return;
    const newCar = createEmptyCar(String(nextId.current++));
    setCars((prev) => [...prev, newCar]);
    setActiveCarId(newCar.id);
  };

  const duplicateCar = (id: string) => {
    if (cars.length >= 6) return;
    setCars((prev) => {
      const source = prev.find((c) => c.id === id);
      if (!source) return prev;
      const newId = String(nextId.current++);
      const duplicated = { ...source, id: newId };
      setActiveCarId(newId);
      return [...prev, duplicated];
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-surface-raised/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:pl-10 xl:pr-14 2xl:pl-12 2xl:pr-16 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <img src="/logo.png" alt="Carculator logo" className="h-12 w-auto object-contain" />
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight">Carculator</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">— Car ownership decision tool</span>
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

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:pl-10 xl:pr-14 2xl:pl-12 2xl:pr-16 py-6 sm:py-8">
        <div className="space-y-6">
          <div className="flex flex-col lg:grid gap-5 lg:gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(410px,490px)] xl:grid-cols-[minmax(0,1fr)_minmax(440px,530px)] 2xl:grid-cols-[minmax(0,1fr)_minmax(480px,590px)]">
            <section className="min-w-0 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-base font-semibold tracking-tight text-foreground">Your cars</h1>
                {cars.length < 6 && (
                  <button onClick={addCar} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <Plus className="w-3.5 h-3.5" />
                    Add car
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4">
                <div className="overflow-x-auto">
                  <div className="flex gap-3 w-max pr-8">
                    {cars.map((car, i) => {
                      const result = results.find((r) => r.id === car.id);
                      return (
                        <CarChip
                          key={car.id}
                          car={car}
                          index={i}
                          currency={currency}
                          result={result}
                          isWinner={winnerId === car.id}
                          canRemove={cars.length > 1}
                          canDuplicate={cars.length < 6}
                          onOpen={() => setActiveCarId(car.id)}
                          onRemove={() => removeCar(car.id)}
                          onDuplicate={() => duplicateCar(car.id)}
                        />
                      );
                    })}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">Swipe horizontally to see more cars.</p>
              </div>
            </section>

            <section className="lg:sticky lg:top-20 lg:self-start min-w-0 w-full lg:max-w-[590px] lg:justify-self-end">
              {results.length > 0 ? (
                <ResultsPanel results={results} currency={currency} />
              ) : (
                <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg">🚗</span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No cars configured yet</p>
                  <p className="text-xs text-muted-foreground">Tap Add car and configure a model to see comparisons.</p>
                </div>
              )}

              {currency === "EUR" && (
                <p className="text-[10px] text-muted-foreground text-center mt-3">
                  EUR values use an approximate fixed rate (1 SEK ≈ 0.088 EUR). Actual rates may differ.
                </p>
              )}
            </section>
          </div>

          {winner && (
            <section className="min-w-0">
              <CommercialTrialSection winner={winner} currency={currency} />
            </section>
          )}
        </div>
      </main>

      <AddCarModal
        open={!!activeCar}
        car={activeCar}
        carIndex={activeCarIndex}
        onOpenChange={(open) => {
          if (!open) setActiveCarId(null);
        }}
        onChange={(updated) => updateCar(updated.id, updated)}
        onRemove={() => activeCar && removeCar(activeCar.id)}
        onDuplicate={() => activeCar && duplicateCar(activeCar.id)}
        canRemove={cars.length > 1}
        canDuplicate={cars.length < 6}
      />
    </div>
  );
};

export default Index;
