# LeadLens 🔍
**AI Lead Scoring and Clean-Up Layer for SaaS Acquisition Targets**  
*Built for Caprae Capital & Search Fund (ETA) Deal Sourcing*

---

## 1. Problem Statement & Business Context
Private Equity (PE) search funds and ETA (Entrepreneurship Through Acquisition) buyers use scraping tools like **SaaSquatch** (`saasquatchleads.com`) to identify small B2B SaaS acquisition targets. While scraping generates raw domain lists, **searcher time is the scarcest resource**. 

Searchers are inundated with:
- **Out-of-mandate targets:** Sub-scale apps (<$300k ARR) or enterprise companies beyond search fund reach (>$5M ARR).
- **High key-man risk:** Solo founders with no management transition path.
- **Unreachable contacts:** Generic `info@` and `support@` inboxes that convert at <2%, rather than named Founders/CEOs with direct emails.
- **Data pollution & duplicate records:** Multiple captures of the same company (`getflowpulse.io`, `flowpulse.co`, `app.flowpulse.io`, and `FlowPulse LLC`).
- **Dead links & invalid emails:** Stale scrape artifacts that waste outreach quota and hurt domain reputation.

**LeadLens** provides an automated qualification filter that scores every lead on acquisition fit, cleans up and merges duplicates, verifies deliverability, and exports CRM-ready dealflow.

---

## 2. What I Built & Why

LeadLens is organized around two high-conviction capabilities:

### Feature 1: Acquisition-Fit Lead Scoring (0–100)
- **6 Transparent, Explainable Signals:**
  1. **SaaS Category Defensibility ($S_{\text{cat}}$):** Evaluates high-margin B2B Workflow, Vertical SaaS, RegTech/Cybersecurity vs. low-margin agency or consumer utility.
  2. **Team Size Sweet Spot ($S_{\text{team}}$):** Maximizes the 6–25 employee sweet spot where operations can transition smoothly without corporate bureaucracy or solo-founder key-man risk.
  3. **Company Vintage ($S_{\text{age}}$):** Rewards established 4–9 year track records with proven customer retention and founder liquidity fatigue.
  4. **ARR Bracket Fit ($S_{\text{rev}}$):** Optimized for the $1.0M–$3.0M ARR sweet spot for traditional and self-funded search financing.
  5. **Direct Founder Contact ($S_{\text{contact}}$):** Favors named Founder/CEO contacts with direct work emails over generic inboxes.
  6. **Website Health & Modern Tech ($S_{\text{tech}}$):** Validates HTTP 200 / SSL status and identifies maintainable stacks (React, Next.js, Node, Postgres) vs legacy PHP/WordPress wrappers.
- **Real-Time Slider Calibrator:** Investment committees can dynamically modify weights (e.g., boosting founder outreach weight to 35%) with immediate, zero-latency re-ranking.
- **Dual-Engine AI Explainability:** Generates a one-sentence deal summary using the Anthropic Claude API (`claude-3-haiku-20240307`), backed by an instant deterministic rule-based template engine when offline or unconfigured.

### Feature 2: Data Clean-up, Deduplication & CRM Export
- **Domain Normalization & Fuzzy Matcher:** Canonicalizes protocols, `www.`, subdomains, and paths; strips corporate noise (`Inc`, `LLC`, `Technologies`); and runs Sørensen-Dice bigram matching.
- **Interactive Dedupe Review Step:** Side-by-side comparison cards allow analysts to preview conflicting records, inspect field differences, and execute field-level merges.
- **Batch Verification Pipeline:** Verifies RFC email syntax, queries live domain MX records via DNS, and validates website HTTP responsiveness with 24-hour Redis caching.
- **Dual Export Formats:** Download clean standard CSVs or **HubSpot CRM-ready CSVs** with standardized properties (`Company Domain Name`, `Annual Revenue`, `Acquisition Fit Score`, `Work Email`).

---

## 3. Architecture Overview

```mermaid
graph TD
    User([PE Searcher / Analyst]) -->|Interactive Dashboard| UI[Next.js 14 App Router + Tailwind + shadcn/ui]
    
    subgraph LeadLens Application Layer
        UI -->|Route Handlers| API[Next.js 14 Serverless API Routes]
        
        subgraph Pure Domain Engines
            Scoring[Scoring Engine lib/scoring.ts]
            Dedupe[Deduplication Engine lib/dedupe.ts]
            Validation[Validation Engine lib/validation.ts]
            Enrichment[Ethical Scraper lib/enrichment.ts]
        end
        
        API --> Scoring
        API --> Dedupe
        API --> Validation
        API --> Enrichment
    end

    subgraph Data & External Services
        API -->|Prisma ORM| DB[(PostgreSQL / Supabase)]
        Validation -->|24h TTL Lookups| Cache[(Upstash Redis Cache)]
        Enrichment -->|robots.txt check| TargetSite[Target Public Homepage]
        Scoring -->|AI Rationale| Claude[Anthropic Claude API / Rule Fallback]
    end

    API -->|Download| CRM[HubSpot / CSV Export]
```

---

## 4. Exact Tech Stack

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/) + [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Styling & Design System:** [Tailwind CSS](https://tailwindcss.com/) with custom shadcn-inspired tokens, CSS variables, dark/light theme support, and responsive layouts.
- **Database & ORM:** [PostgreSQL on Supabase](https://supabase.com/) via [Prisma ORM 5.22](https://www.prisma.io/) with migration files and zero-config local seed fallback.
- **Caching:** [Upstash Redis](https://upstash.com/) with 24-hour TTL (`86400s`) for DNS MX and website health lookups, with an automated in-memory fallback.
- **AI Engine:** [Anthropic Claude API](https://www.anthropic.com/) (`@anthropic-ai/sdk`) for contextual deal summaries with deterministic rule fallback.
- **Parsing & Validation:** [Zod](https://zod.dev/) for all API route payloads and [PapaParse](https://www.papaparse.com/) for CSV ingestion and export.
- **Testing:** [Vitest](https://vitest.dev/) for unit testing pure scoring, deduplication, validation, and export functions.

---

## 5. Data Storage Strategy

LeadLens implements a dual-layer data storage strategy:
1. **Production (PostgreSQL on Supabase):** 
   - Managed via Prisma with strict enums (`ContactType`, `ValidationStatus`, `WebsiteStatus`, `MergeStatus`).
   - Self-referential relation `duplicateOfId` links duplicate records to primary targets without data loss.
   - Migration file included at `prisma/migrations/20261010000000_init/migration.sql`.
2. **Local Evaluation & Resilience (`lib/lead-repository.ts`):**
   - In environments where a remote Supabase Postgres instance has not yet been provisioned, LeadLens automatically hydrates 310+ pre-calculated synthetic SaaS leads from `data/seed-leads.csv`.
   - All CRUD, weight calibrations, duplicate merges, and batch validations function seamlessly in memory without runtime exceptions.

---

## 6. Caching Strategy

DNS lookups and HTTP requests during bulk lead processing are computationally expensive and rate-limited. 
- **Upstash Redis REST Client:** Integrated in `lib/cache.ts` with explicit 24-hour TTL (`86400s`).
- **Cache Keys:**
  - `val:mx:{domain}` — Caches domain MX record presence (`true`/`false`).
  - `val:web:{domain}` — Caches HTTP status code, SSL validity, and response latency.
- **Transparent In-Memory Fallback:** If `UPSTASH_REDIS_REST_URL` is omitted in development, lookups fallback to an internal `Map` with identical TTL eviction.

---

## 7. Ethical Data Practices

LeadLens was built with strict adherence to ethical data sourcing principles:
- **Public Root Homepage Only:** Optional enrichment inspects only the target company's own public root homepage (`https://{domain}/`).
- **Strict `robots.txt` Adherence:** Before any enrichment request, `lib/enrichment.ts` fetches and parses `robots.txt`. If `/` is disallowed, the crawl is immediately aborted.
- **Identifiable User-Agent:** All outbound requests broadcast a transparent User-Agent:
  `User-Agent: LeadLensBot/1.0 (+https://leadlens.app/bot; PE Due Diligence)`
- **Rate-Limiting & Concurrency Control:** Requests are paced with a 3.5-second hard abort timeout and concurrency caps to prevent load spikes on target servers.
- **Zero Evasion:** Zero CAPTCHA solving, zero scraping behind login/authentication walls, and zero residential proxy rotation.

---

## 8. Local Setup Instructions

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node `v24.11.1`)
- npm `v9+` or `v10+`

### Installation
```bash
# 1. Clone the repository and enter directory
cd chiranjeeviTask

# 2. Install dependencies
npm install

# 3. (Optional) Configure environment variables
cp .env.example .env.local

# 4. Run tests
npm test

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 9. Hosting & Deployment Steps (Vercel + Supabase)

### Deploying to Supabase (Database)
1. Create a free project on [Supabase](https://supabase.com/).
2. In Project Settings $\to$ Database, copy your **Connection String (Transaction Pooler)**.
3. Set your connection string in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
   ```
4. Push Prisma schema:
   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

### Deploying to Vercel (Frontend & Serverless)
1. Push this repository to GitHub or GitLab.
2. In [Vercel](https://vercel.com/), click **Add New Project** and select the repository.
3. Configure the following Environment Variables in Vercel:
   - `DATABASE_URL` (Supabase connection pooler string)
   - `UPSTASH_REDIS_REST_URL` (From Upstash Console)
   - `UPSTASH_REDIS_REST_TOKEN` (From Upstash Console)
   - `ANTHROPIC_API_KEY` (Your Anthropic Claude API key)
4. Click **Deploy**. Vercel will build the Next.js App Router bundle automatically.

---

## 10. Running Tests

LeadLens features 100% passing Vitest test suites covering scoring algorithms, deduplication fuzzy logic, validation, and CRM export formatters:

```bash
npm test
```

Test coverage includes:
- `tests/scoring.test.ts` (20 tests): Category defensibility, team size sweet spot, age curve, ARR brackets, founder quality, and dynamic slider math.
- `tests/dedupe.test.ts` (8 tests): Domain normalization, legal noise removal, Sørensen-Dice similarity, and lead merging.
- `tests/validation.test.ts` (2 tests): RFC email syntax validation.
- `tests/export.test.ts` (2 tests): Standard CSV and HubSpot CRM property mappings.

---

## 11. Known Limitations & Roadmap

### Current Limitations
- **Synthetic Data Baseline:** Uses 310+ high-fidelity synthetic SaaS leads to simulate SaaSquatch exports rather than live paid scraping APIs.
- **DNS Rate Limits:** High-throughput MX lookups may be subject to ISP/resolver rate limiting without an internal recursive DNS resolver.

### What I'd Build Next With More Time
1. **Interactive Deal Pipeline Kanban:** Add stage tracking (`Prospect` $\to$ `Outreach Sent` $\to$ `NDA Signed` $\to$ `LOI Submitted`) directly in LeadLens.
2. **Direct HubSpot Two-Way Sync:** Replace CSV download with an OAuth integration to push qualified leads directly into HubSpot Deal Pipelines via API.
3. **LinkedIn Founder Profile Matching:** Automatically cross-reference scraped founder names with public LinkedIn handles to calculate founder tenure and exit intent.
4. **Automated Financial Model Starter:** Auto-generate a 3-statement LBO model template for leads scoring above 85.
