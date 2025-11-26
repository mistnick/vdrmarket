# DataRoom Design System

**Version**: 1.0  
**Last Updated**: 2025-11-22  
**Status**: Active

## Overview

This design system defines the visual language and interaction patterns for the DataRoom platform, following modern enterprise-grade VDR (Virtual Data Room) design principles.

---

## Core Principles

1. **Clarity First**: Every element serves a purpose. Remove decorative elements.
2. **Professional & Trustworthy**: Suitable for high-stakes document management and due diligence.
3. **Minimalistic**: Generous white space, clean layouts, subtle interactions.
4. **Consistent**: Uniform styling across all views and components.

---

## Color Palette

### Base Colors

```css
--color-background: #FFFFFF;
--color-surface: #F5F6F7;
--color-surface-alt: #E9ECEF;
--color-border: #DADDE1;
--color-text-primary: #1E1E1E;
--color-text-secondary: #6B6B6B;
```

### Primary Accent

```css
--color-primary: #20AF79;      /* Emerald Green */
--color-primary-hover: #1B9A6A;
--color-primary-light: #E6F7F1;
```

### Semantic Colors

```css
--color-success: #20AF79;       /* Soft green */
--color-warning: #F59E0B;       /* Amber */
--color-error: #EF4444;         /* Soft red */
--color-info: #3B82F6;          /* Blue */
```

### Usage Guidelines

- **Primary Green (#20AF79)**: Primary buttons, active states, charts, key indicators
- **White/Light Grey**: Backgrounds and surfaces
- **Dark Grey**: Primary text and headings
- **Semantic Colors**: Use sparingly for status badges, alerts, and labels

---

## Typography

### Font Family

**Primary**: Inter (Geometric Sans-Serif)  
**Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

### Type Scale

```css
/* Headings */
--font-size-h1: 2rem;       /* 32px - Page titles */
--font-size-h2: 1.5rem;     /* 24px - Section headers */
--font-size-h3: 1.25rem;    /* 20px - Card titles */

/* Body */
--font-size-base: 0.875rem; /* 14px - Standard text */
--font-size-sm: 0.75rem;    /* 12px - Labels, captions */
--font-size-lg: 1rem;       /* 16px - Emphasized text */

/* Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Hierarchy Guidelines

- **Titles**: Medium-large size, semi-bold weight
- **Navigation & Labels**: Medium size, medium weight
- **Table Text**: Small size, regular weight
- **Metrics/KPIs**: Bold weight, slightly larger for emphasis

---

## Layout & Spacing

### Spacing Scale

```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-12: 3rem;    /* 48px */
```

### Layout Patterns

- **Two-Column Grid**: Dashboard and settings pages
- **Full-Width Tables**: Data-heavy views
- **Fixed Sidebar**: Left-side navigation (260px)
- **Container Max-Width**: 1280px for main content

### Principles

- Generous padding (minimum 16px)
- Consistent spacing system
- Airy, uncluttered layouts
- Clear visual grouping

---

## Components

### Sidebar

**Style**: Vertical, minimal, fixed position  
**Width**: 260px  
**Icons**: Thin outline style (Lucide/Heroicons)

**States**:
- Active: Green accent border/background
- Hover: Subtle grey background
- Inactive: Grey text

### Header

**Height**: 64px  
**Style**: Flat, minimal, white background  
**Elements**: Logo, navigation, profile menu, utilities

### Buttons

#### Primary Button
```css
background: #20AF79;
color: #FFFFFF;
padding: 10px 20px;
border-radius: 6px;
font-weight: 500;
box-shadow: none;
```

**Hover**: Darker green (#1B9A6A)

#### Secondary Button
```css
background: transparent;
border: 1px solid #DADDE1;
color: #1E1E1E;
padding: 10px 20px;
border-radius: 6px;
```

**Hover**: Light grey background

### Cards & Panels

```css
background: #FFFFFF;
border-radius: 8px;
border: 1px solid #E9ECEF;
padding: 24px;
box-shadow: none;
```

**Usage**: Dashboards, summaries, settings sections

### Tables

**Row Height**: 52px (generous)  
**Borders**: Soft grey dividers (#E9ECEF)  
**Headers**: Semi-bold, slightly darker background

**Features**:
- Icons/badges aligned left
- Hover state on rows
- Status badges with semantic colors

### Forms & Inputs

```css
border: 1px solid #DADDE1;
border-radius: 6px;
padding: 10px 12px;
font-size: 14px;
background: #FFFFFF;
```

**Focus**: Green border (#20AF79)

### Charts

**Style**: Minimalistic, no 3D effects  
**Colors**: Green for primary data  
**Grid**: Subtle grey lines  
**Labels**: Small, grey text

### Badges

**Sizes**: Small (20px height), Medium (24px)  
**Colors**: Semantic (green/success, red/warning, blue/info)  
**Style**: Rounded, subtle background, medium text

---

## Iconography

### Style
- **Type**: Outline icons (thin stroke)
- **Weight**: 1.5-2px stroke width
- **Library**: Lucide Icons / Heroicons
- **Size**: 16px (small), 20px (medium), 24px (large)

### Usage
- Navigation: 20px
- Buttons: 16px
- Headers: 24px
- Tables: 16px

---

## Interactions

### Hover States
- Subtle background color change
- No shadows or dramatic effects
- Soft underline for text links

### Transitions
```css
transition: all 0.15s ease-in-out;
```

### Focus States
- Green outline for keyboard navigation
- Clear, visible indicators

### Loading States
- Minimal spinners
- Skeleton screens for content
- No elaborate animations

---

## Accessibility

- **Contrast Ratios**: WCAG AA minimum (4.5:1 for text)
- **Focus Indicators**: Always visible
- **Keyboard Navigation**: Full support
- **Screen Readers**: Proper ARIA labels

---

## Implementation Notes

### Tailwind Configuration

Update `tailwind.config.js` with:

```js
colors: {
  primary: '#20AF79',
  'primary-hover': '#1B9A6A',
  'primary-light': '#E6F7F1',
  surface: '#F5F6F7',
  border: '#DADDE1',
}

fontFamily: {
  sans: ['Inter', '-apple-system', 'sans-serif'],
}

borderRadius: {
  DEFAULT: '6px',
  lg: '8px',
}
```

### Component Library

- All components should import from `@/components/ui`
- Use shadcn/ui as base, customize to match this design system
- Override default styles in `globals.css`

---

## Examples

See `/docs/UI-FLOW.md` for page-by-page UI analysis and current implementation.
