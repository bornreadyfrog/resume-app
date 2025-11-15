# AI Coding Agent Instructions

This document guides AI agents in understanding and contributing to this Next.js 16 project with React 19 and TypeScript.

## Project Overview

**my-app** is a modern Next.js application bootstrapped with `create-next-app`, featuring:
- **Framework**: Next.js 16.0.3 with React 19.2.0
- **Language**: TypeScript 5 with strict mode enabled
- **Styling**: Tailwind CSS 4 via PostCSS integration
- **Linting**: ESLint 9 with next/core-web-vitals and TypeScript rules
- **Architecture**: App Router-based structure (next/app)

## Key Files & Directory Structure

```
my-app/
├── app/
│   ├── layout.tsx          # Root layout with Geist fonts; metadata defined here
│   ├── page.tsx            # Home page component (66 lines)
│   └── globals.css         # Tailwind directives & global styles
├── public/                 # Static assets (SVGs, images)
├── package.json            # Dependencies: React 19, Next 16, Tailwind 4
├── tsconfig.json           # Strict mode; path alias: @/* maps to ./*
├── next.config.ts          # Next.js configuration (currently empty)
├── eslint.config.mjs        # ESLint setup with next rules
└── .github/
    └── copilot-instructions.md  # This file
```

## Architecture & Patterns

### Component Structure
- **Root Layout** (`app/layout.tsx`): Wraps all pages; applies Geist Sans/Mono fonts via CSS variables
- **Pages** (`app/page.tsx`): Default export functions; TypeScript interfaces for props
- **Styling**: Inline Tailwind classes; dark mode via `dark:` prefix (e.g., `dark:bg-black`)

### TypeScript Configuration
- **Strict mode**: All type checking enabled (`strict: true`)
- **Path aliases**: Use `@/*` to import from project root (e.g., `@/components/Header`)
- **Target**: ES2017; JSX compiled as `react-jsx`
- **Module system**: ESNext (no CommonJS)

### Tailwind CSS Integration
- **Version**: Tailwind 4 with `@tailwindcss/postcss`
- **PostCSS**: Configured in `postcss.config.mjs`
- **Responsive prefixes**: Use `sm:`, `md:`, `lg:` for breakpoints
- **Dark mode**: Enabled via `dark:` prefix in classes

## Development Workflows

### Getting Started
```bash
npm run dev        # Start development server at http://localhost:3000
npm run build      # Production build (.next/)
npm start          # Run production server
npm run lint       # Run ESLint (eslint .)
```

### Hot Module Reloading (HMR)
- Next.js HMR enabled by default; changes to `app/page.tsx` auto-refresh in browser
- Layout changes require page refresh

### Building & Deployment
- **Build output**: `.next/` directory (ignored by git)
- **Entry point**: `app/page.tsx` + `app/layout.tsx`
- **Deployment**: Optimized for Vercel (see README for details)

## Code Conventions

### TypeScript
- Use typed function signatures; example from `layout.tsx`:
  ```tsx
  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) { ... }
  ```
- Never use `any`; prefer generics or union types
- Import types: `import type { Metadata } from "next"`

### React & Components
- **Server Components**: Default in Next.js 13+ app router; use `'use client'` only when needed
- **Metadata**: Define in layout or page via `export const metadata`
- **Images**: Use `next/image` component for optimization (see `page.tsx`)

### Styling
- Prefer Tailwind classes over CSS modules for consistency with project setup
- Use CSS variables for theme colors: `--font-geist-sans`, `--font-geist-mono`
- Dark mode: Apply `dark:` variants for light/dark theme support

### ESLint
- Configured with `eslint-config-next/core-web-vitals` and TypeScript rules
- Ignore patterns: `.next/`, `out/`, `build/`, `next-env.d.ts`
- Run `npm run lint` before committing

## External Dependencies & Integration Points

### Core Dependencies
- **React 19**: Latest major version; RC features stable
- **Next.js 16**: App Router (stable), dynamic imports, image optimization
- **TypeScript 5**: TypeScript 5.0+ features available

### Font Management
- **next/font**: Geist font family (custom Google fonts)
- Fonts loaded at build time; CSS variables injected to HTML

### Deployment
- **Vercel Platform**: Primary deployment target
- **Environment**: Node.js 18+
- **Output**: Standalone builds supported

## Patterns to Follow

1. **Type your React components**: Use `React.ReactNode` for children, proper event types
2. **Keep layout.tsx minimal**: Root layout should only contain shared structure (fonts, metadata, body)
3. **Use path aliases**: Import `@/components/...` instead of relative paths
4. **Dark mode first**: Apply `dark:` variants alongside light mode styles
5. **Image optimization**: Always use `next/image` with explicit width/height
6. **Metadata**: Define page-specific metadata in each route

## Common Tasks

### Adding a New Page
1. Create file at `app/my-page/page.tsx`
2. Export default React component
3. Add metadata if needed
4. Use Tailwind classes for styling

### Creating a Component
1. File in `app/` or dedicated `components/` directory
2. Use `.tsx` extension for TypeScript
3. Import and compose in pages
4. Apply Tailwind classes for styling

### Debugging
- **Development**: Browser DevTools + `npm run dev`
- **Console**: `console.log()` appears in terminal and browser
- **Types**: TypeScript errors appear in terminal during dev

---

**Last Updated**: November 2025  
**Next.js Docs**: https://nextjs.org/docs  
**Tailwind Docs**: https://tailwindcss.com/docs
