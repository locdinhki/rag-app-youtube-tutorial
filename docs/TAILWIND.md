# Tailwind CSS Configuration

## Current Version: v3 (Stable)

This project uses **Tailwind CSS v3**, which is stable and production-ready for Next.js 15.

## Why v3 Instead of v4?

Tailwind CSS v4 is currently in beta and has compatibility issues with Next.js 15.5.6's Webpack configuration. When using v4 with the `@import "tailwindcss"` syntax, you encounter scanner errors.

We'll migrate to v4 when it reaches stable release and Next.js adds proper support.

## Current Configuration

### Package Versions

```json
{
  "devDependencies": {
    "tailwindcss": "^3.4.18",
    "postcss": "^8.5.6",
    "autoprefixer": "^10.4.22"
  }
}
```

### postcss.config.mjs

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### tailwind.config.ts

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        // ... other colors
      },
    },
  },
  plugins: [],
};
```

### app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 9%;
    --primary: 0 0% 9%;
    --muted: 0 0% 96%;
    --border: 0 0% 89%;
    /* ... other CSS variables */
  }

  .dark {
    --background: 0 0% 4%;
    --foreground: 0 0% 98%;
    /* ... dark mode colors */
  }
}
```

## Color System

### CSS Variables

All colors are defined as HSL values in CSS variables:

```css
--background: 0 0% 100%        /* White */
--foreground: 0 0% 9%          /* Almost black */
--primary: 0 0% 9%             /* Primary action color */
--muted: 0 0% 96%              /* Muted backgrounds */
--border: 0 0% 89%             /* Border color */
--card: 0 0% 100%              /* Card backgrounds */
```

### Usage in Components

```tsx
<div className="bg-background text-foreground">
<button className="bg-primary text-primary-foreground">
<div className="border border-border">
```

## Custom County Colors

Each Colorado county has unique badge colors:

```typescript
const COUNTY_COLORS = {
  'Boulder': 'bg-blue-100 text-blue-800 border-blue-200',
  'Denver': 'bg-purple-100 text-purple-800 border-purple-200',
  'Arapahoe': 'bg-green-100 text-green-800 border-green-200',
  // ... etc
};
```

## Features Available

All Tailwind v3 features work perfectly:

- ✅ All utility classes
- ✅ Custom colors via CSS variables
- ✅ shadcn/ui components
- ✅ Dark mode support
- ✅ Responsive design
- ✅ JIT compilation
- ✅ `@apply` directive
- ✅ `@layer` directive
- ✅ Custom plugins

## Responsive Breakpoints

```css
/* Mobile-first approach */
/* Default (< 640px) */
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Usage Example

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

## Common Utilities

### Layout
```
space-y-{n}    - Vertical spacing
gap-{n}        - Grid/flex gaps
grid           - CSS Grid
flex           - Flexbox
max-w-{size}   - Max widths
```

### Interactivity
```
hover:         - Hover states
focus:         - Focus states
disabled:      - Disabled states
transition-*   - Transitions
cursor-*       - Cursor styles
```

### Typography
```
text-{size}    - Font sizes
font-{weight}  - Font weights
text-{color}   - Text colors
truncate       - Text overflow
line-clamp-{n} - Line clamping
```

## Dark Mode

Dark mode is configured but not yet implemented in the UI:

```tsx
// To enable dark mode
<html className="dark">
```

CSS variables automatically switch:
```css
:root { --background: 0 0% 100%; }
.dark { --background: 0 0% 4%; }
```

## Future Migration to v4

When Tailwind v4 becomes compatible:

1. Update packages:
```bash
npm uninstall tailwindcss postcss autoprefixer
npm install tailwindcss@next @tailwindcss/postcss@next
```

2. Update `postcss.config.mjs`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

3. Update `app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-background: 0 0% 100%;
  --color-foreground: 0 0% 9%;
  /* ... */
}
```

4. Delete `tailwind.config.ts`

## Best Practices

1. **Use CSS variables** - Enables theme switching
2. **Mobile-first** - Start with mobile, add larger breakpoints
3. **Semantic classes** - `bg-background` vs `bg-white`
4. **Avoid @apply** - Use utility classes directly when possible
5. **Component extraction** - Extract repeated patterns to components

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS v3 Features](https://tailwindcss.com/docs/upgrade-guide)
- [shadcn/ui Components](https://ui.shadcn.com)
