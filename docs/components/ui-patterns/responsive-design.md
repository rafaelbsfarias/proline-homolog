# Responsive Design Principles

This document outlines the responsive design principles and implementation guidelines for the ProLine Hub application, ensuring consistent and accessible experiences across all device sizes.

## Design Philosophy

The ProLine Hub follows a mobile-first design philosophy with progressive enhancement for larger screens. This approach ensures that critical functionality is available on all devices while providing enhanced experiences on capable devices.

### Mobile-First Approach

Starting with mobile constraints forces us to focus on essential features and content hierarchy:

1. **Content Priority**: Determine what's most important for users on small screens
2. **Touch Targets**: Ensure all interactive elements are easily tappable
3. **Performance**: Optimize for slower connections and limited processing power
4. **Bandwidth**: Minimize data usage and optimize asset loading

### Progressive Enhancement

As screen real estate increases, we progressively enhance the user experience:

1. **Layout Adjustments**: Change from vertical stacking to horizontal arrangements
2. **Content Expansion**: Show additional information and features
3. **Interaction Sophistication**: Add keyboard shortcuts, hover states, and advanced interactions
4. **Visual Polish**: Enhance typography, imagery, and animations

## Breakpoints

Our breakpoint system is designed to accommodate real-world device sizes rather than arbitrary measurements:

### Standard Breakpoints

| Name | Size | Media Query | Usage |
|------|------|-------------|-------|
| Mobile | 0px - 768px | `@media (max-width: 768px)` | Small phones, portrait tablets |
| Tablet | 769px - 1024px | `@media (min-width: 769px) and (max-width: 1024px)` | Landscape tablets, small laptops |
| Desktop | 1025px - 1440px | `@media (min-width: 1025px) and (max-width: 1440px)` | Standard desktop monitors |
| Large Desktop | 1441px+ | `@media (min-width: 1441px)` | Large screens, ultra-wide monitors |

### Semantic Breakpoint Names

For better maintainability, we use semantic breakpoint names in SCSS variables:

```scss
// Breakpoint variables
$breakpoint-mobile: 768px;
$breakpoint-tablet: 1024px;
$breakpoint-desktop: 1440px;

// Breakpoint mixins
@mixin mobile {
  @media (max-width: #{$breakpoint-mobile}) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: #{$breakpoint-mobile + 1}) and (max-width: #{$breakpoint-tablet}) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: #{$breakpoint-tablet + 1}) and (max-width: #{$breakpoint-desktop}) {
    @content;
  }
}

@mixin large-desktop {
  @media (min-width: #{$breakpoint-desktop + 1}) {
    @content;
  }
}
```

## Grid System

### 12-Column Grid

The ProLine Hub uses a 12-column flexible grid system with consistent gutters:

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(12, 1fr);
}

.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
.col-span-3 { grid-column: span 3; }
.col-span-4 { grid-column: span 4; }
.col-span-5 { grid-column: span 5; }
.col-span-6 { grid-column: span 6; }
.col-span-7 { grid-column: span 7; }
.col-span-8 { grid-column: span 8; }
.col-span-9 { grid-column: span 9; }
.col-span-10 { grid-column: span 10; }
.col-span-11 { grid-column: span 11; }
.col-span-12 { grid-column: span 12; }
```

### Responsive Column Spans

Columns adjust based on viewport size:

```css
/* Mobile-first approach */
.col-span-full { grid-column: span 12; }

/* Tablet and up */
@media (min-width: 769px) {
  .col-span-md-6 { grid-column: span 6; }
  .col-span-md-4 { grid-column: span 4; }
  .col-span-md-8 { grid-column: span 8; }
}

/* Desktop and up */
@media (min-width: 1025px) {
  .col-span-lg-3 { grid-column: span 3; }
  .col-span-lg-9 { grid-column: span 9; }
}
```

## Typography Scaling

Typography should scale appropriately across device sizes to maintain readability and hierarchy:

### Base Font Sizes

| Device | Base Font Size | Line Height |
|--------|----------------|-------------|
| Mobile | 16px | 1.5 |
| Tablet | 17px | 1.5 |
| Desktop | 18px | 1.5 |
| Large Desktop | 19px | 1.5 |

### Heading Hierarchy

Headings scale appropriately for different viewports:

```css
/* Base heading styles */
.h1 { font-size: 2rem; font-weight: 600; line-height: 1.2; margin-bottom: 1rem; }
.h2 { font-size: 1.75rem; font-weight: 600; line-height: 1.3; margin-bottom: 0.875rem; }
.h3 { font-size: 1.5rem; font-weight: 600; line-height: 1.35; margin-bottom: 0.75rem; }
.h4 { font-size: 1.25rem; font-weight: 600; line-height: 1.4; margin-bottom: 0.625rem; }
.h5 { font-size: 1.125rem; font-weight: 600; line-height: 1.45; margin-bottom: 0.5rem; }
.h6 { font-size: 1rem; font-weight: 600; line-height: 1.5; margin-bottom: 0.5rem; }

/* Responsive heading scaling */
@media (min-width: 769px) {
  .h1 { font-size: 2.25rem; }
  .h2 { font-size: 2rem; }
  .h3 { font-size: 1.75rem; }
}

@media (min-width: 1025px) {
  .h1 { font-size: 2.5rem; }
  .h2 { font-size: 2.125rem; }
  .h3 { font-size: 1.875rem; }
}
```

## Layout Patterns

### Card-Based Layouts

Cards are the primary layout component and should adapt gracefully:

```css
.card-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.card {
  background: var(--theme-surface);
  border-radius: var(--theme-border-radius);
  box-shadow: var(--theme-shadow-small);
  padding: 24px;
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: var(--theme-shadow-medium);
}

@media (max-width: 768px) {
  .card-grid {
    gap: 16px;
  }
  
  .card {
    padding: 20px;
  }
}
```

### Sidebar Layouts

Sidebar layouts should collapse appropriately on mobile:

```css
.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.sidebar {
  background: var(--theme-background-alt);
  border-radius: var(--theme-border-radius);
  padding: 24px;
}

@media (min-width: 1025px) {
  .layout {
    grid-template-columns: 1fr 300px;
  }
  
  .sidebar {
    grid-column: 2;
    grid-row: 1;
  }
}
```

## Navigation Patterns

### Responsive Navigation

Navigation should adapt from hamburger menu to full navigation bar:

```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--theme-primary);
  color: var(--theme-background);
}

.nav-menu {
  display: none;
  flex-direction: column;
  background: var(--theme-primary);
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px;
  z-index: 100;
}

.nav-menu.active {
  display: flex;
}

.nav-toggle {
  display: block;
  background: none;
  border: none;
  color: var(--theme-background);
  font-size: 1.5rem;
  cursor: pointer;
}

@media (min-width: 769px) {
  .nav-menu {
    display: flex;
    flex-direction: row;
    position: static;
    background: none;
    padding: 0;
    gap: 24px;
  }
  
  .nav-toggle {
    display: none;
  }
}
```

### Tab Navigation

Tabs should stack vertically on mobile and horizontally on larger screens:

```css
.tabs {
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--theme-border-light);
}

.tab-list {
  display: flex;
  flex-direction: column;
  list-style: none;
}

.tab {
  padding: 16px;
  border-bottom: 1px solid var(--theme-border-light);
  cursor: pointer;
}

.tab.active {
  background: var(--theme-accent);
  font-weight: 600;
}

.tab-panel {
  padding: 24px 0;
}

@media (min-width: 769px) {
  .tabs {
    flex-direction: row;
  }
  
  .tab-list {
    flex-direction: row;
    border-bottom: 1px solid var(--theme-border-light);
  }
  
  .tab {
    border-bottom: none;
    border-right: 1px solid var(--theme-border-light);
    padding: 16px 24px;
  }
  
  .tab:last-child {
    border-right: none;
  }
  
  .tab-panel {
    padding: 24px;
  }
}
```

## Form Patterns

### Responsive Form Layouts

Forms should stack vertically on mobile and use grid layouts on larger screens:

```css
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 12px;
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-border-radius);
}

@media (min-width: 769px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .form-group.full-width {
    grid-column: span 2;
  }
}
```

### Input Field Adaptations

Input fields should adjust for touch targets on mobile:

```css
.input-field {
  min-height: 48px; /* Touch target for mobile */
  padding: 12px 16px;
  font-size: 1rem;
}

@media (min-width: 769px) {
  .input-field {
    min-height: 40px; /* Smaller target for desktop */
    padding: 8px 12px;
    font-size: 0.875rem;
  }
}
```

## Image and Media Handling

### Responsive Images

Images should scale appropriately and load optimized versions:

```css
.responsive-image {
  max-width: 100%;
  height: auto;
  display: block;
}

@media (max-width: 768px) {
  .responsive-image {
    width: 100%;
    height: auto;
  }
}

/* Art direction for different aspect ratios */
.hero-image {
  aspect-ratio: 16/9;
  object-fit: cover;
}

@media (max-width: 768px) {
  .hero-image {
    aspect-ratio: 4/3;
  }
}
```

### Video Embeds

Videos should maintain aspect ratios and be responsive:

```css
.video-container {
  position: relative;
  padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  height: 0;
  overflow: hidden;
}

.video-container iframe,
.video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
```

## Component-Specific Adaptations

### Button Variations

Buttons should adapt for different contexts:

```css
.button {
  padding: 12px 24px;
  font-size: 1rem;
  min-height: 48px; /* Touch target */
}

@media (min-width: 769px) {
  .button {
    padding: 10px 20px;
    font-size: 0.875rem;
    min-height: 40px;
  }
}

/* Block buttons on mobile */
@media (max-width: 768px) {
  .button.block-mobile {
    width: 100%;
    margin-bottom: 16px;
  }
}
```

### Table Adaptations

Tables should scroll horizontally on mobile and expand on larger screens:

```css
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--theme-border-light);
}

@media (max-width: 768px) {
  .table th,
  .table td {
    padding: 8px 12px;
    font-size: 0.875rem;
  }
}
```

## Performance Considerations

### Conditional Loading

Load different assets based on viewport:

```css
/* Load different background images */
.hero-section {
  background-image: url('/images/hero-mobile.jpg');
  background-size: cover;
  background-position: center;
}

@media (min-width: 769px) {
  .hero-section {
    background-image: url('/images/hero-desktop.jpg');
  }
}
```

### Lazy Loading

Implement lazy loading for below-the-fold content:

```javascript
const LazyImage = ({ src, alt, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      }
    );
    
    // Observe the element
    // ...
    
    return () => observer.disconnect();
  }, []);
  
  return isVisible ? (
    <img src={src} alt={alt} {...props} />
  ) : (
    <div className="placeholder" style={{ height: '200px' }} />
  );
};
```

## Testing and Validation

### Device Testing Matrix

Test on representative devices in each category:

| Device Category | Screen Size | Resolution | Browser |
|-----------------|-------------|------------|----------|
| Small Phone | 320x568 | iPhone SE | Safari |
| Medium Phone | 375x667 | iPhone 8 | Safari |
| Large Phone | 414x896 | iPhone 11 Pro Max | Safari |
| Tablet Portrait | 768x1024 | iPad | Safari |
| Tablet Landscape | 1024x768 | iPad | Safari |
| Small Desktop | 1280x800 | Laptop | Chrome |
| Medium Desktop | 1440x900 | Desktop | Firefox |
| Large Desktop | 1920x1080 | Desktop | Edge |

### Performance Benchmarks

Set performance targets for different viewports:

```javascript
// Performance monitoring
const performanceTargets = {
  mobile: {
    firstContentfulPaint: 2000, // ms
    largestContentfulPaint: 3000, // ms
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 100 // ms
  },
  desktop: {
    firstContentfulPaint: 1800, // ms
    largestContentfulPaint: 2500, // ms
    cumulativeLayoutShift: 0.1,
    firstInputDelay: 50 // ms
  }
};
```

## Implementation Guidelines

### CSS Best Practices

1. **Mobile-First Media Queries**:
```css
/* Good: Mobile-first approach */
.component {
  /* Mobile styles */
}

@media (min-width: 769px) {
  .component {
    /* Tablet/desktop enhancements */
  }
}
```

2. **Component-Level Scoping**:
```css
/* Good: Component-specific styles */
.vehicle-card {
  padding: 24px;
}

.vehicle-card .vehicle-image {
  width: 100%;
  height: auto;
}

@media (min-width: 769px) {
  .vehicle-card {
    display: flex;
    gap: 24px;
  }
  
  .vehicle-card .vehicle-image {
    width: 300px;
    height: 200px;
    object-fit: cover;
  }
}
```

### JavaScript Considerations

1. **Viewport Detection**:
```javascript
const useBreakpoint = () => {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return {
    isMobile: width <= 768,
    isTablet: width > 768 && width <= 1024,
    isDesktop: width > 1024
  };
};
```

2. **Conditional Rendering**:
```javascript
const ResponsiveComponent = () => {
  const { isMobile, isTablet } = useBreakpoint();
  
  return (
    <div className="responsive-component">
      {isMobile ? (
        <MobileView />
      ) : isTablet ? (
        <TableView />
      ) : (
        <DesktopView />
      )}
    </div>
  );
};
```

## Accessibility at Different Viewports

### Focus Management

Ensure focus is properly managed across viewport changes:

```javascript
const FocusTrap = ({ active, children }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!active) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        // Trap focus within the container
        trapFocus(containerRef.current, e.shiftKey);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active]);
  
  return (
    <div ref={containerRef} tabIndex="-1">
      {children}
    </div>
  );
};
```

### Screen Reader Adaptations

Adjust screen reader content based on viewport:

```javascript
const ResponsiveContent = ({ title, mobileTitle }) => {
  const { isMobile } = useBreakpoint();
  
  const screenReaderTitle = isMobile && mobileTitle ? mobileTitle : title;
  
  return (
    <h1>
      {screenReaderTitle}
      <span className="sr-only">
        {isMobile ? 'Mobile view' : 'Desktop view'}
      </span>
    </h1>
  );
};
```

## Conclusion

Responsive design in the ProLine Hub should prioritize user needs across all device sizes while maintaining consistency with the design system. By following these principles and patterns, we ensure that users have excellent experiences regardless of how they access the application.

Key takeaways:
1. **Mobile-first approach** ensures core functionality works everywhere
2. **Progressive enhancement** provides richer experiences on capable devices
3. **Consistent breakpoints** create predictable layout behavior
4. **Performance considerations** maintain fast experiences on all networks
5. **Accessibility compliance** ensures everyone can use the application effectively

Regular testing across different devices and viewport sizes will help maintain these standards and identify opportunities for improvement.