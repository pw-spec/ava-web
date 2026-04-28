# Ava Web

AI-powered men's health optimization companion. Built with Next.js, deployed on Vercel.

## Quick Start

```bash
# Clone the repo
git clone git@github.com:eigenhq/ava-web.git
cd ava-web

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BRAND=ava
```

## Project Structure

```
src/
├── app/           → Pages (Next.js App Router)
├── components/    → React components
│   ├── ui/        → Buttons, inputs, badges
│   ├── chat/      → Chat interface components
│   ├── avatar/    → Avatar display
│   └── charts/    → Radar chart, score bars
├── hooks/         → Custom React hooks
├── lib/           → Utilities, API client, compliance
└── types/         → TypeScript types
```

## Documentation

- [Product Spec](docs/SPEC.md) — Full product specification and user journey
- [Architecture](docs/ARCHITECTURE.md) — Technical architecture and data flow
- [Compliance](docs/COMPLIANCE.md) — Legal safeguards, output filters, cost controls
- [Design System](docs/DESIGN.md) — Colors, typography, components, animations

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

## Deployment

Deployed automatically via Vercel on push to `main`.

- Production: https://withava.co
- Preview: auto-generated for each PR

## Brand Variant

This codebase supports both Ava and Lux brands via the `NEXT_PUBLIC_BRAND` env var. Set to `ava` for withava.co or `lux` for withlux.co.
