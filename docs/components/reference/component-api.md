# Component API Reference

This document provides a comprehensive reference for all components in the ProLine Hub component library, including props, methods, and usage examples.

## Button Components

### SolidButton

A primary action button with solid background.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | - | Button content (text, icons, etc.) |
| `onClick` | `MouseEventHandler<HTMLButtonElement>` | No | - | Click handler function |
| `type` | `'button' \| 'submit' \| 'reset'` | No | `'button'` | Button type attribute |
| `disabled` | `boolean` | No | `false` | Disable button interactions |
| `size` | `'small' \| 'medium' \| 'large'` | No | `'medium'` | Button size preset |
| `icon` | `ReactNode` | No | - | Icon to display before button text |
| `iconPosition` | `'left' \| 'right'` | No | `'left'` | Position of icon relative to text |
| `fullWidth` | `boolean` | No | `false` | Make button fill container width |
| `loading` | `boolean` | No | `false` | Show loading spinner instead of content |
| `ariaLabel` | `string` | No | - | Accessible label for screen readers |
| `className` | `string` | No | - | Additional CSS classes |
| `...rest` | `ButtonHTMLAttributes<HTMLButtonElement>` | No | - | Any other valid button attributes |

#### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--button-bg` | `var(--theme-primary)` | Background color |
| `--button-text` | `white` | Text color |
| `--button-hover-bg` | `var(--theme-primary-dark)` | Background on hover |
| `--button-border-radius` | `var(--theme-border-radius)` | Border radius |
| `--button-padding` | `12px 24px` | Padding (varies by size) |
| `--button-font-weight` | `500` | Font weight |

#### Usage Examples

```jsx
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';

// Basic button
<SolidButton onClick={handleSubmit}>
  Save Changes
</SolidButton>

// Button with icon
<SolidButton icon={<SaveIcon />} iconPosition="left">
  Save
</SolidButton>

// Loading state
<SolidButton loading={isSaving}>
  {isSaving ? 'Saving...' : 'Save'}
</SolidButton>

// Disabled button
<SolidButton disabled>
  Coming Soon
</SolidButton>

// Full width button
<SolidButton fullWidth>
  Continue
</SolidButton>

// Small button
<SolidButton size="small">
  Small Action
</SolidButton>
```

#### Styling

```css
.solid-button {
  /* Base styles */
  padding: 12px 24px;
  border-radius: 6px;
  border: none;
  background: var(--theme-primary);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  /* Hover state */
  &:hover:not(:disabled) {
    background: var(--theme-primary-dark);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  /* Disabled state */
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  /* Focus state */
  &:focus-visible {
    outline: 2px solid var(--theme-primary);
    outline-offset: 2px;
  }
  
  /* Loading state */
  &.loading {
    cursor: wait;
  }
}
```

### OutlineButton

A secondary action button with outline styling.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | - | Button content (text, icons, etc.) |
| `onClick` | `MouseEventHandler<HTMLButtonElement>` | No | - | Click handler function |
| `type` | `'button' \| 'submit' \| 'reset'` | No | `'button'` | Button type attribute |
| `disabled` | `boolean` | No | `false` | Disable button interactions |
| `size` | `'small' \| 'medium' \| 'large'` | No | `'medium'` | Button size preset |
| `icon` | `ReactNode` | No | - | Icon to display before button text |
| `iconPosition` | `'left' \| 'right'` | No | `'left'` | Position of icon relative to text |
| `fullWidth` | `boolean` | No | `false` | Make button fill container width |
| `loading` | `boolean` | No | `false` | Show loading spinner instead of content |
| `ariaLabel` | `string` | No | - | Accessible label for screen readers |
| `className` | `string` | No | - | Additional CSS classes |
| `...rest` | `ButtonHTMLAttributes<HTMLButtonElement>` | No | - | Any other valid button attributes |

#### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--button-outline-bg` | `transparent` | Background color |
| `--button-outline-text` | `var(--theme-primary)` | Text color |
| `--button-outline-hover-bg` | `var(--theme-accent)` | Background on hover |
| `--button-outline-border` | `var(--theme-primary)` | Border color |
| `--button-outline-border-radius` | `var(--theme-border-radius)` | Border radius |
| `--button-outline-padding` | `10px 20px` | Padding (varies by size) |
| `--button-outline-font-weight` | `500` | Font weight |

#### Usage Examples

```jsx
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';

// Basic outline button
<OutlineButton onClick={handleCancel}>
  Cancel
</OutlineButton>

// Button with icon
<OutlineButton icon={<CancelIcon />} iconPosition="left">
  Cancel
</OutlineButton>

// Loading state
<OutlineButton loading={isCancelling}>
  {isCancelling ? 'Cancelling...' : 'Cancel'}
</OutlineButton>

// Disabled button
<OutlineButton disabled>
  Disabled Action
</OutlineButton>

// Full width button
<OutlineButton fullWidth>
  View Details
</OutlineButton>

// Small button
<OutlineButton size="small">
  Small Action
</OutlineButton>
```

#### Styling

```css
.outline-button {
  /* Base styles */
  padding: 10px 20px;
  border: 1px solid var(--theme-primary);
  border-radius: 6px;
  background: transparent;
  color: var(--theme-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  /* Hover state */
  &:hover:not(:disabled) {
    background: var(--theme-accent);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  /* Disabled state */
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
    color: #666;
  }
  
  /* Focus state */
  &:focus-visible {
    outline: 2px solid var(--theme-primary);
    outline-offset: 2px;
  }
  
  /* Loading state */
  &.loading {
    cursor: wait;
  }
}
```

## Form Components

### Input

A versatile form input component with validation and masking support.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `id` | `string` | Yes | - | Unique identifier for the input |
| `name` | `string` | Yes | - | Name attribute for form submission |
| `label` | `string` | Yes | - | Label text for the input |
| `type` | `'text' \| 'password' \| 'email' \| 'tel'` | No | `'text'` | Input type |
| `value` | `string` | Yes | - | Current value of the input |
| `onChange` | `ChangeEventHandler<HTMLInputElement>` | Yes | - | Value change handler |
| `onBlur` | `FocusEventHandler<HTMLInputElement>` | No | - | Blur handler |
| `disabled` | `boolean` | No | `false` | Disable input interactions |
| `placeholder` | `string` | No | - | Placeholder text |
| `required` | `boolean` | No | `false` | Mark as required field |
| `className` | `string` | No | - | Additional CSS classes |
| `mask` | `any` | No | - | IMask mask configuration |
| `onAccept` | `(value: any, maskRef: any) => void` | No | - | Mask acceptance callback |
| `error` | `string` | No | - | Error message to display |
| `helperText` | `string` | No | - | Helper text to display below input |
| `fullWidth` | `boolean` | No | `false` | Make input fill container width |
| `...rest` | `InputHTMLAttributes<HTMLInputElement>` | No | - | Any other valid input attributes |

#### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--input-bg` | `var(--theme-background)` | Background color |
| `--input-text` | `var(--theme-text-primary)` | Text color |
| `--input-border` | `1px solid var(--theme-border)` | Border style |
| `--input-border-radius` | `var(--theme-border-radius)` | Border radius |
| `--input-padding` | `12px 16px` | Padding |
| `--input-focus-border` | `2px solid var(--theme-primary)` | Focus border |
| `--input-error-border` | `2px solid var(--theme-error)` | Error state border |
| `--input-disabled-bg` | `var(--theme-background-alt)` | Disabled state background |

#### Usage Examples

```jsx
import Input from '@/modules/common/components/Input/Input';

// Basic text input
<Input
  id="fullName"
  name="fullName"
  label="Full Name"
  value={formData.fullName}
  onChange={handleChange}
  required
/>

// Email input with validation
<Input
  id="email"
  name="email"
  label="Email Address"
  type="email"
  value={formData.email}
  onChange={handleChange}
  error={errors.email}
  helperText="Please enter a valid email address"
/>

// Password input with visibility toggle
<Input
  id="password"
  name="password"
  label="Password"
  type="password"
  value={formData.password}
  onChange={handleChange}
/>

// Phone input with mask
<Input
  id="phone"
  name="phone"
  label="Phone Number"
  type="tel"
  value={formData.phone}
  onChange={handleChange}
  mask="(00) 00000-0000"
  placeholder="(00) 00000-0000"
/>

// Disabled input
<Input
  id="companyId"
  name="companyId"
  label="Company ID"
  value={formData.companyId}
  onChange={handleChange}
  disabled
/>

// Input with error state
<Input
  id="cnpj"
  name="cnpj"
  label="CNPJ"
  value={formData.cnpj}
  onChange={handleChange}
  error={errors.cnpj}
  mask="00.000.000/0000-00"
/>
```

#### Styling

```css
.input-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
}

.input-label {
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.input-field {
  padding: 12px 16px;
  border: 1px solid var(--theme-border);
  border-radius: 6px;
  background: var(--theme-background);
  color: var(--theme-text-primary);
  font-size: 1rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: var(--theme-primary);
    box-shadow: 0 0 0 2px rgba(25, 119, 242, 0.2);
  }
  
  &:disabled {
    background: var(--theme-background-alt);
    cursor: not-allowed;
  }
  
  &.error {
    border-color: var(--theme-error);
    background: rgba(244, 67, 54, 0.05);
  }
}

.input-helper {
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

.input-error {
  margin-top: 8px;
  font-size: 0.875rem;
  color: var(--theme-error);
  font-weight: 500;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--theme-text-secondary);
  
  &:hover {
    color: var(--theme-text-primary);
  }
}
```

## Modal Components

### Modal

A flexible modal component for dialogs and overlays.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | `false` | Control modal visibility |
| `onClose` | `() => void` | Yes | - | Handler for closing the modal |
| `title` | `string` | Yes | - | Modal title text |
| `subtitle` | `string` | No | - | Modal subtitle text |
| `children` | `ReactNode` | Yes | - | Modal content |
| `width` | `string` | No | `'400px'` | Modal width |
| `height` | `string` | No | `'auto'` | Modal height |
| `showCloseButton` | `boolean` | No | `true` | Show/hide close button |
| `closeOnOverlayClick` | `boolean` | No | `true` | Close when clicking overlay |
| `closeOnEscape` | `boolean` | No | `true` | Close when pressing Escape key |
| `ariaLabelledBy` | `string` | No | - | ID of element that labels the modal |
| `ariaDescribedBy` | `string` | No | - | ID of element that describes the modal |

#### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--modal-overlay-bg` | `rgba(0, 0, 0, 0.5)` | Overlay background |
| `--modal-content-bg` | `var(--theme-surface)` | Modal content background |
| `--modal-border-radius` | `12px` | Modal border radius |
| `--modal-shadow` | `var(--theme-shadow-large)` | Modal box shadow |
| `--modal-max-width` | `90vw` | Maximum modal width |
| `--modal-max-height` | `90vh` | Maximum modal height |

#### Usage Examples

```jsx
import Modal from '@/modules/common/components/Modal/Modal';

// Basic modal
<Modal
  isOpen={isModalOpen}
  onClose={closeModal}
  title="Confirm Action"
>
  <p>Are you sure you want to proceed?</p>
  <div className="modal-actions">
    <OutlineButton onClick={closeModal}>
      Cancel
    </OutlineButton>
    <SolidButton onClick={handleConfirm}>
      Confirm
    </SolidButton>
  </div>
</Modal>

// Modal with subtitle
<Modal
  isOpen={isEditModalOpen}
  onClose={closeEditModal}
  title="Edit Service"
  subtitle="Update your service information"
  width="600px"
>
  <ServiceForm
    service={editingService}
    onSubmit={handleServiceUpdate}
    onCancel={closeEditModal}
  />
</Modal>

// Modal without close button
<Modal
  isOpen={isLoadingModalOpen}
  onClose={closeLoadingModal}
  title="Processing"
  showCloseButton={false}
  closeOnOverlayClick={false}
  closeOnEscape={false}
>
  <div className="loading-content">
    <Spinner size="large" />
    <p>Processing your request...</p>
  </div>
</Modal>
```

#### Styling

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal-content {
  background: var(--theme-surface);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid var(--theme-border-light);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--theme-text-primary);
}

.modal-subtitle {
  font-size: 1rem;
  color: var(--theme-text-secondary);
  margin: 0;
}

.modal-close-button {
  position: absolute;
  top: 24px;
  right: 24px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--theme-text-secondary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:hover {
    background: var(--theme-background-alt);
    color: var(--theme-text-primary);
  }
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px 24px 24px;
  border-top: 1px solid var(--theme-border-light);
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}
```

## Utility Components

### LoadingSpinner

A loading indicator component with various sizes and styles.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | No | `'medium'` | Spinner size |
| `color` | `string` | No | `var(--theme-primary)` | Spinner color |
| `message` | `string` | No | - | Optional loading message |
| `fullScreen` | `boolean` | No | `false` | Cover entire screen |
| `className` | `string` | No | - | Additional CSS classes |

#### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--spinner-color` | `var(--theme-primary)` | Spinner color |
| `--spinner-size-small` | `16px` | Small spinner size |
| `--spinner-size-medium` | `24px` | Medium spinner size |
| `--spinner-size-large` | `48px` | Large spinner size |

#### Usage Examples

```jsx
import LoadingSpinner from '@/modules/common/components/LoadingSpinner/LoadingSpinner';

// Basic spinner
<LoadingSpinner />

// Small spinner with message
<LoadingSpinner size="small" message="Loading..." />

// Large spinner
<LoadingSpinner size="large" />

// Full screen spinner
<LoadingSpinner fullScreen message="Please wait while we load your data..." />

// Custom colored spinner
<LoadingSpinner color="#ff9800" size="large" />
```

#### Styling

```css
.loading-spinner {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.spinner {
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top: 2px solid var(--spinner-color, var(--theme-primary));
  border-radius: 50%;
  width: var(--spinner-size-medium, 24px);
  height: var(--spinner-size-medium, 24px);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner-message {
  color: var(--theme-text-secondary);
  font-size: 0.875rem;
  text-align: center;
}

.spinner-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.spinner-small {
  --spinner-size-medium: var(--spinner-size-small, 16px);
}

.spinner-large {
  --spinner-size-medium: var(--spinner-size-large, 48px);
}
```

### ErrorMessage

A component for displaying error messages with consistent styling.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `message` | `string` | Yes | - | Error message text |
| `title` | `string` | No | `'Error'` | Error title |
| `onRetry` | `() => void` | No | - | Retry action handler |
| `retryText` | `string` | No | `'Try Again'` | Retry button text |
| `className` | `string` | No | - | Additional CSS classes |

#### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--error-bg` | `rgba(244, 67, 54, 0.1)` | Error background color |
| `--error-border` | `1px solid var(--theme-error)` | Error border |
| `--error-title-color` | `var(--theme-error)` | Error title color |
| `--error-message-color` | `var(--theme-text-primary)` | Error message color |

#### Usage Examples

```jsx
import ErrorMessage from '@/modules/common/components/ErrorMessage/ErrorMessage';

// Basic error message
<ErrorMessage message="Failed to load data. Please try again later." />

// Error with title and retry
<ErrorMessage
  title="Connection Failed"
  message="Unable to connect to the server. Please check your internet connection."
  onRetry={handleRetry}
  retryText="Retry Connection"
/>

// Error with custom styling
<ErrorMessage
  message="Invalid input provided"
  className="custom-error"
/>
```

#### Styling

```css
.error-message {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid var(--theme-error);
  border-radius: 6px;
  padding: 16px;
  margin: 16px 0;
}

.error-title {
  color: var(--theme-error);
  font-weight: 600;
  margin: 0 0 8px 0;
  font-size: 1.125rem;
}

.error-content {
  color: var(--theme-text-primary);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 12px;
}

.error-retry-button {
  background: var(--theme-error);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    background: #d32f2f;
  }
}
```

## Layout Components

### Card

A container component for grouping related content.

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | - | Card content |
| `title` | `string` | No | - | Card title |
| `subtitle` | `string` | No | - | Card subtitle |
| `actions` | `ReactNode` | No | - | Action buttons or controls |
| `variant` | `'outlined' \| 'elevated'` | No | `'elevated'` | Card style variant |
| `fullWidth` | `boolean` | No | `false` | Make card fill container width |
| `className` | `string` | No | - | Additional CSS classes |

#### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--card-bg` | `var(--theme-surface)` | Card background color |
| `--card-border` | `1px solid var(--theme-border-light)` | Card border |
| `--card-border-radius` | `var(--theme-border-radius)` | Card border radius |
| `--card-shadow` | `var(--theme-shadow-medium)` | Card box shadow |
| `--card-padding` | `24px` | Card padding |
| `--card-title-color` | `var(--theme-text-primary)` | Title text color |

#### Usage Examples

```jsx
import Card from '@/modules/common/components/Card/Card';

// Basic card
<Card title="Service Summary">
  <p>Total services: 5</p>
  <p>Total value: R$ 1,250.00</p>
</Card>

// Card with subtitle and actions
<Card
  title="Recent Activity"
  subtitle="Last 30 days"
  actions={
    <SolidButton size="small">
      View All
    </SolidButton>
  }
>
  <ActivityList activities={recentActivities} />
</Card>

// Outlined card variant
<Card
  title="Notifications"
  variant="outlined"
>
  <NotificationList notifications={notifications} />
</Card>

// Full width card
<Card
  title="Monthly Report"
  fullWidth
>
  <ReportChart data={monthlyData} />
</Card>
```

#### Styling

```css
.card {
  background: var(--theme-surface);
  border-radius: var(--theme-border-radius);
  box-shadow: var(--theme-shadow-medium);
  padding: 24px;
  transition: box-shadow 0.2s ease;
  
  &:hover {
    box-shadow: var(--theme-shadow-large);
  }
}

.card-outlined {
  background: transparent;
  border: 1px solid var(--theme-border-light);
  box-shadow: none;
  
  &:hover {
    box-shadow: var(--theme-shadow-small);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-title {
  margin: 0 0 8px 0;
  color: var(--theme-text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.card-subtitle {
  margin: 0;
  color: var(--theme-text-secondary);
  font-size: 0.875rem;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-content {
  /* Content styles */
}
```

## Best Practices

### 1. Component Composition

Build complex interfaces by composing simpler components:

```jsx
// Good: Compose simple components
const ServiceCard = ({ service, onEdit, onDelete }) => {
  return (
    <Card
      title={service.name}
      subtitle={service.category}
      actions={
        <>
          <OutlineButton size="small" onClick={onEdit}>
            Edit
          </OutlineButton>
          <SolidButton size="small" onClick={onDelete}>
            Delete
          </SolidButton>
        </>
      }
    >
      <div className="service-details">
        <p>{service.description}</p>
        <p className="service-price">R$ {service.price.toFixed(2)}</p>
      </div>
    </Card>
  );
};

// Bad: Monolithic component
const MonolithicServiceCard = ({ service, onEdit, onDelete }) => {
  // Complex implementation with all styling and logic in one component
};
```

### 2. Consistent Prop Patterns

Follow consistent prop patterns across components:

```jsx
// Good: Consistent prop patterns
<Button
  size="medium"
  variant="solid"
  fullWidth={false}
  loading={false}
  disabled={false}
>
  Click Me
</Button>

<Input
  size="medium"
  fullWidth={false}
  error={false}
  disabled={false}
  required={false}
>
  Enter Text
</Input>

// Bad: Inconsistent prop patterns
<Button
  size="medium"
  buttonVariant="solid" // Inconsistent naming
  full-width={true}      // Inconsistent naming
  isLoading={false}       // Inconsistent naming
  isDisabled={false}      // Inconsistent naming
>
  Click Me
</Button>
```

### 3. Accessibility

Ensure components are accessible by default:

```jsx
// Good: Accessible component
const AccessibleInput = ({ id, label, error, required, ...props }) => {
  return (
    <div className="input-container">
      <label htmlFor={id}>
        {label}
        {required && <span aria-label="required" className="required">*</span>}
      </label>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${id}-error`} className="error-message">
          {error}
        </span>
      )}
    </div>
  );
};

// Bad: Inaccessible component
const InaccessibleInput = ({ label, ...props }) => {
  return (
    <div>
      <label>{label}</label>
      <input {...props} />
      {/* No error association */}
    </div>
  );
};
```

### 4. Performance Optimization

Optimize components for performance:

```jsx
// Good: Memoized component
const OptimizedCard = memo(({ title, subtitle, children, actions }) => {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-section">
          <h3>{title}</h3>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="card-actions">{actions}</div>}
      </div>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
});

// Good: Lazy loading for heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

const ComponentWithLazyLoading = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
};
```

### 5. Responsive Design

Ensure components work well on all screen sizes:

```css
/* Good: Responsive component styling */
.responsive-card {
  padding: 24px;
  margin-bottom: 24px;
}

@media (max-width: 768px) {
  .responsive-card {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .responsive-card .card-title {
    font-size: 1.125rem;
  }
  
  .responsive-card .card-actions {
    flex-direction: column;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .responsive-card {
    padding: 12px;
  }
  
  .responsive-card .card-title {
    font-size: 1rem;
  }
}
```

## Testing Guidelines

### Unit Testing

Test component behavior and props:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SolidButton } from './SolidButton';

describe('SolidButton', () => {
  test('renders with correct text', () => {
    render(<SolidButton>Click Me</SolidButton>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  test('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    render(<SolidButton onClick={handleClick}>Click Me</SolidButton>);
    
    await userEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('is disabled when disabled prop is true', () => {
    render(<SolidButton disabled>Click Me</SolidButton>);
    expect(screen.getByText('Click Me')).toBeDisabled();
  });

  test('shows loading state when loading prop is true', () => {
    render(<SolidButton loading>Loading...</SolidButton>);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(<SolidButton className="custom-class">Click Me</SolidButton>);
    expect(screen.getByText('Click Me')).toHaveClass('custom-class');
  });
});
```

### Integration Testing

Test component interactions and workflows:

```javascript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormWithValidation from './FormWithValidation';

describe('FormWithValidation', () => {
  test('shows validation errors for required fields', async () => {
    render(<FormWithValidation />);
    
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    render(<FormWithValidation onSubmit={mockOnSubmit} />);
    
    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/email address/i), 'john@example.com');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        fullName: 'John Doe',
        email: 'john@example.com'
      });
    });
  });

  test('shows success message after submission', async () => {
    render(<FormWithValidation />);
    
    // Fill and submit form
    await userEvent.type(screen.getByLabelText(/full name/i), 'Jane Smith');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/form submitted successfully/i)).toBeInTheDocument();
    });
  });
});
```

## Conclusion

This API reference provides comprehensive documentation for all components in the ProLine Hub component library. By following the patterns and guidelines outlined in this document, developers can create consistent, accessible, and performant user interfaces that provide excellent experiences for all users.

Key takeaways:

1. **Consistency**: Use consistent prop patterns and styling across components
2. **Accessibility**: Ensure all components are accessible by default
3. **Performance**: Optimize components for fast rendering and interaction
4. **Responsiveness**: Design components to work well on all screen sizes
5. **Testing**: Write comprehensive tests for all component behaviors
6. **Documentation**: Keep component documentation up to date with implementation
7. **Composability**: Build complex interfaces by composing simpler components

Regular updates to this reference will help maintain consistency and quality across the component library.