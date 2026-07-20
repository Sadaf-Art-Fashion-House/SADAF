# SADAF Frontend Architecture

This project now follows a production-oriented structure for the SADAF platform while preserving the existing Next.js app router setup.

## Top-level architecture

- app/: Route groups and application entry points.
- components/: Cross-cutting UI components.
- features/: Feature-based business domains.
- shared/: Reusable design system and platform primitives.
- hooks/: Shared application hooks.
- lib/: Infrastructure and framework integrations.
- services/: Cross-cutting services.
- public/: Static assets.

## Feature folders

Each feature folder contains its own components, hooks, services, api, types, utils, validation, constants, store, and schemas directories when needed.

## Principles

- Feature-based organization
- Clean separation of concerns
- Scalable route groups
- Reusable shared primitives
- Future-ready for server and client components
