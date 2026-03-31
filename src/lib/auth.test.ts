import { describe, expect, it } from "vitest";

import { authenticateAccount, normalizeEmail, registerAccount } from "@/lib/auth";

describe("auth helpers", () => {
  it("normalizes email casing and whitespace", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
  });

  it("registers accounts with normalized email and prevents duplicates", () => {
    const initialAccounts = [
      {
        id: "1",
        name: "Alex",
        email: "alex@example.com",
        password: "password123",
        createdAt: "2026-03-31T00:00:00.000Z",
      },
    ];

    expect(() =>
      registerAccount(initialAccounts, {
        name: "Alex Again",
        email: " ALEX@example.com ",
        password: "password123",
      }),
    ).toThrowError("account_exists");
  });

  it("authenticates using normalized email input", () => {
    const created = registerAccount([], {
      name: "Jamie Doe",
      email: " JAMIE@example.com ",
      password: "password123",
    });

    expect(
      authenticateAccount(created.accounts, {
        email: "jamie@example.com",
        password: "password123",
      }),
    ).toMatchObject({
      name: "Jamie Doe",
      email: "jamie@example.com",
    });
  });
});
