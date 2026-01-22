<img src="./public/images/android-chrome-192x192.png" alt="Resido - Open-source residential manager" width="76px" height="76px" />

# Resido

**Resido** is an open-source residential management system for managing properties, owners, violations, payments, and related operations.

## Features

- **Owner Management**: Create, update, and manage property owners with contact information
- **House Management**: Track residential properties with addresses and owner assignments
- **Payment Tracking**: Record monthly fees, special assessments, and other payments
- **Violation Management**: Document and track residential violations with fines
- **Role-Based Access**: Admin-only areas with authentication and authorization
- **Dark Mode**: Built-in theme support for light and dark modes
- **Data Tables**: Sortable, searchable tables with bulk operations
- **Responsive Design**: Mobile-friendly UI that works on all devices

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

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or hosted)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/resido.git
   cd resido
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your PostgreSQL connection string:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/resido
   ```

4. Push the database schema:
   ```bash
   npm run db:push
   ```

5. Seed the database with initial data (creates admin user):
   ```bash
   npm run db:seed
   ```

   Default admin credentials:
   - Email: `admin@resido.com`
   - Password: `admin123` (⚠️ Change this in production!)

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

### Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run Biome linter and formatter checks
- `npm run check:fix` - Auto-fix linting and formatting issues
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes directly to database
- `npm run db:pull` - Pull schema from database
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with initial data

### Project Structure

```
src/
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
├── server-fns/             # Server functions (API layer)
└── styles/                 # Global styles
```

### Database Management

#### Viewing Data
Use Drizzle Studio to view and edit data:
```bash
npm run db:studio
```

#### Making Schema Changes
1. Edit schema files in `src/db/schemas/`
2. Push changes to database:
   ```bash
   npm run db:push
   ```
3. Or generate migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

### Code Quality

The project uses Biome for linting and formatting:

```bash
# Check for issues
npm run check

# Auto-fix issues
npm run check:fix
```

Pre-commit hooks automatically run checks before each commit.

## Deployment

The application can be deployed to any platform that supports Node.js and PostgreSQL:

- [Vercel](https://vercel.com/) (Recommended for TanStack Start)
- [Netlify](https://www.netlify.com/)
- [Railway](https://railway.app/)
- [Render](https://render.com/)
- Self-hosted with Docker

Make sure to:
1. Set `DATABASE_URL` environment variable
2. Run database migrations: `npm run db:migrate`
3. Change default admin password
4. Set up proper authentication configuration

## Architecture

### Authentication
- Cookie-based sessions with Better Auth
- Server-side session validation
- Middleware-based route protection
- Role-based access control (admin roles)

### Data Fetching
- TanStack Query for server state
- Centralized query options pattern
- Automatic background refetching
- Optimistic updates

### Styling
- Tailwind CSS v4 with CSS variables
- Custom design tokens
- Light and dark mode support
- Responsive breakpoints

### Type Safety
- End-to-end TypeScript with strict mode
- Drizzle schema generates TypeScript types
- Zod schemas for runtime validation
- Type-safe server functions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For questions and support, please open an issue on GitHub.

## Acknowledgments

Built with modern technologies from the React ecosystem:
- [TanStack](https://tanstack.com/) - Query, Router, Table, Start
- [Tailwind Labs](https://tailwindcss.com/) - Tailwind CSS
- [Better Auth](https://www.better-auth.com/) - Authentication
- [Drizzle Team](https://orm.drizzle.team/) - Drizzle ORM
