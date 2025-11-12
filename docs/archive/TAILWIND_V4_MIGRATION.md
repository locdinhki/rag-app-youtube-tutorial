# Tailwind CSS v4 Migration Guide

## What Changed

Successfully migrated from Tailwind CSS v3 to v4 (latest beta). Tailwind v4 introduces a new configuration system that simplifies setup and improves performance.

## Changes Made

### 1. Package Updates

**Removed:**
```bash
npm uninstall tailwindcss postcss autoprefixer
```

**Added:**
```bash
npm install tailwindcss@next @tailwindcss/postcss@next
```

### 2. PostCSS Configuration

**Before (v3):**
```javascript
// postcss.config.mjs
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**After (v4):**
```javascript
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### 3. CSS Configuration

**Before (v3):**
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    /* ... */
  }
}
```

**After (v4):**
```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-background: 0 0% 100%;
  --color-foreground: 0 0% 9%;
  --color-card: 0 0% 100%;
  /* ... */
}

.dark {
  --color-background: 0 0% 4%;
  /* ... */
}

* {
  border-color: hsl(var(--color-border));
}

body {
  background-color: hsl(var(--color-background));
  color: hsl(var(--color-foreground));
  font-feature-settings: "rlig" 1, "calt" 1;
}
```

### 4. Removed Files

**Before:**
- `tailwind.config.ts` - Configuration file

**After:**
- ❌ **Removed** - No config file needed in v4!

### 5. Updated components.json

**Before:**
```json
{
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css"
  }
}
```

**After:**
```json
{
  "tailwind": {
    "config": "",
    "css": "app/globals.css"
  }
}
```

## Key Differences in Tailwind v4

### 1. No Config File Required

Tailwind v4 eliminates the need for `tailwind.config.ts`. All configuration is now done through CSS using the `@theme` directive.

### 2. New @import Syntax

Instead of separate `@tailwind` directives, v4 uses a single import:
```css
@import "tailwindcss";
```

### 3. @theme Directive

Custom colors and design tokens are defined using the `@theme` directive:
```css
@theme {
  --color-primary: 0 0% 9%;
  --radius: 0.5rem;
}
```

### 4. Automatic Autoprefixer

Autoprefixer is now built into the `@tailwindcss/postcss` plugin, no need for a separate dependency.

### 5. CSS Variable Naming

In v4, CSS variables in `@theme` use the `--color-*` prefix automatically:
- `--color-background` → accessible as `bg-background`
- `--color-primary` → accessible as `bg-primary`

## Benefits of v4

✅ **Simpler Configuration** - No config file needed
✅ **Faster Build Times** - Improved performance
✅ **Better DX** - CSS-first configuration
✅ **Smaller Bundle** - More efficient output
✅ **Native CSS Features** - Better CSS variable support

## Verifying the Migration

### 1. Check Dependencies

```bash
npm list tailwindcss
```

Should show: `tailwindcss@4.x.x`

### 2. Test the Build

```bash
npm run dev
```

Should compile without errors and serve at `http://localhost:3000`

### 3. Test Styles

All Tailwind classes should work as before:
- `bg-primary`
- `text-muted-foreground`
- `border-border`
- `rounded-lg`
- etc.

### 4. Test Components

Visit `/upload` page and verify:
- ✅ Drag-and-drop area styling works
- ✅ County badges have colors
- ✅ Cards render correctly
- ✅ Buttons have proper styling
- ✅ Hover effects work
- ✅ Dark mode works (if implemented)

## Backwards Compatibility

All existing Tailwind utility classes continue to work exactly as before. The only changes are in how Tailwind is configured, not in how it's used.

### Same Classes, New System

```html
<!-- These all work the same in v3 and v4 -->
<div className="bg-background text-foreground">
<button className="bg-primary text-primary-foreground">
<card className="border border-border rounded-lg">
```

## Troubleshooting

### Issue: Build fails with "Cannot find module 'tailwindcss'"

**Solution:**
```bash
npm install tailwindcss@next @tailwindcss/postcss@next --legacy-peer-deps
```

### Issue: Styles not applying

**Solution:**
1. Check `app/globals.css` has `@import "tailwindcss";`
2. Verify `postcss.config.mjs` uses `@tailwindcss/postcss`
3. Clear Next.js cache: `rm -rf .next`
4. Restart dev server

### Issue: Custom colors not working

**Solution:**
Make sure CSS variables in `@theme` use the `--color-*` prefix:
```css
@theme {
  --color-my-custom: 200 100% 50%;
}
```

Then use as: `bg-my-custom`

## Migration Checklist

- [x] Uninstall Tailwind v3 packages
- [x] Install Tailwind v4 packages
- [x] Update `postcss.config.mjs`
- [x] Update `app/globals.css` with `@import` and `@theme`
- [x] Remove `tailwind.config.ts`
- [x] Update `components.json`
- [x] Test dev server
- [x] Verify all components render correctly
- [x] Test all Tailwind utilities
- [x] Update documentation

## Resources

- [Tailwind CSS v4 Beta Docs](https://tailwindcss.com/docs/v4-beta)
- [Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [What's New in v4](https://tailwindcss.com/blog/tailwindcss-v4-beta)

## Current Status

✅ **Migration Complete** - All features working with Tailwind CSS v4

The project is now using Tailwind CSS v4 with the modern `@theme` configuration system. All upload features, components, and styling work as expected.
