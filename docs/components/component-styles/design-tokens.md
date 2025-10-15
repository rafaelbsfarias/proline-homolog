# Design Tokens

This document defines the design tokens used throughout the ProLine Hub application, including color palette, typography, and spacing scales.

## Color Palette

### Primary Colors
The primary color palette establishes the brand identity of ProLine Hub:

| Color Name | HEX Value | Usage |
|------------|-----------|-------|
| Primary Blue | `#002e4c` | Main brand color, primary buttons, links |
| Primary Dark | `#001f36` | Hover states for primary buttons |
| Secondary Blue | `#1977f2` | Secondary actions, highlights |
| Accent Blue | `#e8f1ff` | Backgrounds, hover states for secondary buttons |

### Neutral Colors
Neutral colors provide balance and hierarchy to the interface:

| Color Name | HEX Value | Usage |
|------------|-----------|-------|
| White | `#ffffff` | Backgrounds, cards |
| Light Gray | `#f5f5f5` | Page backgrounds, disabled states |
| Gray | `#cccccc` | Borders, disabled buttons |
| Dark Gray | `#666666` | Secondary text, icons |
| Black | `#333333` | Primary text, headings |

### Status Colors
Status colors communicate the state of elements and actions:

| Color Name | HEX Value | Usage |
|------------|-----------|-------|
| Success Green | `#4caf50` | Success messages, positive actions |
| Warning Orange | `#ff9800` | Warning messages, caution states |
| Error Red | `#f44336` | Error messages, destructive actions |
| Info Blue | `#2196f3` | Informational messages, neutral actions |

### Semantic Colors
Semantic colors map to specific meanings and contexts:

| Color Name | HEX Value | Usage |
|------------|-----------|-------|
| Active Green | `#76c76f` | Active states, approved items |
| Pending Yellow | `#ffc107` | Pending states, items awaiting action |
| Rejected Red | `#ee5a52` | Rejected states, errors |
| Draft Gray | `#9e9e9e` | Draft states, incomplete items |

## Typography

### Font Family
The ProLine Hub application uses a clean, modern sans-serif font stack:

```
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes
Typography follows a modular scale that maintains visual harmony across different screen sizes:

| Size Name | Value | REM | Usage |
|-----------|-------|-----|-------|
| Caption | 12px | 0.75rem | Helper text, captions, meta information |
| Body Small | 14px | 0.875rem | Secondary text, labels, small content |
| Body | 16px | 1rem | Primary text, paragraphs |
| Subheading | 18px | 1.125rem | Section titles, subheadings |
| Heading 4 | 20px | 1.25rem | Card titles, small section headings |
| Heading 3 | 24px | 1.5rem | Section headings, modal titles |
| Heading 2 | 28px | 1.75rem | Page titles, major section headings |
| Heading 1 | 32px | 2rem | Main page titles, hero sections |

### Font Weights
Font weights establish visual hierarchy and emphasis:

| Weight Name | Value | Usage |
|-------------|-------|-------|
| Light | 300 | Supporting text, captions |
| Regular | 400 | Body text, default weight |
| Medium | 500 | Headings, emphasized text |
| Semi-Bold | 600 | Major headings, important text |
| Bold | 700 | Page titles, key metrics |

### Line Heights
Appropriate line heights improve readability and visual flow:

| Size | Line Height | Usage |
|------|--------------|-------|
| Caption | 1.4 | Compact text blocks |
| Body | 1.5 | Paragraphs, default content |
| Subheading | 1.4 | Titles, headings |
| Heading | 1.3 | Major headings, titles |

## Spacing Scale

The spacing scale follows an 8-point grid system for consistent and harmonious layouts:

| Name | Pixels | REM | Usage |
|------|--------|-----|-------|
| XXS | 4px | 0.25rem | Micro spacing, icon padding |
| XS | 8px | 0.5rem | Element padding, small gaps |
| S | 12px | 0.75rem | Component padding, tight spacing |
| M | 16px | 1rem | Standard padding, element margins |
| L | 24px | 1.5rem | Section spacing, card margins |
| XL | 32px | 2rem | Page sections, major spacing |
| XXL | 48px | 3rem | Page-level spacing, large gaps |

## Border Radius

Border radius values provide consistent rounding across UI elements:

| Name | Value | Usage |
|------|-------|-------|
| Sharp | 0px | Forms, tables, sharp edges |
| Rounded | 4px | Buttons, small cards, input fields |
| Soft | 6px | Cards, panels, medium components |
| Pill | 8px | Large cards, banners, major components |
| Circular | 50% | Avatars, circular buttons, badges |

## Shadows

Shadows create depth and hierarchy in the interface:

| Name | Value | Usage |
|------|-------|-------|
| Subtle | `0 1px 4px rgba(0, 0, 0, 0.08)` | Cards, subtle elevation |
| Medium | `0 2px 8px rgba(0, 0, 0, 0.12)` | Modals, elevated cards |
| Strong | `0 4px 16px rgba(0, 0, 0, 0.16)` | Dropdowns, important overlays |
| Focus | `0 0 0 3px rgba(25, 119, 242, 0.2)` | Focus states for interactive elements |

## Breakpoints

Responsive breakpoints ensure consistent behavior across different devices:

| Name | Value | Usage |
|------|-------|-------|
| Mobile | 0px - 768px | Mobile-first design, compact layouts |
| Tablet | 769px - 1024px | Tablet layouts, moderate complexity |
| Desktop | 1025px - 1440px | Standard desktop layouts, full features |
| Large Desktop | 1441px+ | Wide-screen layouts, maximum complexity |

## Animation

Animation timings and easing functions create smooth, purposeful motion:

| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| Immediate | 0ms | linear | State changes without transition |
| Fast | 150ms | ease-in-out | Simple state changes, hover effects |
| Standard | 300ms | ease-in-out | Page transitions, modal appearance |
| Slow | 500ms | ease-in-out | Complex animations, loading sequences |

## Z-Index Scale

Z-index values ensure proper layering of UI elements:

| Name | Value | Usage |
|------|-------|-------|
| Background | -1 | Background elements, behind content |
| Default | 0 | Base layer for most content |
| Floating | 10 | Floating elements, tooltips |
| Sticky | 20 | Sticky headers, navigation bars |
| Overlay | 100 | Modals, fullscreen overlays |
| Toast | 110 | Toast notifications, alerts |
| Tooltip | 120 | Tooltips, contextual help |

## Iconography

Icon sizing and color guidelines ensure consistent icon usage:

| Size | Pixels | REM | Usage |
|------|--------|-----|-------|
| Small | 16px | 1rem | Inline icons, small controls |
| Medium | 20px | 1.25rem | Standard icons, buttons |
| Large | 24px | 1.5rem | Featured icons, major actions |
| XL | 32px | 2rem | Hero icons, promotional elements |

Icons should use the primary color palette and follow these accessibility guidelines:
- Minimum contrast ratio of 4.5:1 against background
- Clear, recognizable shapes even at small sizes
- Consistent stroke weights and visual weight

## Accessibility

All design tokens are designed with accessibility in mind:

- **Color Contrast**: All text colors meet WCAG 2.1 AA standards (4.5:1 contrast ratio)
- **Focus States**: Visible focus indicators for keyboard navigation
- **Semantic Meaning**: Colors have semantic meaning beyond visual appeal
- **Reduced Motion**: Respect for user preference for reduced motion

## Implementation

Design tokens are implemented using CSS custom properties for easy maintenance and theming:

```css
:root {
  /* Colors */
  --color-primary: #002e4c;
  --color-primary-dark: #001f36;
  --color-secondary: #1977f2;
  
  /* Typography */
  --font-size-body: 1rem;
  --font-size-heading: 2rem;
  --font-weight-regular: 400;
  --font-weight-bold: 700;
  
  /* Spacing */
  --spacing-xs: 0.5rem;
  --spacing-m: 1rem;
  --spacing-l: 1.5rem;
  
  /* Other tokens */
  --border-radius: 6px;
  --shadow-medium: 0 2px 8px rgba(0, 0, 0, 0.12);
}
```

This approach allows for easy theming and consistent application of design tokens throughout the application.

## Updates and Maintenance

Design tokens should be updated with care and consideration:

1. **Versioning**: Major changes should be versioned to prevent breaking existing implementations
2. **Deprecation**: Deprecated tokens should be clearly marked and maintained for a transition period
3. **Testing**: Changes should be tested across all major browsers and devices
4. **Documentation**: All changes should be clearly documented with release notes
5. **Accessibility**: All changes should be validated for accessibility compliance

## Contributing

To contribute to the design token system:

1. Follow the established naming conventions and value scales
2. Ensure all changes maintain accessibility standards
3. Update documentation to reflect changes
4. Coordinate with design team for approval of visual changes
5. Test changes across all supported browsers and devices