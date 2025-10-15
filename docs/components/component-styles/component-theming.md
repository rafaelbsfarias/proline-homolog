# Component Theming

This document explains how to customize and theme ProLine Hub components to match specific branding requirements or create variations for different contexts.

## Theme System Overview

The ProLine Hub component library uses CSS custom properties (CSS variables) for theming, allowing for runtime customization without requiring CSS-in-JS solutions or complex build processes. Themes are defined using CSS custom properties that can be overridden at different levels of the application.

## Default Theme

The default theme is defined in the application's global CSS and can be found in `app/globals.css`:

```css
:root {
  /* Colors */
  --theme-primary: #002e4c;
  --theme-primary-dark: #001f36;
  --theme-secondary: #1977f2;
  --theme-accent: #e8f1ff;
  --theme-success: #4caf50;
  --theme-warning: #ff9800;
  --theme-error: #f44336;
  --theme-info: #2196f3;
  
  /* Backgrounds */
  --theme-background: #ffffff;
  --theme-background-alt: #f5f5f5;
  --theme-surface: #ffffff;
  
  /* Text */
  --theme-text-primary: #333333;
  --theme-text-secondary: #666666;
  --theme-text-disabled: #cccccc;
  
  /* Borders */
  --theme-border: #cccccc;
  --theme-border-light: #eeeeee;
  
  /* Typography */
  --theme-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
  --theme-font-size-base: 16px;
  --theme-line-height-base: 1.5;
  
  /* Spacing */
  --theme-spacing-unit: 8px;
  --theme-border-radius: 6px;
  
  /* Shadows */
  --theme-shadow-small: 0 1px 4px rgba(0, 0, 0, 0.08);
  --theme-shadow-medium: 0 2px 8px rgba(0, 0, 0, 0.12);
  --theme-shadow-large: 0 4px 16px rgba(0, 0, 0, 0.16);
}
```

## Creating Custom Themes

### 1. Basic Theme Override

To create a simple theme override, define new CSS custom properties in a scoped CSS file or inline style:

```css
/* Dark theme override */
[data-theme="dark"] {
  --theme-primary: #4a90e2;
  --theme-background: #1a1a1a;
  --theme-text-primary: #ffffff;
  --theme-border: #404040;
}
```

Apply the theme by adding the data attribute to the body or a container element:

```html
<body data-theme="dark">
  <!-- Application content -->
</body>
```

### 2. Advanced Theme Definition

For more complex themes, create a separate CSS file with a complete theme definition:

```css
/* themes/brand-theme.css */
[data-theme="brand"] {
  /* Brand colors */
  --theme-primary: #d32f2f;
  --theme-primary-dark: #b71c1c;
  --theme-secondary: #1976d2;
  --theme-accent: #ffebee;
  
  /* Typography adjustments */
  --theme-font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  --theme-font-size-base: 18px;
  
  /* Spacing adjustments */
  --theme-spacing-unit: 10px;
  --theme-border-radius: 8px;
  
  /* Shadows */
  --theme-shadow-small: 0 2px 4px rgba(0, 0, 0, 0.1);
  --theme-shadow-medium: 0 4px 8px rgba(0, 0, 0, 0.15);
  --theme-shadow-large: 0 8px 16px rgba(0, 0, 0, 0.2);
}
```

Import and apply the theme:

```jsx
// In your application root
import '../themes/brand-theme.css';

// Apply theme based on user preference or context
document.body.setAttribute('data-theme', 'brand');
```

## Component-Specific Theming

### Button Theming

Buttons can be themed individually by overriding component-specific CSS variables:

```css
.custom-button {
  --button-primary-bg: var(--theme-accent);
  --button-primary-hover: var(--theme-secondary);
  --button-primary-text: var(--theme-text-primary);
  --button-border-radius: 12px;
}
```

### Input Theming

Form inputs can be customized with specific variables:

```css
.custom-input {
  --input-bg: var(--theme-background-alt);
  --input-border: var(--theme-border-light);
  --input-focus-border: var(--theme-primary);
  --input-border-radius: 4px;
  --input-padding: calc(var(--theme-spacing-unit) * 1.5);
}
```

### Modal Theming

Modals support theming of overlay and content areas:

```css
.custom-modal {
  --modal-overlay-bg: rgba(0, 0, 0, 0.7);
  --modal-content-bg: var(--theme-surface);
  --modal-border-radius: 12px;
  --modal-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}
```

## Runtime Theme Switching

Themes can be switched dynamically using JavaScript:

```javascript
// Theme switcher function
function switchTheme(themeName) {
  // Remove existing theme
  document.body.removeAttribute('data-theme');
  
  // Apply new theme if specified
  if (themeName) {
    document.body.setAttribute('data-theme', themeName);
  }
  
  // Store theme preference
  localStorage.setItem('theme', themeName);
}

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  switchTheme(savedTheme);
}

// Theme switcher component
function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('theme') || 'default');
  
  const handleThemeChange = (theme) => {
    switchTheme(theme);
    setCurrentTheme(theme);
  };
  
  return (
    <select value={currentTheme} onChange={(e) => handleThemeChange(e.target.value)}>
      <option value="">Default</option>
      <option value="dark">Dark</option>
      <option value="brand">Brand</option>
    </select>
  );
}
```

## Theme Context Integration

For React applications, create a theme context for easier theme management:

```jsx
// ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('default');
  
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'default';
    setTheme(savedTheme);
    document.body.setAttribute('data-theme', savedTheme);
  }, []);
  
  const updateTheme = (newTheme) => {
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
```

Wrap your application with the theme provider:

```jsx
// App.jsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* Application components */}
    </ThemeProvider>
  );
}
```

## Theme Variables Reference

### Color Variables
- `--theme-primary` - Main brand color
- `--theme-primary-dark` - Darker variant for hover states
- `--theme-secondary` - Secondary accent color
- `--theme-accent` - Background accent color
- `--theme-success` - Success state color
- `--theme-warning` - Warning state color
- `--theme-error` - Error state color
- `--theme-info` - Informational state color

### Background Variables
- `--theme-background` - Main background color
- `--theme-background-alt` - Alternative background color
- `--theme-surface` - Surface/card background color

### Text Variables
- `--theme-text-primary` - Primary text color
- `--theme-text-secondary` - Secondary text color
- `--theme-text-disabled` - Disabled text color

### Border Variables
- `--theme-border` - Default border color
- `--theme-border-light` - Light border color

### Typography Variables
- `--theme-font-family` - Font family stack
- `--theme-font-size-base` - Base font size
- `--theme-line-height-base` - Base line height

### Spacing Variables
- `--theme-spacing-unit` - Base spacing unit (8px grid)
- `--theme-border-radius` - Default border radius

### Shadow Variables
- `--theme-shadow-small` - Small elevation shadow
- `--theme-shadow-medium` - Medium elevation shadow
- `--theme-shadow-large` - Large elevation shadow

## Component Theme Integration

### Button Component
```css
/* Button theming variables */
.button {
  background-color: var(--button-bg, var(--theme-primary));
  color: var(--button-text, var(--theme-background));
  border-radius: var(--button-border-radius, var(--theme-border-radius));
  border: var(--button-border, none);
  padding: var(--button-padding, calc(var(--theme-spacing-unit) * 1.25) calc(var(--theme-spacing-unit) * 2));
  
  &:hover {
    background-color: var(--button-hover-bg, var(--theme-primary-dark));
  }
  
  &:disabled {
    background-color: var(--button-disabled-bg, var(--theme-text-disabled));
    cursor: not-allowed;
  }
}
```

### Input Component
```css
/* Input theming variables */
.input {
  background-color: var(--input-bg, var(--theme-background));
  color: var(--input-text, var(--theme-text-primary));
  border: var(--input-border, 1px solid var(--theme-border));
  border-radius: var(--input-border-radius, var(--theme-border-radius));
  padding: var(--input-padding, var(--theme-spacing-unit));
  
  &:focus {
    border-color: var(--input-focus-border, var(--theme-primary));
    outline: var(--input-focus-outline, 2px solid var(--theme-primary));
  }
  
  &::placeholder {
    color: var(--input-placeholder, var(--theme-text-secondary));
  }
}
```

### Modal Component
```css
/* Modal theming variables */
.modal-overlay {
  background-color: var(--modal-overlay-bg, rgba(0, 0, 0, 0.5));
}

.modal-content {
  background-color: var(--modal-content-bg, var(--theme-surface));
  border-radius: var(--modal-border-radius, var(--theme-border-radius));
  box-shadow: var(--modal-shadow, var(--theme-shadow-medium));
}
```

## Best Practices

### 1. Progressive Enhancement
Start with default theme variables and progressively enhance with theme overrides:

```css
/* Good: Start with defaults */
.button {
  background-color: var(--theme-primary);
}

/* Better: Provide fallbacks */
.button {
  background-color: var(--button-bg, var(--theme-primary, #002e4c));
}
```

### 2. Semantic Variable Names
Use semantic names that describe the purpose rather than specific colors:

```css
/* Good: Semantic names */
--theme-primary
--theme-secondary

/* Better: Contextual semantic names */
--button-primary-bg
--form-input-border
```

### 3. Consistent Units
Use consistent units throughout your theme system:

```css
/* Good: Consistent rem units */
--theme-font-size-base: 1rem;
--theme-spacing-unit: 0.5rem;

/* Better: CSS custom properties for calculations */
--theme-font-size-base: 1rem;
--theme-spacing-unit: 0.5rem;
--theme-spacing-large: calc(var(--theme-spacing-unit) * 2);
```

### 4. Accessibility Considerations
Ensure themes maintain accessibility standards:

```css
/* Test for sufficient contrast */
[data-theme="dark"] {
  --theme-text-primary: #ffffff; /* Verify 4.5:1 contrast with background */
  --theme-primary: #4a90e2; /* Verify 3:1 contrast with adjacent colors */
}
```

### 5. Performance Optimization
Minimize theme complexity to maintain performance:

```css
/* Avoid complex calculations in theme variables */
/* Bad: Complex calculation */
--theme-spacing-large: calc(var(--theme-spacing-unit) * 1.5 + 2px);

/* Good: Pre-calculated values */
--theme-spacing-unit: 0.5rem;
--theme-spacing-large: 1rem;
```

## Theme Testing

### Visual Regression Testing
Use tools like Chromatic or Percy to test themes:

```javascript
// Test different themes
describe('Button Component', () => {
  it('should render correctly in default theme', () => {
    cy.visit('/?theme=default');
    cy.get('[data-testid="button"]').compareSnapshot('button-default');
  });
  
  it('should render correctly in dark theme', () => {
    cy.visit('/?theme=dark');
    cy.get('[data-testid="button"]').compareSnapshot('button-dark');
  });
});
```

### Accessibility Testing
Ensure themes meet accessibility standards:

```javascript
// Test color contrast
it('should meet color contrast requirements', () => {
  cy.visit('/?theme=dark');
  cy.get('[data-testid="button"]').should(($el) => {
    const bgColor = $el.css('background-color');
    const textColor = $el.css('color');
    expect(isAccessible(bgColor, textColor)).to.be.true;
  });
});
```

## Migration Guide

### From Inline Styles to Theme Variables
Convert hardcoded values to theme variables:

```css
/* Before: Hardcoded values */
.button {
  background-color: #002e4c;
  border-radius: 6px;
  padding: 10px 20px;
}

/* After: Theme variables */
.button {
  background-color: var(--theme-primary);
  border-radius: var(--theme-border-radius);
  padding: calc(var(--theme-spacing-unit) * 1.25) calc(var(--theme-spacing-unit) * 2.5);
}
```

### From CSS Modules to Theme Variables
Migrate CSS module variables to theme variables:

```css
/* Before: CSS Module variables */
@value primary-color from '../../styles/variables.css';
.button {
  background-color: primary-color;
}

/* After: Theme variables */
.button {
  background-color: var(--theme-primary);
}
```

## Conclusion

The ProLine Hub theme system provides a flexible and maintainable approach to component customization. By using CSS custom properties and following established patterns, teams can create consistent, accessible, and performant themes that enhance the user experience while maintaining brand identity.