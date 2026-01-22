<img src="./public/images/android-chrome-192x192.png" alt="Resido - Open-source residential manager" width="76px" height="76px" />

# Resido

**Resido** is an open-source residential management system for managing properties, owners, violations, payments, and related operations.

## Tech Stack

### Frontend
- [React 19](https://react.dev/) - UI library
- [TanStack Start](https://tanstack.com/start/latest) - Full-stack React framework with SSR
- [TanStack Router](https://tanstack.com/router/latest) - Type-safe file-based routing
- [TanStack Query](https://tanstack.com/query/latest) - Server state management
- [TanStack Table](https://tanstack.com/table/latest) - Headless table library
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- [Base UI](https://base-ui.com/) - Headless accessible UI components
- [React Hook Form](https://react-hook-form.com/) - Form state management
- [Zod](https://zod.dev/) - Schema validation

### Backend
- [TanStack Start Server Functions](https://tanstack.com/start/latest/docs/framework/react/start/server-functions) - Type-safe RPC API
- [Better Auth](https://www.better-auth.com/) - Authentication library
- [PostgreSQL](https://www.postgresql.org/) - Relational database
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe ORM

### Developer Tools
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Biome](https://biomejs.dev/) - Fast linter and formatter
- [Vite](https://vitejs.dev/) - Build tool
- [Husky](https://typicode.github.io/husky/) - Git hooks

## Project Structure

```
src/
├── api/
│   ├── server-functions/   # Server functions (RPC API layer)
│   └── tanstack-queries/   # TanStack Query configurations
├── components/
│   ├── admin/              # Admin feature components (owners, houses, payments, violations)
│   ├── shared/             # Shared components (error boundaries, selectors)
│   ├── table/              # Reusable table components
│   └── ui/                 # Base UI component library
├── db/
│   ├── schemas/            # Drizzle ORM schemas
│   └── seed.ts             # Database seeding script
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and configurations
├── middleware/             # Authentication and authorization middleware
├── routes/                 # File-based routing
├── schemas/                # Form validation schemas
└── styles/                 # Global styles
```
