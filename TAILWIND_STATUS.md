# Tailwind CSS Status

## Current Version: v3 (Stable)

This project uses **Tailwind CSS v3**, which is the stable, production-ready version that works perfectly with Next.js 15.

## Why Not v4?

Tailwind CSS v4 is currently in **beta** and has compatibility issues with Next.js 15.5.6's Webpack configuration.

### The Problem

When using Tailwind v4 with the `@import "tailwindcss"` syntax, you'll encounter this error:

```
Error: Missing field `negated` on ScannerOptions.sources
```

This is a known issue where Tailwind v4's new scanner (oxide engine) conflicts with Next.js 15's current Webpack loaders.

### What We Tried

1. ✅ Installed `tailwindcss@next` and `@tailwindcss/postcss@next`
2. ✅ Updated `postcss.config.mjs` to use `@tailwindcss/postcss`
3. ✅ Used `@import "tailwindcss"` in globals.css
4. ✅ Tried `@theme` directive
5. ✅ Tried `@layer` with CSS variables
6. ❌ All resulted in the scanner error

## Current Setup (v3)

### Package Versions

```json
{
  "devDependencies": {
    "tailwindcss": "^3.x.x",
    "postcss": "^8.x.x",
    "autoprefixer": "^10.x.x"
  }
}
```

### Configuration Files

**postcss.config.mjs:**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**tailwind.config.ts:**
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
        // ... other colors
      },
    },
  },
  plugins: [],
};
```

**app/globals.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    // ... CSS variables
  }
}
```

## When Can We Use v4?

Tailwind v4 will be compatible with Next.js when either:

1. **Tailwind v4 reaches stable release** with proper Next.js 15 support
2. **Next.js updates** their Webpack/PostCSS configuration to work with v4's scanner
3. **Next.js migrates to Turbopack** (which may have better v4 support)

## Monitoring the Situation

Check these resources for updates:

- [Tailwind CSS v4 Beta Announcement](https://tailwindcss.com/blog/tailwindcss-v4-beta)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Tailwind v4 GitHub Issues](https://github.com/tailwindlabs/tailwindcss/issues)

## What Works Now

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

## Migration Path

When Tailwind v4 becomes compatible with Next.js 15:

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
     // ...
   }
   ```

4. Delete `tailwind.config.ts` (no longer needed in v4)

## Conclusion

**Tailwind CSS v3 is the right choice for now.** It's:

- ✅ Stable and production-ready
- ✅ Fully compatible with Next.js 15
- ✅ Well-documented
- ✅ Supported by shadcn/ui
- ✅ Has all features we need

We'll migrate to v4 when it reaches stable release and Next.js adds proper support.
