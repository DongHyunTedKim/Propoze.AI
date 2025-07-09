# Project Code Guideline

## 1. Project Overview

This project is an AI-powered SaaS web application for IT marketers, built to automate client analysis and proposal drafting within 30 minutes. The technical stack is centered on Next.js 15.1.0 (App Router) with React 19, TypeScript, Tailwind CSS, Zustand, and shadcn-ui for the frontend; Supabase (PostgreSQL, Auth, Edge Functions), OpenAI GPT-4 API, and Redis@Upstash for the backend. The architecture is modular, domain-oriented, and serverless-first, leveraging Vercel, Cloudflare CDN, and managed services for scalability, security, and operational efficiency. The system enforces strict API security (OAuth2, RBAC, AES-256), modular code organization, and robust CI/CD (GitHub Actions, Vercel).

## 2. Core Principles

1. **Domain-Driven Modularity:** All code MUST be organized by business domain and follow single responsibility per module.
2. **Type Safety:** All code MUST be fully typed using TypeScript or schema validation, with no implicit any or unchecked types.
3. **Explicit Error Handling:** All asynchronous logic MUST handle errors explicitly and propagate or log meaningful messages.
4. **Security by Default:** Sensitive data MUST be encrypted and access controlled at all layers, with no hardcoded secrets.
5. **Performance First:** All data access and API calls MUST be optimized for latency and concurrency, leveraging caching and batching where possible.

## 3. Language-Specific Guidelines

### 3.1. TypeScript & React (Frontend)

#### File Organization & Directory Structure

- MUST follow domain-first organization under `/src/domains/[domain]`.
- Shared components, hooks, and utilities MUST reside in `/src/components`, `/src/hooks`, `/src/utils`.
- Pages and routes MUST be defined in `/src/app` using Next.js App Router conventions.

```typescript
// MUST: Example directory structure
/src
  /domains
    /proposal
      ProposalEditor.tsx
      useProposal.ts
      proposalService.ts
  /components
    Button.tsx
    Modal.tsx
  /hooks
    useAuth.ts
  /utils
    formatDate.ts
```

#### Import/Dependency Management

- MUST use absolute imports via `tsconfig` paths (e.g., `import { Button } from 'components/Button'`).
- MUST group external before internal imports.
- MUST NOT use deep relative imports (e.g., `../../../utils`).

```typescript
// MUST: Absolute import
import { Button } from 'components/Button';
// Correct grouping
import { useQuery } from '@tanstack/react-query';
import { fetchProposal } from 'domains/proposal/proposalService';
```

```typescript
// MUST NOT: Deep relative import
import { formatDate } from '../../../../utils/formatDate';
// Use absolute path instead
```

#### Error Handling Patterns

- MUST wrap all async calls in try/catch and handle errors gracefully.
- MUST provide user feedback for recoverable errors via UI.
- MUST log errors to Sentry using the provided SDK.

```typescript
// MUST: Error handling with Sentry
import * as Sentry from '@sentry/nextjs';

async function fetchData() {
  try {
    const data = await api.getData();
    return data;
  } catch (error) {
    Sentry.captureException(error);
    throw new Error('Failed to fetch data');
  }
}
```

### 3.2. Supabase Edge Functions (Backend)

#### File Organization & Directory Structure

- MUST separate functions by domain (`/functions/auth`, `/functions/ai`, etc.).
- Shared logic MUST be placed in `/functions/utils` or extracted packages.
- Each function MUST have its own entry point and handler.

```typescript
// MUST: Edge Function structure
/functions
  /ai
    index.ts
    aiService.ts
  /auth
    index.ts
    authService.ts
  /utils
    errorHandler.ts
```

#### Import/Dependency Management

- MUST use ES module syntax.
- MUST NOT import unused dependencies.
- MUST keep function cold start minimal by importing only necessary modules.

```typescript
// MUST: Minimal import
import { Hono } from 'hono';
import { validateUser } from '../utils/authService';
```

#### Error Handling Patterns

- MUST standardize API error responses using a consistent JSON format.
- MUST log server errors to Sentry.
- MUST NOT leak stack traces or internal errors to clients.

```typescript
// MUST: API error response
return c.json({ error: 'Unauthorized' }, 401);
```

```typescript
// MUST NOT: Leak stack trace
return c.json({ error: error.stack }, 500);
// Instead, return a generic error
```

### 3.3. SQL (Supabase/PostgreSQL)

#### File Organization

- MUST keep all schema and migration scripts in `/database/migrations`.
- MUST use Supabase Migrations CLI for schema changes.
- MUST version control all migration files.

```sql
-- MUST: Migration file naming
20240601_create_proposals_table.sql
```

#### Error Handling

- MUST use database constraints (NOT NULL, UNIQUE, FK) for data integrity.
- MUST check affected rows for all update/delete operations.

## 4. Code Style Rules

### MUST Follow

1. **Single Responsibility per File/Component**
   - Each file/component MUST implement only one logical concern or UI element.
   - *Rationale:* Improves testability and maintainability.

```typescript
// MUST: Single responsibility
function ProposalSummary({ summary }: { summary: string }) {
  return <div>{summary}</div>;
}
```

2. **Strict Type Annotations**
   - All function parameters and return types MUST be explicitly typed.
   - *Rationale:* Prevents runtime errors and enforces contract clarity.

```typescript
// MUST: Explicit types
function getProposal(id: string): Promise<Proposal> { ... }
```

3. **Consistent Naming Conventions**
   - MUST use camelCase for variables/functions, PascalCase for components/classes, UPPER_SNAKE_CASE for constants.
   - *Rationale:* Enhances code readability and consistency.

```typescript
// MUST: Naming conventions
const API_URL = '...';
function fetchUserData() { ... }
class ProposalEditor { ... }
```

4. **React Functional Components Only**
   - MUST use function components and hooks; class components are prohibited.
   - *Rationale:* Aligns with React 19 best practices and hooks ecosystem.

5. **Tailwind Utility-First Styling**
   - MUST use Tailwind CSS classes for all styling.
   - *Rationale:* Ensures design consistency and eliminates CSS conflicts.

```typescript
// MUST: Tailwind usage
<button className="px-4 py-2 bg-primary text-white rounded">Save</button>
```

6. **Validation & Sanitization**
   - All user input MUST be validated client-side (Zod) and server-side.
   - *Rationale:* Prevents injection, data corruption, and ensures security.

```typescript
// MUST: Zod schema validation
const proposalSchema = z.object({
  title: z.string().min(5),
  content: z.string(),
});
```

### MUST NOT Do

1. **No Multi-Responsibility Files**
   - MUST NOT combine multiple domains or unrelated logic in one file.

```typescript
// MUST NOT: Mixing domains
// Contains both user auth and proposal logic
```

2. **No Implicit Any or Unchecked Types**
   - MUST NOT use implicit any; always specify types.

```typescript
// MUST NOT: Implicit any
function saveData(data) { ... } // Wrong
function saveData(data: Proposal) { ... } // Correct
```

3. **No Direct State Mutation**
   - MUST NOT mutate Zustand or React state directly; always use setters.

```typescript
// MUST NOT: Direct state mutation
store.state.value = 42; // Wrong
store.setState({ value: 42 }); // Correct
```

4. **No Business Logic in UI Components**
   - MUST NOT place API calls or domain logic inside presentation components; delegate to hooks/services.

```typescript
// MUST NOT: API call in component body
function ProposalEditor() {
  fetch('/api/proposal'); // Wrong
}
```

5. **No Hardcoded Secrets or Keys**
   - MUST NOT commit secrets to codebase; use environment variables and Vercel/Supabase secret management.

6. **No Unhandled Promise Rejections**
   - MUST NOT ignore async errors; always use try/catch or .catch.

```typescript
// MUST NOT: Unhandled promise
api.fetchData().then(data => { ... }); // Wrong
// Correct
try { await api.fetchData(); } catch (e) { ... }
```

## 5. Architecture Patterns

### Component/Module Structure Guidelines

- MUST adhere to domain-driven, layered architecture: presentation → application → domain → infrastructure.
- Each domain module MUST contain its own types, services, and hooks.
- Shared logic MUST be extracted to `shared` modules.

```typescript
// MUST: Domain module example
/domains/proposal/
  ProposalEditor.tsx
  useProposal.ts
  proposalService.ts
  proposalTypes.ts
```

### Data Flow Patterns

- Client-server communication MUST use RESTful JSON APIs via Axios or fetch, with react-query for caching and optimistic updates.
- All server responses MUST follow a standard envelope: `{ data, error }`.
- MUST use SWR/react-query for all data fetching; avoid useEffect for remote fetch.

```typescript
// MUST: react-query usage
const { data, error } = useQuery(['proposal', id], () => fetchProposal(id));
```

### State Management Conventions

- MUST use Zustand for global state; local state via useState/useReducer.
- Server state MUST be managed with @tanstack/react-query.
- MUST NOT create custom global state solutions.

```typescript
// MUST: Zustand store
import { create } from 'zustand';
const useProposalStore = create(set => ({
  proposals: [],
  setProposals: (proposals) => set({ proposals }),
}));
```

### API Design Standards

- All API endpoints MUST be RESTful, stateless, and documented via OpenAPI 3.1.
- MUST validate and sanitize all input (Zod/class-validator).
- MUST implement RBAC and RLS for all data access.
- Error responses MUST NOT expose internal implementation details.

```typescript
// MUST: API response envelope
return c.json({ data: proposal, error: null });
```

```typescript
// MUST NOT: Expose stack trace
return c.json({ error: error.stack }, 500);
```

---

# Example Code Snippets

```typescript
// MUST: Single-responsibility, typed function, error handling
import { z } from 'zod';

const proposalSchema = z.object({
  title: z.string().min(5),
});

async function createProposal(input: z.infer<typeof proposalSchema>): Promise<Proposal> {
  try {
    proposalSchema.parse(input);
    const response = await api.post('/proposals', input);
    return response.data;
  } catch (error) {
    Sentry.captureException(error);
    throw new Error('Proposal creation failed');
  }
}
```

```typescript
// MUST NOT: Mixed concerns and implicit any
function handleUserAndProposal(data) { // Implicit any
  // Handles both user and proposal logic - wrong
}
```

```typescript
// MUST: Zustand global state
import { create } from 'zustand';

type ProposalState = {
  proposals: Proposal[];
  setProposals: (proposals: Proposal[]) => void;
};

export const useProposalStore = create<ProposalState>((set) => ({
  proposals: [],
  setProposals: (proposals) => set({ proposals }),
}));
```

```typescript
// MUST NOT: Direct mutation of state
useProposalStore.getState().proposals.push(newProposal); // Wrong
// Use setProposals instead
```

```typescript
// MUST: react-query data fetching
const { data, isLoading, error } = useQuery(['proposal', id], () => fetchProposal(id));
```

```typescript
// MUST NOT: useEffect for remote data fetch
useEffect(() => {
  fetchProposal(id).then(setProposal); // Wrong
}, [id]);
```

---

## 6. Quality Criteria

- All code MUST be modular, typed, and domain-driven.
- All error paths MUST be handled explicitly.
- No secrets, business logic, or state mutations in UI components.
- All APIs, data, and state MUST be validated and access-controlled.
- Consistency, readability, and maintainability are top priorities.

**This guideline is the single source of truth for all code in this project. All contributors MUST adhere strictly to these rules.**