import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CarInput, Currency, calculateResults, createEmptyCar } from "@/lib/car-types";
import { isCarReadyToSave } from "@/lib/car-validation";
import { ResultsPanel } from "@/components/ResultsPanel";
import { Plus } from "lucide-react";
import { CarChip } from "@/components/CarChip";
import { AddCarModal } from "@/components/AddCarModal";
import { CarAIChatWidget } from "@/components/CarAIChatWidget";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/lib/auth";
import { buildComparisonContext } from "@/lib/ai-chat-context";
import { useI18n } from "@/lib/i18n";

const Index = () => {
  const { language, setLanguage, t } = useI18n();
  const { user } = useAuth();
  const nextId = useRef(2);
  const [cars, setCars] = useState<CarInput[]>([createEmptyCar("1")]);
  const [currency, setCurrency] = useState<Currency>("SEK");
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  const [pendingNewCarId, setPendingNewCarId] = useState<string | null>(null);

  const configuredCars = cars.filter((c) => c.isConfigured);

  const results = useMemo(
    () => configuredCars.map((c) => calculateResults(c)),
    [configuredCars]
  );
  const comparisonContext = useMemo(
    () => buildComparisonContext(configuredCars, results, currency, language),
    [configuredCars, results, currency, language]
  );

  const winnerId = useMemo(() => {
    if (results.length === 0) return null;
    return [...results].sort((a, b) => a.monthlyCost - b.monthlyCost)[0]?.id ?? null;
  }, [results]);

  const activeCar = cars.find((c) => c.id === activeCarId) ?? null;
  const activeCarIndex = activeCar ? cars.findIndex((c) => c.id === activeCar.id) : 0;

  const hasMeaningfulInput = (car: CarInput) =>
    car.brand.trim().length > 0 ||
    car.model.trim().length > 0 ||
    car.name.trim().length > 0 ||
    car.purchasePrice > 0 ||
    car.fuelConsumption > 0 ||
    car.taxCost > 0 ||
    car.serviceCost > 0;

  const updateCar = (id: string, updated: CarInput) => {
    setCars((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const removeCar = (id: string) => {
    setPendingNewCarId((prev) => (prev === id ? null : prev));
    setCars((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const fallback = createEmptyCar(String(nextId.current++));
        setActiveCarId(null);
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
    setPendingNewCarId(newCar.id);
    setActiveCarId(newCar.id);
  };

  const duplicateCar = (id: string) => {
    if (cars.length >= 6) return;
    setCars((prev) => {
      const source = prev.find((c) => c.id === id);
      if (!source) return prev;
      const newId = String(nextId.current++);
      const duplicated = { ...source, id: newId };
      setPendingNewCarId(null);
      setActiveCarId(newId);
      return [...prev, duplicated];
    });
  };

  const closeActiveCarModal = () => {
    if (!activeCar) {
      setActiveCarId(null);
      return;
    }

    const closingCarId = activeCar.id;
    const isPendingCarValid = isCarReadyToSave(activeCar, t);
    const shouldDiscardPendingCar =
      pendingNewCarId === closingCarId &&
      !activeCar.isConfigured &&
      (!hasMeaningfulInput(activeCar) || !isPendingCarValid);

    if (shouldDiscardPendingCar) {
      setCars((prev) => {
        const filtered = prev.filter((c) => c.id !== closingCarId);
        if (filtered.length > 0) return filtered;
        return [createEmptyCar(String(nextId.current++))];
      });
    }

    setPendingNewCarId((prev) => (prev === closingCarId ? null : prev));
    setActiveCarId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-surface-raised/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:pl-10 xl:pr-14 2xl:pl-12 2xl:pr-16 py-2 sm:h-14 sm:py-0 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <img src="/logo.png" alt="Carculator logo" className="h-12 w-auto object-contain" />
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-lg font-bold tracking-tight shrink-0">Carculator</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {t({
                  en: "— Car ownership decision tool",
                  sv: "— Beslutsstöd för bilägande",
                })}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
            <Select value={language} onValueChange={(value) => setLanguage(value as typeof language)}>
              <SelectTrigger
                className="h-9 w-[110px] rounded-full border-border/70 bg-background/80 text-xs font-medium backdrop-blur-sm"
                aria-label={t({ en: "Language", sv: "Språk" })}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sv">Svenska</SelectItem>
              </SelectContent>
            </Select>
            <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
              <SelectTrigger
                className="h-9 w-[118px] rounded-full border-border/70 bg-background/80 text-xs font-medium backdrop-blur-sm"
                aria-label={t({ en: "Currency", sv: "Valuta" })}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="SEK">kr SEK</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="VND">VND</SelectItem>
              </SelectContent>
            </Select>
            <ThemeToggle />
            {user ? (
              <UserMenu />
            ) : (
              <Button
                asChild
                variant="outline"
                className="h-9 rounded-full border-border/70 bg-background/80 px-3 text-xs font-medium backdrop-blur-sm"
              >
                <Link to="/login">
                  {t({ en: "Try login prototype", sv: "Testa login-prototyp" })}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:pl-10 xl:pr-14 2xl:pl-12 2xl:pr-16 py-6 pb-24 sm:py-8 sm:pb-8">
        <div className="space-y-6">
          <div className="flex flex-col lg:grid gap-5 lg:gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(460px,560px)] xl:grid-cols-[minmax(0,1.16fr)_minmax(500px,620px)] 2xl:grid-cols-[minmax(0,1.22fr)_minmax(520px,660px)]">
            <section className="min-w-0 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h1 className="text-base font-semibold tracking-tight text-foreground">
                  {t({ en: "Your cars", sv: "Dina bilar" })}
                </h1>
                {cars.length < 6 && (
                  <button
                    onClick={addCar}
                    className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t({ en: "Add car", sv: "Lägg till bil" })}
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4 min-h-[240px] lg:min-h-[290px] flex flex-col">
                <div className="md:hidden flex flex-col gap-3">
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
                  {cars.length < 6 && (
                    <button
                      type="button"
                      onClick={addCar}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-secondary/20 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/35"
                    >
                      <Plus className="w-4 h-4" />
                      {t({ en: "Add another car", sv: "Lägg till en bil" })}
                    </button>
                  )}
                </div>

                <div className="hidden md:block overflow-x-auto pb-1 flex-1">
                  <div
                    className="grid grid-flow-col gap-3 pr-3"
                    style={{ gridAutoColumns: "minmax(340px, calc((100% - 1.5rem) / 3))" }}
                  >
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
                <p className="text-[11px] text-muted-foreground mt-2 md:hidden">
                  {t({
                    en: "Cars stack vertically on smaller screens for easier scanning and editing.",
                    sv: "Bilar visas vertikalt på mindre skärmar för enklare överblick och redigering.",
                  })}
                </p>
                <p className="hidden md:block text-[11px] text-muted-foreground mt-2">
                  {t({
                    en: "Swipe horizontally to see more cars.",
                    sv: "Svep horisontellt för att se fler bilar.",
                  })}
                </p>
              </div>
            </section>

            <section className="lg:sticky lg:top-20 lg:self-start min-w-0 w-full lg:pt-[2.25rem]">
              {results.length > 0 ? (
                <div className="min-h-[240px] lg:min-h-[290px]">
                  <ResultsPanel cars={configuredCars} results={results} currency={currency} />
                </div>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-card p-8 text-center min-h-[240px] lg:min-h-[290px] flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                    <span className="text-lg">🚗</span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {t({ en: "No cars configured yet", sv: "Inga bilar är konfigurerade ännu" })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t({
                      en: "Tap Add car and configure a model to see comparisons.",
                      sv: "Tryck på Lägg till bil och konfigurera en modell för att se jämförelser.",
                    })}
                  </p>
                </div>
              )}

              {(currency === "EUR" || currency === "USD" || currency === "VND") && (
                <p className="text-[10px] text-muted-foreground text-center mt-3">
                  {currency === "EUR"
                    ? t({
                      en: "EUR values use an approximate fixed rate (1 SEK ≈ 0.088 EUR). Actual rates may differ.",
                      sv: "EUR-värden använder en ungefärlig fast växelkurs (1 SEK ≈ 0,088 EUR). Faktisk kurs kan skilja sig.",
                    })
                    : currency === "USD"
                      ? t({
                        en: "USD values use an approximate fixed rate (1 SEK ≈ 0.094 USD). Actual rates may differ.",
                        sv: "USD-värden använder en ungefärlig fast växelkurs (1 SEK ≈ 0,094 USD). Faktisk kurs kan skilja sig.",
                      })
                    : t({
                      en: "VND values use an approximate fixed rate (1 SEK ≈ 2,550 VND). Actual rates may differ.",
                      sv: "VND-värden använder en ungefärlig fast växelkurs (1 SEK ≈ 2 550 VND). Faktisk kurs kan skilja sig.",
                    })}
                </p>
              )}
            </section>
          </div>

        </div>
      </main>

      <AddCarModal
        open={!!activeCar}
        car={activeCar}
        carIndex={activeCarIndex}
        onOpenChange={(open) => {
          if (!open) closeActiveCarModal();
        }}
        onConfirm={closeActiveCarModal}
        onChange={(updated) => updateCar(updated.id, updated)}
        onRemove={() => activeCar && removeCar(activeCar.id)}
        onDuplicate={() => activeCar && duplicateCar(activeCar.id)}
        canRemove={cars.length > 1}
        canDuplicate={cars.length < 6}
      />

      <CarAIChatWidget comparisonContext={comparisonContext} />
    </div>
  );
};

export default Index;
