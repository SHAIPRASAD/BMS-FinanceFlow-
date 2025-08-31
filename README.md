# BMS-FinanceFlow-
# Overview

This is a modern money transfer application built with React and Express, enabling users to send money internationally through a secure web platform. The application provides features for user authentication, beneficiary management, international money transfers with real-time exchange rates, transaction history, and administrative oversight. It's designed as a full-stack solution with a React frontend using shadcn/ui components and an Express backend with PostgreSQL database[NeonDB] integration via Drizzle ORM.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side application is built with React 18 using TypeScript and modern development practices:

- **Framework**: React with TypeScript for type safety and better developer experience
- **Routing**: Wouter for lightweight client-side routing without the complexity of React Router
- **State Management**: TanStack Query (React Query) for server state management, caching, and synchronization
- **UI Framework**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

The application follows a component-based architecture with clear separation between pages, reusable components, and UI primitives. Custom hooks handle authentication state and foreign exchange rate management.

## Backend Architecture

The server-side is built with Express.js following a RESTful API design:

- **Framework**: Express.js with TypeScript for the API server
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt for password hashing
- **Database Connection**: Neon serverless PostgreSQL with connection pooling
- **API Structure**: Modular route handlers with middleware for authentication and authorization

The backend implements a storage abstraction layer that encapsulates all database operations, making it easy to test and maintain. Authentication middleware provides role-based access control for admin functions.

## Data Storage Solutions

- **Primary Database**: PostgreSQL hosted on Neon serverless platform
- **ORM**: Drizzle ORM with schema definitions shared between client and server
- **Database Schema**: Well-structured relational design with tables for users, beneficiaries, transactions, FX rates, and session storage
- **Migrations**: Drizzle Kit for database schema migrations and management
- **Connection Pooling**: Implemented via Neon's serverless connection pooling

The database design supports user management, beneficiary relationships, transaction tracking with full audit trails, and real-time foreign exchange rate caching.

## Authentication and Authorization

- **Authentication Method**: JWT tokens with 7-day expiration
- **Password Security**: bcrypt hashing with salt rounds for secure password storage
- **Authorization Levels**: User and admin roles with middleware-based access control
- **Session Management**: Stateless JWT approach with token validation on each request
- **Security Features**: Password complexity requirements, account number generation, and admin privilege separation

The authentication system provides secure user registration and login flows while maintaining session state through HTTP-only JWT tokens.

# External Dependencies

## Third-Party Services

- **Exchange Rate API**: Integration with external currency exchange rate providers for real-time FX data
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for real-time connections

## Key Libraries and Frameworks

- **Frontend**: React, TypeScript, Vite, TanStack Query, Wouter, React Hook Form, Zod
- **UI Components**: Radix UI primitives, shadcn/ui, Tailwind CSS, Lucide React icons
- **Backend**: Express.js, Drizzle ORM, bcrypt, jsonwebtoken, cors
- **Database**: PostgreSQL via @neondatabase/serverless with WebSocket support
- **Development Tools**: tsx for TypeScript execution, esbuild for production builds

## Development and Deployment

- **Build System**: Vite for frontend bundling, esbuild for server-side compilation
- **Development**: Hot module replacement, TypeScript checking, and development server setup
- **Environment**: Supports both development and production configurations with environment-specific optimizations
