import { describe, expect, it, vi } from "vitest";
import { fetchFuelEconomyVehicle } from "./fuel-economy-api";

describe("fetchFuelEconomyVehicle", () => {
  it("treats plug-in hybrids as hybrid instead of electric or petrol", async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <vehicle>
        <id>50260</id>
        <year>2026</year>
        <make>Ferrari</make>
        <model>296 GTB</model>
        <fuelType>Premium and Electricity</fuelType>
        <fuelType1>Premium Gasoline</fuelType1>
        <fuelType2>Electricity</fuelType2>
        <atvType>Plug-in Hybrid</atvType>
        <eng_dscr>SIDI; PHEV</eng_dscr>
        <comb08>18</comb08>
        <combE>72.0</combE>
        <phevComb>20</phevComb>
        <co2TailpipeGpm>398.0</co2TailpipeGpm>
      </vehicle>`;

    vi.stubGlobal("fetch", vi.fn(async () => new Response(xml, { status: 200 })));

    const vehicle = await fetchFuelEconomyVehicle("50260", "Auto (AM-S8), 6 cyl, 2.9 L, Turbo");

    expect(vehicle.fuelType).toBe("hybrid");
    expect(vehicle.fuelConsumption).toBe(11.8);
  });
});
