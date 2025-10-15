# Component Development Best Practices

This document outlines best practices for developing components in the ProLine Hub system, ensuring consistency, maintainability, and quality across the codebase.

## General Principles

### 1. Single Responsibility Principle (SRP)
Each component should have one reason to change - one primary responsibility.

```jsx
// Good: Component with single responsibility
const UserProfileCard = ({ user }) => {
  return (
    <div className="user-profile-card">
      <Avatar src={user.avatar} alt={user.name} />
      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    </div>
  );
};

// Avoid: Component with multiple responsibilities
const ComplexUserCard = ({ user, onEdit, onDelete, onMessage }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  const [messages, setMessages] = useState([]);
  
  const handleSave = async () => {
    // Save user data
  };
  
  const handleDelete = async () => {
    // Delete user
  };
  
  const loadMessages = async () => {
    // Load messages
  };
  
  // Complex component with multiple concerns
  return (
    <div>
      {isEditing ? (
        <EditForm data={formData} onChange={setFormData} onSave={handleSave} />
      ) : (
        <UserInfo user={user} />
      )}
      <MessageList messages={messages} />
      <div className="actions">
        <EditButton onClick={() => setIsEditing(true)} />
        <DeleteButton onClick={handleDelete} />
        <MessageButton onClick={loadMessages} />
      </div>
    </div>
  );
};
```

### 2. Composition Over Inheritance
Use composition to build complex components rather than inheritance.

```jsx
// Good: Composition pattern
const Button = ({ variant = 'primary', size = 'medium', children, ...props }) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      {...props}
    >
      {children}
    </button>
  );
};

const IconButton = ({ icon, ...props }) => {
  return (
    <Button {...props}>
      <span className="icon">{icon}</span>
      {props.children}
    </Button>
  );
};

// Usage
<IconButton icon={<EditIcon />}>Edit</IconButton>

// Avoid: Inheritance approach
class PrimaryButton extends Button {
  render() {
    return <button className="btn-primary" {...this.props} />;
  }
}

class SecondaryButton extends Button {
  render() {
    return <button className="btn-secondary" {...this.props} />;
  }
}
```

### 3. Favor Pure Components
Create components that render the same output for the same input.

```jsx
// Good: Pure component
const UserAvatar = memo(({ user, size = 'medium' }) => {
  const initials = useMemo(() => {
    return user.firstName.charAt(0) + user.lastName.charAt(0);
  }, [user.firstName, user.lastName]);
  
  return (
    <div 
      className={`avatar avatar-${size}`}
      style={{ backgroundColor: getUserColor(user.id) }}
    >
      {user.avatar ? (
        <img src={user.avatar} alt={user.name} />
      ) : (
        <span className="initials">{initials}</span>
      )}
    </div>
  );
});

// Avoid: Impure component with side effects
const ImpureUserAvatar = ({ userId }) => {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Side effect in component
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  if (!user) return <LoadingSpinner />;
  
  return (
    <div className="avatar">
      <img src={user.avatar} alt={user.name} />
    </div>
  );
};
```

## Component Structure

### 1. File Organization
Organize component files logically with clear naming conventions.

```
components/
├── Button/
│   ├── Button.tsx          # Component implementation
│   ├── Button.module.css   # Scoped styles
│   ├── Button.test.tsx     # Component tests
│   ├── Button.stories.tsx  # Storybook stories
│   └── index.ts            # Export file
├── Form/
│   ├── Form.tsx
│   ├── Form.module.css
│   ├── Form.test.tsx
│   ├── Form.stories.tsx
│   └── index.ts
└── Layout/
    ├── Container.tsx
    ├── Container.module.css
    ├── Container.test.tsx
    ├── Container.stories.tsx
    └── index.ts
```

### 2. Component Anatomy
Structure components with a consistent anatomy.

```tsx
// Header comments with component description
/**
 * Button component for user interactions
 * 
 * @param {React.ReactNode} children - Content to display inside the button
 * @param {string} variant - Button style variant ('primary' | 'secondary' | 'outline')
 * @param {string} size - Button size ('small' | 'medium' | 'large')
 * @param {boolean} loading - Whether button is in loading state
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} props - Additional button props
 */
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  loading = false,
  disabled = false,
  className = '',
  ...props 
}: ButtonProps) => {
  // 1. Derived state and memoization
  const buttonClasses = useMemo(() => 
    classNames(
      'button',
      `button-${variant}`,
      `button-${size}`,
      {
        'button-loading': loading,
        'button-disabled': disabled || loading
      },
      className
    ),
    [variant, size, loading, disabled, className]
  );
  
  // 2. Callbacks and handlers
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading && !disabled && props.onClick) {
      props.onClick(event);
    }
  }, [loading, disabled, props.onClick]);
  
  // 3. Effects (if needed)
  useEffect(() => {
    // Side effects
  }, []);
  
  // 4. Render
  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <Spinner size="small" />}
      <span className="button-content">
        {children}
      </span>
    </button>
  );
};

// 5. Default props (if using default export)
Button.displayName = 'Button';

// 6. Export
export default Button;
```

### 3. TypeScript Typing
Use strong typing for better developer experience and fewer bugs.

```typescript
// Good: Comprehensive typing
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Content to display inside the button */
  children: React.ReactNode;
  
  /** Button style variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  
  /** Whether button is in loading state */
  loading?: boolean;
  
  /** Icon to display before children */
  icon?: React.ReactNode;
  
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon = null,
  type = 'button',
  className = '',
  disabled = false,
  ...props
}) => {
  // Component implementation
};
```

## Styling Best Practices

### 1. CSS Modules
Use CSS modules for scoped styling.

```css
/* Button.module.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
}

.button-primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.button-secondary {
  background-color: var(--color-secondary);
  color: var(--color-white);
}

.button-outline {
  background-color: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}

.button-outline:hover:not(:disabled) {
  background-color: var(--color-primary-light);
}

.button-small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.button-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.button-loading {
  pointer-events: none;
}

.spinner {
  width: 1rem;
  height: 1rem;
}
```

### 2. Responsive Design
Implement responsive design principles.

```css
/* Responsive component styling */
.component {
  padding: 1rem;
}

@media (min-width: 768px) {
  .component {
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .component {
    padding: 2rem;
  }
}

/* Mobile-first grid layout */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Flexible flexbox layout */
.flex-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .flex-container {
    flex-direction: row;
  }
}
```

## Performance Optimization

### 1. Memoization
Use memoization to prevent unnecessary re-renders.

```tsx
// Good: Memoized component
const ExpensiveComponent = memo(({ items, onItemClick }) => {
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      processed: expensiveCalculation(item.data)
    }));
  }, [items]);
  
  const handleClick = useCallback((itemId) => {
    onItemClick(itemId);
  }, [onItemClick]);
  
  return (
    <div className="expensive-component">
      {processedItems.map(item => (
        <Item 
          key={item.id} 
          data={item} 
          onClick={handleClick}
        />
      ))}
    </div>
  );
});

// Good: Custom hook with memoization
const useExpensiveCalculation = (data) => {
  return useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);
};
```

### 2. Lazy Loading
Implement lazy loading for heavy components.

```tsx
// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));
const ComplexDataTable = lazy(() => import('./ComplexDataTable'));

const Dashboard = () => {
  const [showChart, setShowChart] = useState(false);
  const [showTable, setShowTable] = useState(false);
  
  return (
    <div className="dashboard">
      <div className="widgets">
        <Widget 
          title="Performance Metrics" 
          onExpand={() => setShowChart(true)}
        >
          {showChart ? (
            <Suspense fallback={<LoadingSpinner />}>
              <HeavyChart />
            </Suspense>
          ) : (
            <PreviewChart />
          )}
        </Widget>
        
        <Widget 
          title="Data Table" 
          onExpand={() => setShowTable(true)}
        >
          {showTable ? (
            <Suspense fallback={<LoadingSpinner />}>
              <ComplexDataTable />
            </Suspense>
          ) : (
            <PreviewTable />
          )}
        </Widget>
      </div>
    </div>
  );
};
```

### 3. Virtualization
Use virtualization for large lists.

```tsx
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ListItem item={items[index]} />
    </div>
  );
  
  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## Accessibility

### 1. Semantic HTML
Use semantic HTML elements for better accessibility.

```tsx
// Good: Semantic HTML
const FormField = ({ label, error, required, children }) => {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  
  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-label="required">*</span>}
      </label>
      {children({
        id,
        'aria-describedby': errorId,
        'aria-invalid': !!error
      })}
      {error && (
        <p id={errorId} role="alert" className="error-message">
          {error}
        </p>
      )}
    </div>
  );
};

// Usage
<FormField label="Email" error={errors.email} required>
  {(props) => (
    <input
      type="email"
      placeholder="Enter your email"
      {...props}
    />
  )}
</FormField>
```

### 2. Keyboard Navigation
Ensure proper keyboard navigation support.

```tsx
const FocusableCard = ({ children, onClick }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };
  
  return (
    <div
      className={`card ${isFocused ? 'focused' : ''}`}
      tabIndex={0}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      aria-pressed={false}
    >
      {children}
    </div>
  );
};
```

### 3. Screen Reader Support
Provide proper screen reader support.

```tsx
const StatusIndicator = ({ status, label }) => {
  const statusLabels = {
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
    info: 'Information'
  };
  
  const iconMap = {
    success: <CheckIcon />,
    warning: <WarningIcon />,
    error: <ErrorIcon />,
    info: <InfoIcon />
  };
  
  return (
    <div 
      className={`status-indicator status-${status}`}
      aria-label={`${statusLabels[status]}: ${label}`}
      role="status"
    >
      <span aria-hidden="true">
        {iconMap[status]}
      </span>
      <span className="sr-only">
        {statusLabels[status]}: {label}
      </span>
    </div>
  );
};
```

## Error Handling

### 1. Error Boundaries
Implement error boundaries for graceful error handling.

```tsx
class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    logError({
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something went wrong with this component.</p>
          <SolidButton onClick={() => window.location.reload()}>
            Reload Page
          </SolidButton>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Usage
<ComponentErrorBoundary>
  <PotentiallyFailingComponent />
</ComponentErrorBoundary>
```

### 2. Graceful Degradation
Implement graceful degradation for failed operations.

```tsx
const DataList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.getData();
        setData(response.data);
      } catch (err) {
        setError(err);
        // Use cached data or default values as fallback
        setData(getCachedData() || []);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <div className="error-state">
        <ErrorMessage 
          message="Failed to load data" 
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="empty-state">
        <EmptyStateMessage message="No data available" />
      </div>
    );
  }
  
  return (
    <div className="data-list">
      {data.map(item => (
        <DataItem key={item.id} item={item} />
      ))}
    </div>
  );
};
```

## Testing

### 1. Unit Testing
Write comprehensive unit tests for components.

```tsx
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  test('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );
    
    await user.click(screen.getByText('Click me'));
    expect(handleClick).not.toHaveBeenCalled();
  });
  
  test('shows loading spinner when loading', () => {
    render(
      <Button loading>
        Loading...
      </Button>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  test('applies correct CSS classes', () => {
    const { container } = render(
      <Button variant="secondary" size="large">
        Large Secondary Button
      </Button>
    );
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('button');
    expect(button).toHaveClass('button-secondary');
    expect(button).toHaveClass('button-large');
  });
});
```

### 2. Integration Testing
Test component interactions and workflows.

```tsx
// Form.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider } from './FormContext';
import UserProfileForm from './UserProfileForm';

describe('UserProfileForm Integration', () => {
  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    
    render(
      <FormProvider>
        <UserProfileForm onSubmit={onSubmit} />
      </FormProvider>
    );
    
    // Fill in form fields
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify submission
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      });
    });
  });
  
  test('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <FormProvider>
        <UserProfileForm onSubmit={jest.fn()} />
      </FormProvider>
    );
    
    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify error messages
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
  });
});
```

## Documentation

### 1. Component Documentation
Document components with clear examples and API descriptions.

```tsx
/**
 * Button component for user interactions
 * 
 * @example
 * ```tsx
 * // Primary button
 * <Button onClick={handleClick}>
 *   Click me
 * </Button>
 * 
 * // Secondary button with icon
 * <Button variant="secondary" icon={<EditIcon />}>
 *   Edit
 * </Button>
 * 
 * // Loading state
 * <Button loading>
 *   Saving...
 * </Button>
 * ```
 * 
 * @param {React.ReactNode} children - Content to display inside the button
 * @param {'primary' | 'secondary' | 'outline' | 'ghost'} variant - Button style variant
 * @param {'small' | 'medium' | 'large'} size - Button size
 * @param {boolean} loading - Whether button is in loading state
 * @param {React.ReactNode} icon - Icon to display before children
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} props - Additional button props
 */
```

### 2. Storybook Stories
Create comprehensive Storybook stories for components.

```tsx
// Button.stories.tsx
import { Button } from './Button';

export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost']
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large']
    }
  }
};

export const Primary = {
  args: {
    children: 'Primary Button',
    variant: 'primary'
  }
};

export const Secondary = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary'
  }
};

export const Outline = {
  args: {
    children: 'Outline Button',
    variant: 'outline'
  }
};

export const Loading = {
  args: {
    children: 'Loading Button',
    loading: true
  }
};

export const WithIcon = {
  args: {
    children: 'Button with Icon',
    icon: '🔍'
  }
};

export const AllVariants = () => (
  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="outline">Outline</Button>
    <Button variant="ghost">Ghost</Button>
  </div>
);
```

## Code Quality

### 1. ESLint Configuration
Use consistent ESLint configuration for code quality.

```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "plugins": ["react", "react-hooks", "@typescript-eslint"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn",
    "no-debugger": "error"
  }
}
```

### 2. Code Formatting
Use Prettier for consistent code formatting.

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

## Conclusion

Following these best practices will help ensure that components in the ProLine Hub system are:
- Maintainable and easy to understand
- Performant and efficient
- Accessible to all users
- Well-tested and reliable
- Properly documented
- Consistently styled and structured

Regular code reviews and adherence to these guidelines will help maintain high code quality throughout the project.