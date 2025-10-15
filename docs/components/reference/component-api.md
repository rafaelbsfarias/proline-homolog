# Component API Reference

This document provides a comprehensive reference for all components in the ProLine Hub component library, including props, usage examples, and best practices.

## Button Components

### SolidButton

A primary action button with solid background and hover effects.

```jsx
import { SolidButton } from '@/modules/common/components/SolidButton/SolidButton';
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | - | Content to display inside the button |
| `onClick` | `MouseEventHandler<HTMLButtonElement>` | No | - | Click handler function |
| `type` | `"button" | "submit" | "reset"` | No | `"button"` | Button type attribute |
| `disabled` | `boolean` | No | `false` | Whether the button is disabled |
| `className` | `string` | No | `""` | Additional CSS classes to apply |
| `size` | `"small" | "medium" | "large"` | No | `"medium"` | Button size |
| `icon` | `React.ReactNode` | No | `null` | Icon to display before children |
| `loading` | `boolean` | No | `false` | Show loading spinner |
| `...rest` | `ButtonHTMLAttributes<HTMLButtonElement>` | No | - | Any other valid button attributes |

#### Usage Examples

```jsx
// Basic usage
<SolidButton onClick={handleSubmit}>
  Save Changes
</SolidButton>

// With loading state
<SolidButton loading={isSaving} type="submit">
  Saving...
</SolidButton>

// With icon
<SolidButton icon={<SaveIcon />} onClick={handleSave}>
  Save
</SolidButton>

// Disabled state
<SolidButton disabled onClick={handleAction}>
  Disabled Action
</SolidButton>

// Custom styling
<SolidButton className="custom-button-class" onClick={handleClick}>
  Custom Styled Button
</SolidButton>
```

#### CSS Classes

```css
.solidButton {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  background: var(--theme-primary);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.solidButton:hover:not(:disabled) {
  background: var(--theme-primary-dark);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.solidButton:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.solidButton.small {
  padding: 8px 16px;
  font-size: 0.875rem;
}

.solidButton.large {
  padding: 16px 32px;
  font-size: 1.125rem;
}

.solidButton.loading {
  position: relative;
  pointer-events: none;
}

.solidButton.loading::after {
  content: "";
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

### OutlineButton

A secondary action button with outlined border and hover effects.

```jsx
import { OutlineButton } from '@/modules/common/components/OutlineButton/OutlineButton';
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | - | Content to display inside the button |
| `onClick` | `MouseEventHandler<HTMLButtonElement>` | No | - | Click handler function |
| `type` | `"button" | "submit" | "reset"` | No | `"button"` | Button type attribute |
| `disabled` | `boolean` | No | `false` | Whether the button is disabled |
| `className` | `string` | No | `""` | Additional CSS classes to apply |
| `size` | `"small" | "medium" | "large"` | No | `"medium"` | Button size |
| `icon` | `React.ReactNode` | No | `null` | Icon to display before children |
| `loading` | `boolean` | No | `false` | Show loading spinner |

#### Usage Examples

```jsx
// Basic usage
<OutlineButton onClick={handleCancel}>
  Cancel
</OutlineButton>

// With loading state
<OutlineButton loading={isLoading} onClick={handleRetry}>
  Retry
</OutlineButton>

// With icon
<OutlineButton icon={<EditIcon />} onClick={handleEdit}>
  Edit
</OutlineButton>

// Disabled state
<OutlineButton disabled onClick={handleSecondaryAction}>
  Secondary Action
</OutlineButton>
```

#### CSS Classes

```css
.outlineButton {
  padding: 10px 20px;
  border: 1px solid var(--theme-primary);
  border-radius: 8px;
  background: transparent;
  color: var(--theme-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.outlineButton:hover:not(:disabled) {
  background: var(--theme-accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.outlineButton:disabled {
  background: #ccc;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
  color: #666;
}

.outlineButton.small {
  padding: 6px 12px;
  font-size: 0.875rem;
}

.outlineButton.large {
  padding: 14px 28px;
  font-size: 1.125rem;
}
```

## Input Components

### Input

A versatile input field component with built-in validation, masking, and accessibility features.

```jsx
import Input from '@/modules/common/components/Input/Input';
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `id` | `string` | Yes | - | Unique identifier for the input |
| `name` | `string` | Yes | - | Name attribute for form submission |
| `label` | `string` | Yes | - | Label text for the input |
| `type` | `"text" | "password" | "email" | "tel"` | No | `"text"` | Input type |
| `value` | `string` | Yes | - | Current value of the input |
| `onChange` | `(e: React.ChangeEvent<HTMLInputElement>) => void` | Yes | - | Change handler function |
| `disabled` | `boolean` | No | `false` | Whether the input is disabled |
| `placeholder` | `string` | No | `""` | Placeholder text |
| `className` | `string` | No | `""` | Additional CSS classes |
| `mask` | `any` | No | `null` | IMask mask configuration |
| `onAccept` | `(value: any, maskRef: any) => void` | No | `null` | Mask acceptance callback |
| `required` | `boolean` | No | `false` | Whether the field is required |
| `error` | `string` | No | `""` | Error message to display |
| `helpText` | `string` | No | `""` | Helper text to display below input |

#### Usage Examples

```jsx
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
  helpText="Please enter a valid email address"
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
/>

// Disabled input
<Input
  id="readOnlyField"
  name="readOnlyField"
  label="Read Only Field"
  value={formData.readOnlyValue}
  onChange={handleChange}
  disabled
/>
```

#### CSS Classes

```css
.inputWrapper {
  margin-bottom: 1.5rem;
}

.inputLabel {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--theme-text-primary);
}

.inputField {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--theme-border);
  border-radius: var(--theme-border-radius);
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

.inputField:focus {
  outline: none;
  border-color: var(--theme-primary);
  box-shadow: 0 0 0 2px rgba(0, 46, 76, 0.2);
}

.inputField.error {
  border-color: var(--theme-error);
  background-color: rgba(244, 67, 54, 0.05);
}

.inputField:disabled {
  background-color: var(--theme-background-alt);
  cursor: not-allowed;
}

.helpText {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--theme-text-secondary);
}

.errorMessage {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: var(--theme-error);
  font-weight: 500;
}
```

## Modal Components

### Modal

A flexible modal dialog component for displaying overlays and confirmations.

```jsx
import Modal from '@/modules/common/components/Modal/Modal';
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isOpen` | `boolean` | Yes | - | Controls modal visibility |
| `onClose` | `() => void` | Yes | - | Callback when modal closes |
| `title` | `string` | Yes | - | Modal title |
| `subtitle` | `string` | No | `""` | Modal subtitle |
| `children` | `React.ReactNode` | Yes | - | Modal content |
| `width` | `string` | No | `"400px"` | Modal width |
| `height` | `string` | No | `"auto"` | Modal height |
| `showCloseButton` | `boolean` | No | `true` | Whether to show close button |
| `closeOnOverlayClick` | `boolean` | No | `true` | Close when clicking overlay |
| `closeOnEscape` | `boolean` | No | `true` | Close when pressing Escape key |

#### Usage Examples

```jsx
// Basic modal
<Modal
  isOpen={isModalOpen}
  onClose={closeModal}
  title="Confirmation"
>
  <p>Are you sure you want to proceed?</p>
  <div className="modal-actions">
    <OutlineButton onClick={closeModal}>Cancel</OutlineButton>
    <SolidButton onClick={handleConfirm}>Confirm</SolidButton>
  </div>
</Modal>

// Modal with subtitle and custom width
<Modal
  isOpen={isEditModalOpen}
  onClose={closeEditModal}
  title="Edit Service"
  subtitle="Update service details"
  width="600px"
>
  <ServiceEditForm />
</Modal>

// Modal without close button
<Modal
  isOpen={isLoading}
  onClose={() => {}}
  title="Processing"
  showCloseButton={false}
  closeOnOverlayClick={false}
  closeOnEscape={false}
>
  <div className="loading-content">
    <LoadingSpinner />
    <p>Please wait while we process your request...</p>
  </div>
</Modal>
```

#### CSS Classes

```css
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modalContent {
  background: var(--theme-surface);
  border-radius: var(--theme-border-radius);
  box-shadow: var(--theme-shadow-large);
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
  position: relative;
}

.modalHeader {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--theme-border-light);
}

.modalTitle {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--theme-text-primary);
}

.modalSubtitle {
  margin: 0;
  font-size: 1rem;
  color: var(--theme-text-secondary);
}

.closeButton {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--theme-text-secondary);
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s ease;
}

.closeButton:hover {
  background-color: var(--theme-background-alt);
}

.modalBody {
  padding: 1.5rem;
}

@media (max-width: 768px) {
  .modalOverlay {
    padding: 0.5rem;
  }
  
  .modalHeader {
    padding: 1rem;
  }
  
  .modalBody {
    padding: 1rem;
  }
  
  .closeButton {
    top: 0.5rem;
    right: 0.5rem;
  }
}
```

## Form Components

### Form

A form wrapper component with built-in validation and submission handling.

```jsx
import { Form } from '@/modules/common/components/Form/Form';
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | - | Form content |
| `onSubmit` | `(data: FormData) => void` | Yes | - | Form submission handler |
| `onReset` | `() => void` | No | - | Form reset handler |
| `className` | `string` | No | `""` | Additional CSS classes |
| `validationSchema` | `object` | No | `null` | Yup validation schema |
| `defaultValues` | `object` | No | `{}` | Default form values |

#### Usage Examples

```jsx
// Basic form with validation
<Form
  onSubmit={handleSubmit}
  validationSchema={validationSchema}
  defaultValues={initialValues}
>
  <Input
    name="fullName"
    label="Full Name"
    required
  />
  
  <Input
    name="email"
    label="Email Address"
    type="email"
    required
  />
  
  <div className="form-actions">
    <OutlineButton type="button" onClick={handleCancel}>
      Cancel
    </OutlineButton>
    <SolidButton type="submit">
      Save
    </SolidButton>
  </div>
</Form>

// Form with custom validation
<Form
  onSubmit={handleCustomSubmit}
  validationSchema={Yup.object({
    username: Yup.string().required('Username is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required')
  })}
>
  <Input
    name="username"
    label="Username"
    required
  />
  
  <Input
    name="password"
    label="Password"
    type="password"
    required
  />
  
  <SolidButton type="submit">
    Login
  </SolidButton>
</Form>
```

### FormGroup

A component for grouping related form elements.

```jsx
import { FormGroup } from '@/modules/common/components/Form/FormGroup';
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | - | Group content |
| `label` | `string` | No | `""` | Group label |
| `className` | `string` | No | `""` | Additional CSS classes |

#### Usage Examples

```jsx
// Form group with label
<FormGroup label="Personal Information">
  <Input
    name="firstName"
    label="First Name"
    required
  />
  
  <Input
    name="lastName"
    label="Last Name"
    required
  />
</FormGroup>

// Form group without label
<FormGroup>
  <Input
    name="email"
    label="Email Address"
    type="email"
    required
  />
  
  <Input
    name="phone"
    label="Phone Number"
    type="tel"
  />
</FormGroup>
```

## Layout Components

### Container

A responsive container component for constraining content width.

```jsx
import { Container } from '@/modules/common/components/Layout/Container';
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | - | Container content |
| `className` | `string` | No | `""` | Additional CSS classes |
| `fluid` | `boolean` | No | `false` | Whether container is fluid (full width) |
| `maxWidth` | `string` | No | `"1200px"` | Maximum container width |

#### Usage Examples

```jsx
// Standard container
<Container>
  <h1>Welcome to ProLine Hub</h1>
  <p>This content is constrained to the standard width.</p>
</Container>

// Fluid container
<Container fluid>
  <div className="full-width-banner">
    <h2>Full Width Banner</h2>
  </div>
</Container>

// Custom max width
<Container maxWidth="1400px">
  <div className="wide-content">
    <h2>Wide Content Section</h2>
  </div>
</Container>
```

### Grid

A CSS Grid-based layout component for creating responsive grids.

```jsx
import { Grid } from '@/modules/common/components/Layout/Grid';
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `React.ReactNode` | Yes | - | Grid content |
| `className` | `string` | No | `""` | Additional CSS classes |
| `columns` | `number` | No | `12` | Number of columns |
| `gap` | `string` | No | `"1rem"` | Gap between grid items |
| `minColumnWidth` | `string` | No | `"250px"` | Minimum column width for responsive grids |

#### Usage Examples

```jsx
// Responsive grid with auto-fit columns
<Grid minColumnWidth="300px" gap="1.5rem">
  <Card title="Service 1" />
  <Card title="Service 2" />
  <Card title="Service 3" />
  <Card title="Service 4" />
</Grid>

// Fixed column grid
<Grid columns={3} gap="1rem">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</Grid>

// Custom gap and columns
<Grid columns={2} gap="2rem">
  <div>Wide gap content</div>
  <div>Wide gap content</div>
</Grid>
```

## Utility Components

### LoadingSpinner

A loading indicator component for async operations.

```jsx
import { LoadingSpinner } from '@/modules/common/components/LoadingSpinner/LoadingSpinner';
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `size` | `"small" | "medium" | "large"` | No | `"medium"` | Spinner size |
| `message` | `string` | No | `""` | Loading message |
| `className` | `string` | No | `""` | Additional CSS classes |

#### Usage Examples

```jsx
// Basic spinner
<LoadingSpinner />

// Large spinner with message
<LoadingSpinner size="large" message="Loading data..." />

// Small spinner for inline use
<LoadingSpinner size="small" />

// Custom styled spinner
<LoadingSpinner className="custom-spinner" />
```

### ErrorMessage

A component for displaying error messages consistently.

```jsx
import { ErrorMessage } from '@/modules/common/components/ErrorMessage/ErrorMessage';
```

#### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `message` | `string` | Yes | - | Error message text |
| `onRetry` | `() => void` | No | `null` | Retry callback function |
| `className` | `string` | No | `""` | Additional CSS classes |

#### Usage Examples

```jsx
// Basic error message
<ErrorMessage message="Failed to load data" />

// Error with retry option
<ErrorMessage 
  message="Connection failed" 
  onRetry={handleRetry}
/>

// Custom styled error
<ErrorMessage 
  message="Something went wrong" 
  className="custom-error"
/>
```

## Best Practices

### 1. Component Composition

Use composition to build complex interfaces:

```jsx
// Good: Compose simple components
const UserProfileForm = () => {
  return (
    <Form onSubmit={handleSubmit}>
      <FormGroup label="Personal Information">
        <Input name="firstName" label="First Name" required />
        <Input name="lastName" label="Last Name" required />
      </FormGroup>
      
      <FormGroup label="Contact Information">
        <Input name="email" label="Email" type="email" required />
        <Input name="phone" label="Phone" type="tel" />
      </FormGroup>
      
      <div className="form-actions">
        <OutlineButton type="button" onClick={handleCancel}>
          Cancel
        </OutlineButton>
        <SolidButton type="submit">
          Save Profile
        </SolidButton>
      </div>
    </Form>
  );
};

// Avoid: Complex nested components
const MonolithicForm = () => {
  // All logic and JSX in one component
};
```

### 2. Prop Validation

Validate props for better developer experience:

```typescript
import PropTypes from 'prop-types';

const Input = ({ id, name, label, type, value, onChange, ...props }) => {
  // Component implementation
};

Input.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['text', 'password', 'email', 'tel']),
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  mask: PropTypes.any,
  onAccept: PropTypes.func
};

Input.defaultProps = {
  type: 'text',
  disabled: false,
  placeholder: '',
  className: '',
  mask: null,
  onAccept: null
};
```

### 3. Accessibility

Ensure components are accessible by default:

```jsx
const Input = ({ id, label, error, helpText, ...props }) => {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;
  
  return (
    <div className="input-wrapper">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        aria-describedby={[errorId, helpId].filter(Boolean).join(' ') || undefined}
        aria-invalid={!!error}
        {...props}
      />
      {helpText && (
        <p id={helpId} className="help-text">
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} className="error-message" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
```

### 4. Performance

Optimize components for performance:

```jsx
import { memo, useMemo } from 'react';

// Memoize components that render frequently
const Button = memo(({ onClick, children, ...props }) => {
  return (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  );
});

// Use useMemo for expensive calculations
const ExpensiveComponent = ({ items, filter }) => {
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);
  
  return (
    <div>
      {filteredItems.map(item => (
        <Item key={item.id} item={item} />
      ))}
    </div>
  );
};
```

### 5. Responsive Design

Ensure components work well on all devices:

```css
/* Mobile-first responsive design */
.component {
  padding: 1rem;
}

@media (min-width: 769px) {
  .component {
    padding: 1.5rem;
  }
}

@media (min-width: 1025px) {
  .component {
    padding: 2rem;
  }
}

/* Flexible layouts */
.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}

.flex {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 769px) {
  .flex {
    flex-direction: row;
  }
}
```

## Contributing

To contribute to the component library:

1. **Follow the established API patterns** for consistency
2. **Document all props** with clear descriptions and examples
3. **Include comprehensive examples** in the documentation
4. **Write tests** for all new components
5. **Ensure accessibility** with proper ARIA attributes
6. **Optimize for performance** with memoization and lazy loading
7. **Follow design system guidelines** for styling and theming
8. **Update this reference** when adding or modifying components

For major component changes, update both the component implementation and this API reference simultaneously.