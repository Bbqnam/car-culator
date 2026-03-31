# Carculator

A comprehensive car ownership decision tool that helps you compare multiple vehicles based on total cost of ownership (TCO). Calculate and analyze costs including purchase price, fuel, insurance, taxes, maintenance, depreciation, and various financing options (cash, loan, or leasing).

## Features

- **Multi-Car Comparison**: Compare up to 6 cars side-by-side
- **Comprehensive Cost Analysis**: Includes fuel consumption, insurance, taxes, service costs, and depreciation
- **Flexible Financing Options**:
  - Cash purchase
  - Loan financing with customizable down payment, interest rate, and loan terms
  - Leasing with mileage limits and excess costs
- **Currency Support**: Switch between SEK (Swedish Krona), EUR (Euro), and VND (Vietnamese Dong)
- **Language Support**: English and Swedish (`Svenska`) UI toggle
- **Detailed Breakdowns**: View monthly, yearly, and total ownership costs with per-kilometer calculations
- **Winner Selection**: Automatically highlights the most cost-effective option
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **AI Comparison Chat (CarAI)**: Floating chat widget with live comparison context from the cars currently configured
- **Live Brand & Model Catalog**: Brand and model lists can be expanded from free APIs, not only from the built-in local database
- **Free Live Consumption Lookup**: Import fuel/energy consumption from `FuelEconomy.gov` for U.S. matches and from the official EU EV catalog for more non-U.S. electric models
- **Swedish Tax Estimate**: Calculates an estimated annual Swedish vehicle tax and clearly labels it as an estimate, not an exact official number

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with ShadCN UI components
- **State Management**: React Query for data fetching and caching
- **Routing**: React Router
- **Testing**: Vitest for unit tests, with end-to-end coverage planned next
- **Linting**: ESLint
- **Package Manager**: Bun (recommended) or npm

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd car-culator
   ```

2. **Install dependencies**:
   ```bash
   # Using Bun (recommended)
   bun install

   # Or using npm
   npm install
   ```

3. **Start the development server**:
   ```bash
   # Using Bun
   bun run dev

   # Or using npm
   npm run dev
   ```

4. **Open your browser** and navigate to `http://localhost:8080`

### Optional: Run the CarAI API proxy (for AI chat)

The chat widget calls a backend proxy so your AI provider API key stays server-side. The same local proxy also enables the EU electric-vehicle fallback lookup used by the car form.

1. In a separate terminal, export your xAI key:
   ```bash
   export XAI_API_KEY="your_xai_key_here"
   ```
2. Start the proxy:
   ```bash
   npm run dev:api
   ```
3. Keep your frontend running with `npm run dev`.

By default the frontend sends `/api/*` requests to `http://localhost:8787` in development.

### Alternative: Browser key test mode (no backend)

For quick testing only, you can run the frontend alone and paste your xAI key inside the chat widget:

1. Start frontend only:
   ```bash
   npm run dev
   ```
2. Open the **AI Chat** button.
3. Open **Chat settings**.
4. Change mode to **Browser key test mode**.
5. Paste your xAI API key and send a message.

This mode stores the key in browser local storage and is not suitable for production.

### Ollama local mode (free local testing)

If you have Ollama installed, you can use the chat with no cloud API key:

1. Pull and run a model:
   ```bash
   ollama pull llama3.2:1b
   ```
2. Start frontend:
   ```bash
   npm run dev
   ```
3. Open **AI Chat** -> **Chat settings**.
4. Set mode to **Ollama local (no key)**.
5. Keep URL as `http://localhost:11434/v1/chat/completions` and model as `llama3.2:1b`.

## Usage

1. **Add Cars**: Click the "+" button to add up to 6 cars for comparison
2. **Configure Each Car**:
   - Pick a brand and model from the built-in database plus live API catalog matches
   - Enter basic details (brand, model, purchase price)
   - Set model year if you want a better Swedish tax estimate
   - Set ownership duration and annual mileage
   - Specify fuel type and consumption rates
   - Input costs for insurance, taxes, and service
   - Optionally import official fuel data from `FuelEconomy.gov` and let the app recalculate Swedish tax as an estimate
3. **Select Financing**: Choose between cash, loan, or leasing for each car
4. **Review Results**: View detailed cost breakdowns and compare options
5. **Switch Language/Currency**: Use the dropdowns in the header to toggle language and currency (SEK, EUR, VND)
6. **Toggle theme**: Switch between light and dark mode with the header button
7. **Try the login prototype**: Open the optional login prototype from the header without blocking the calculator
8. **Ask AI questions**: Open the floating **AI Chat** button to ask CarAI about the exact cars in your comparison

## Environment Variables

### Backend proxy (`npm run dev:api`)

- `XAI_API_KEY` (required): your xAI API key
- `XAI_MODEL` (optional): model name, default `grok-3-mini`
- `XAI_API_URL` (optional): default `https://api.x.ai/v1/chat/completions`
- `CARAI_PROXY_PORT` (optional): default `8787`
- `CARAI_ALLOWED_ORIGIN` (optional): CORS origin, default `*`
- `GROK_PROXY_PORT` / `GROK_ALLOWED_ORIGIN` (legacy optional): backward-compatible fallback names

### Frontend (Vite)

- `VITE_CARAI_CHAT_API_URL` (optional): override chat endpoint. Defaults to `/api/carai-chat`
- `VITE_GROK_CHAT_API_URL` (legacy optional): backward-compatible fallback for older setups
- `CARAI_PROXY_TARGET` (optional): Vite dev proxy target for `/api` paths. Defaults to `http://localhost:8787`
- `GROK_PROXY_TARGET` (legacy optional): backward-compatible fallback name
- `VITE_XAI_BROWSER_API_URL` (optional): direct browser endpoint for test mode. Defaults to `https://api.x.ai/v1/chat/completions`
- `VITE_XAI_MODEL` (optional): default direct mode model. Defaults to `grok-3-mini`
- `VITE_OLLAMA_CHAT_API_URL` (optional): Ollama OpenAI-compatible endpoint. Defaults to `http://localhost:11434/v1/chat/completions`
- `VITE_OLLAMA_MODEL` (optional): default Ollama model. Defaults to `llama3.2:1b`

## Available Scripts

- `dev` - Start the development server
- `build` - Build the project for production
- `build:dev` - Build in development mode
- `dev:api` - Start the local CarAI backend proxy
- `lint` - Run ESLint for code quality checks
- `preview` - Preview the production build locally
- `test` - Run unit tests with Vitest
- `test:watch` - Run tests in watch mode
- `typecheck` - Run strict TypeScript checks

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # ShadCN UI components
│   ├── CarCard.tsx     # Individual car configuration card
│   ├── ResultsPanel.tsx # Cost comparison results
│   └── ...
├── hooks/              # Custom React hooks
│   ├── use-car-comparison.ts # Main calculator workflow state
│   └── ...
├── lib/                # Utility functions and data
│   ├── car-types.ts    # TypeScript types and calculations
│   ├── car-database.ts # Car data and brand logos
│   └── utils.ts        # Helper functions
├── pages/              # Route components
│   ├── Index.tsx       # Main application page
│   ├── Login.tsx       # Optional auth prototype
│   └── NotFound.tsx    # 404 error page
└── assets/             # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Disclaimer

This tool provides estimates based on the information you provide. Actual costs may vary depending on market conditions, location, and other factors. Always consult with financial and automotive professionals for personalized advice.

Swedish vehicle tax values shown in the app are estimates based on fuel type, model year, fuel consumption, and publicly described Transportstyrelsen CO2 rules. They are helpful for comparison, but they are not guaranteed to match the exact tax for a specific registered vehicle.
