import { useMemo, useRef, useState } from "react";

import { buildComparisonContext } from "@/lib/ai-chat-context";
import { type CarInput, type Currency, calculateResults, createEmptyCar } from "@/lib/car-types";
import { type Language } from "@/lib/i18n";
import { isCarReadyToSave } from "@/lib/car-validation";

interface UseCarComparisonArgs {
  language: Language;
  t: (text: { en: string; sv: string }) => string;
}

const MAX_CARS = 6;

function hasMeaningfulInput(car: CarInput) {
  return (
    car.brand.trim().length > 0 ||
    car.model.trim().length > 0 ||
    car.name.trim().length > 0 ||
    car.purchasePrice > 0 ||
    car.fuelConsumption > 0 ||
    car.taxCost > 0 ||
    car.serviceCost > 0
  );
}

export function useCarComparison({ language, t }: UseCarComparisonArgs) {
  const nextId = useRef(2);
  const [cars, setCars] = useState<CarInput[]>([createEmptyCar("1")]);
  const [currency, setCurrency] = useState<Currency>("SEK");
  const [activeCarId, setActiveCarId] = useState<string | null>(null);
  const [pendingNewCarId, setPendingNewCarId] = useState<string | null>(null);

  const configuredCars = useMemo(() => cars.filter((car) => car.isConfigured), [cars]);

  const results = useMemo(
    () => configuredCars.map((car) => calculateResults(car)),
    [configuredCars],
  );

  const comparisonContext = useMemo(
    () => buildComparisonContext(configuredCars, results, currency, language),
    [configuredCars, results, currency, language],
  );

  const winnerId = useMemo(() => {
    if (results.length === 0) return null;
    return [...results].sort((a, b) => a.monthlyCost - b.monthlyCost)[0]?.id ?? null;
  }, [results]);

  const activeCar = useMemo(
    () => cars.find((car) => car.id === activeCarId) ?? null,
    [cars, activeCarId],
  );

  const activeCarIndex = activeCar ? cars.findIndex((car) => car.id === activeCar.id) : 0;
  const canAddCars = cars.length < MAX_CARS;
  const canRemoveCars = cars.length > 1;

  const updateCar = (id: string, updated: CarInput) => {
    setCars((previousCars) => previousCars.map((car) => (car.id === id ? updated : car)));
  };

  const removeCar = (id: string) => {
    setPendingNewCarId((previousId) => (previousId === id ? null : previousId));
    setCars((previousCars) => {
      const filteredCars = previousCars.filter((car) => car.id !== id);

      if (filteredCars.length === 0) {
        const fallbackCar = createEmptyCar(String(nextId.current++));
        setActiveCarId(null);
        return [fallbackCar];
      }

      if (activeCarId === id) {
        setActiveCarId(null);
      }

      return filteredCars;
    });
  };

  const openCar = (id: string) => {
    setActiveCarId(id);
  };

  const addCar = () => {
    if (!canAddCars) return;

    const newCar = createEmptyCar(String(nextId.current++));
    setCars((previousCars) => [...previousCars, newCar]);
    setPendingNewCarId(newCar.id);
    setActiveCarId(newCar.id);
  };

  const duplicateCar = (id: string) => {
    if (!canAddCars) return;

    setCars((previousCars) => {
      const sourceCar = previousCars.find((car) => car.id === id);
      if (!sourceCar) return previousCars;

      const newId = String(nextId.current++);
      const duplicatedCar = { ...sourceCar, id: newId };

      setPendingNewCarId(null);
      setActiveCarId(newId);

      return [...previousCars, duplicatedCar];
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
      setCars((previousCars) => {
        const filteredCars = previousCars.filter((car) => car.id !== closingCarId);
        if (filteredCars.length > 0) return filteredCars;
        return [createEmptyCar(String(nextId.current++))];
      });
    }

    setPendingNewCarId((previousId) => (previousId === closingCarId ? null : previousId));
    setActiveCarId(null);
  };

  return {
    cars,
    currency,
    setCurrency,
    configuredCars,
    results,
    comparisonContext,
    winnerId,
    activeCar,
    activeCarIndex,
    canAddCars,
    canRemoveCars,
    addCar,
    openCar,
    updateCar,
    removeCar,
    duplicateCar,
    closeActiveCarModal,
  };
}
