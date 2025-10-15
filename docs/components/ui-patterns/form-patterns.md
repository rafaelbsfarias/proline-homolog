# Form Patterns

This document outlines best practices and patterns for creating effective, accessible, and user-friendly forms in the ProLine Hub application.

## Form Structure

### Basic Form Layout

Forms should follow a consistent structure that promotes usability and accessibility:

```jsx
<form onSubmit={handleSubmit} className="form">
  <div className="form-section">
    <h2 className="form-section-title">Personal Information</h2>
    
    <div className="form-group">
      <label htmlFor="fullName">Full Name</label>
      <Input
        id="fullName"
        name="fullName"
        type="text"
        value={formData.fullName}
        onChange={handleChange}
        required
      />
      {errors.fullName && (
        <span className="error-message">{errors.fullName}</span>
      )}
    </div>
    
    <div className="form-group">
      <label htmlFor="email">Email Address</label>
      <Input
        id="email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      {errors.email && (
        <span className="error-message">{errors.email}</span>
      )}
    </div>
  </div>
  
  <div className="form-actions">
    <OutlineButton type="button" onClick={handleCancel}>
      Cancel
    </OutlineButton>
    <SolidButton type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save'}
    </SolidButton>
  </div>
</form>
```

### Form Sections

Large forms should be divided into logical sections:

```css
.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--theme-border-light);
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.form-section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--theme-text-primary);
}
```

## Input Patterns

### Text Inputs

Text inputs should provide clear labeling and feedback:

```jsx
<div className="form-group">
  <label htmlFor="companyName">
    Company Name <span className="required">*</span>
  </label>
  <Input
    id="companyName"
    name="companyName"
    type="text"
    placeholder="Enter your company name"
    value={formData.companyName}
    onChange={handleChange}
    required
    aria-describedby="companyName-help"
  />
  <p id="companyName-help" className="help-text">
    Please enter the legal name of your company
  </p>
  {errors.companyName && (
    <span className="error-message">{errors.companyName}</span>
  )}
</div>
```

### Password Inputs

Password inputs should include strength indicators and visibility toggles:

```jsx
<div className="form-group">
  <label htmlFor="password">
    Password <span className="required">*</span>
  </label>
  <div className="password-input-wrapper">
    <Input
      id="password"
      name="password"
      type={showPassword ? 'text' : 'password'}
      value={formData.password}
      onChange={handleChange}
      required
      aria-describedby="password-strength"
    />
    <button
      type="button"
      className="toggle-password"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  </div>
  <div id="password-strength" className="password-strength">
    <div className={`strength-meter strength-${passwordStrength}`}>
      <div className="strength-fill"></div>
    </div>
    <span className="strength-text">
      {getPasswordStrengthText(passwordStrength)}
    </span>
  </div>
  {errors.password && (
    <span className="error-message">{errors.password}</span>
  )}
</div>
```

### Select Inputs

Select inputs should be accessible and user-friendly:

```jsx
<div className="form-group">
  <label htmlFor="serviceCategory">
    Service Category <span className="required">*</span>
  </label>
  <select
    id="serviceCategory"
    name="serviceCategory"
    value={formData.serviceCategory}
    onChange={handleChange}
    required
    className={`form-select ${errors.serviceCategory ? 'error' : ''}`}
  >
    <option value="">Select a category</option>
    <option value="mechanic">Mechanic</option>
    <option value="body">Body Shop</option>
    <option value="paint">Paint Shop</option>
    <option value="electrical">Electrical</option>
  </select>
  {errors.serviceCategory && (
    <span className="error-message">{errors.serviceCategory}</span>
  )}
</div>
```

### Checkbox and Radio Groups

Groups should be properly labeled and accessible:

```jsx
<fieldset className="form-group">
  <legend>
    Preferred Communication Methods <span className="required">*</span>
  </legend>
  <div className="checkbox-group">
    <label className="checkbox-label">
      <input
        type="checkbox"
        name="communicationMethods"
        value="email"
        checked={formData.communicationMethods.includes('email')}
        onChange={handleCheckboxChange}
      />
      <span className="checkbox-custom"></span>
      Email
    </label>
    <label className="checkbox-label">
      <input
        type="checkbox"
        name="communicationMethods"
        value="sms"
        checked={formData.communicationMethods.includes('sms')}
        onChange={handleCheckboxChange}
      />
      <span className="checkbox-custom"></span>
      SMS
    </label>
    <label className="checkbox-label">
      <input
        type="checkbox"
        name="communicationMethods"
        value="whatsapp"
        checked={formData.communicationMethods.includes('whatsapp')}
        onChange={handleCheckboxChange}
      />
      <span className="checkbox-custom"></span>
      WhatsApp
    </label>
  </div>
  {errors.communicationMethods && (
    <span className="error-message">{errors.communicationMethods}</span>
  )}
</fieldset>
```

## Validation Patterns

### Real-time Validation

Provide immediate feedback as users interact with form fields:

```javascript
const useFormValidation = (initialState, validationRules) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    for (const rule of rules) {
      const errorMessage = rule(value, values);
      if (errorMessage) return errorMessage;
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setValues(prev => ({ ...prev, [name]: newValue }));
    
    // Validate immediately for touched fields
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(validationRules).forEach(name => {
      const error = validateField(name, values[name]);
      if (error) newErrors[name] = error;
    });
    setErrors(newErrors);
    setTouched(Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return Object.keys(newErrors).length === 0;
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    setValues
  };
};
```

### Validation Rules

Define reusable validation rules:

```javascript
const validationRules = {
  fullName: [
    (value) => !value ? 'Full name is required' : '',
    (value) => value && value.length < 2 ? 'Full name must be at least 2 characters' : ''
  ],
  email: [
    (value) => !value ? 'Email is required' : '',
    (value) => value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? 'Please enter a valid email address' : ''
  ],
  password: [
    (value) => !value ? 'Password is required' : '',
    (value) => value && value.length < 8 ? 'Password must be at least 8 characters' : '',
    (value) => value && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value) ? 'Password must contain uppercase, lowercase, and number' : ''
  ]
};
```

## Error Handling

### Error Message Display

Display errors clearly and accessibly:

```css
.error-message {
  display: block;
  color: var(--theme-error);
  font-size: 0.875rem;
  margin-top: 0.25rem;
  font-weight: 500;
}

.form-group.error {
  position: relative;
}

.form-group.error input,
.form-group.error select,
.form-group.error textarea {
  border-color: var(--theme-error);
  background-color: rgba(244, 67, 54, 0.05);
}

.form-group.error input:focus,
.form-group.error select:focus,
.form-group.error textarea:focus {
  border-color: var(--theme-error);
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
}
```

### Error Summary

Provide a summary of all form errors at the top of the form:

```jsx
const FormWithErrorSummary = ({ errors, handleSubmit }) => {
  const hasErrors = Object.keys(errors).length > 0;
  
  return (
    <form onSubmit={handleSubmit}>
      {hasErrors && (
        <div className="error-summary" role="alert">
          <h3>Please correct the following errors:</h3>
          <ul>
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>
                <a href={`#${field}`}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Form fields go here */}
    </form>
  );
};
```

## Accessibility Patterns

### Semantic HTML

Use semantic HTML elements for proper screen reader support:

```jsx
<form>
  <fieldset>
    <legend>Contact Information</legend>
    
    <label htmlFor="firstName">
      First Name <abbr title="required">*</abbr>
    </label>
    <Input
      id="firstName"
      name="firstName"
      type="text"
      required
      aria-required="true"
    />
    
    <label htmlFor="lastName">
      Last Name <abbr title="required">*</abbr>
    </label>
    <Input
      id="lastName"
      name="lastName"
      type="text"
      required
      aria-required="true"
    />
  </fieldset>
</form>
```

### ARIA Attributes

Use ARIA attributes to enhance accessibility:

```jsx
<div className="form-group">
  <label htmlFor="username">Username</label>
  <div className="input-with-status">
    <Input
      id="username"
      name="username"
      type="text"
      value={formData.username}
      onChange={handleChange}
      aria-describedby="username-status"
      aria-invalid={!!errors.username}
    />
    {checkingAvailability && (
      <span id="username-status" className="status-indicator">
        Checking availability...
      </span>
    )}
    {usernameAvailable === false && (
      <span id="username-status" className="status-indicator error">
        Username is not available
      </span>
    )}
  </div>
</div>
```

## Responsive Patterns

### Mobile-Friendly Forms

Optimize forms for mobile devices:

```css
@media (max-width: 768px) {
  .form-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
  }
  
  .form-section-title {
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .form-actions .button {
    width: 100%;
  }
  
  .checkbox-group {
    flex-direction: column;
    gap: 0.75rem;
  }
}
```

## Loading and Submission States

### Form Submission Feedback

Provide clear feedback during form submission:

```jsx
const FormWithSubmissionState = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      await submitFormData(formData);
      setSubmitSuccess(true);
      // Reset form or redirect
    } catch (error) {
      setSubmitError('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="success-message">
        <h2>Form Submitted Successfully!</h2>
        <p>Your information has been received.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {submitError && (
        <div className="error-banner" role="alert">
          {submitError}
        </div>
      )}
      
      {/* Form fields */}
      
      <div className="form-actions">
        <OutlineButton type="button" disabled={isSubmitting}>
          Cancel
        </OutlineButton>
        <SolidButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size="small" /> Saving...
            </>
          ) : 'Save'}
        </SolidButton>
      </div>
    </form>
  );
};
```

## Specialized Patterns

### Wizard Forms

Break complex forms into multi-step wizards:

```jsx
const WizardForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  
  const steps = [
    { title: 'Basic Information', component: BasicInfoStep },
    { title: 'Service Preferences', component: ServicePreferencesStep },
    { title: 'Review and Submit', component: ReviewStep }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const StepComponent = steps[currentStep].component;

  return (
    <div className="wizard-form">
      <div className="wizard-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="step-indicators">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`step ${index === currentStep ? 'active' : index < currentStep ? 'completed' : ''}`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-title">{step.title}</span>
            </div>
          ))}
        </div>
      </div>
      
      <StepComponent 
        formData={formData}
        setFormData={setFormData}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLastStep={currentStep === steps.length - 1}
      />
    </div>
  );
};
```

### Inline Editing

Enable inline editing for quick updates:

```jsx
const InlineEditableField = ({ value, onSave, type = 'text' }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(tempValue);
      setIsEditing(false);
    } catch (error) {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="inline-edit">
        <Input
          type={type}
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
        <div className="inline-actions">
          <OutlineButton size="small" onClick={() => setIsEditing(false)}>
            Cancel
          </OutlineButton>
          <SolidButton size="small" onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Spinner size="small" /> : 'Save'}
          </SolidButton>
        </div>
      </div>
    );
  }

  return (
    <div className="editable-field" onClick={() => setIsEditing(true)}>
      <span>{value || 'Click to edit'}</span>
      <EditIcon className="edit-icon" />
    </div>
  );
};
```

## Performance Optimization

### Debounced Input Processing

For expensive operations, debounce input processing:

```javascript
import { debounce } from 'lodash';

const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SearchForm = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <Input
      type="text"
      placeholder="Search..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  );
};
```

## Security Considerations

### Input Sanitization

Sanitize user input to prevent XSS and injection attacks:

```javascript
import DOMPurify from 'dompurify';

const sanitizeInput = (value) => {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

const FormWithSanitization = () => {
  const [formData, setFormData] = useState({
    description: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({
      ...prev,
      [name]: sanitizedValue
    }));
  };

  return (
    <form>
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Enter a description"
      />
    </form>
  );
};
```

## Testing Patterns

### Form Testing

Write comprehensive tests for form behavior:

```javascript
// Form.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormComponent from './FormComponent';

describe('FormComponent', () => {
  test('displays validation errors for required fields', async () => {
    render(<FormComponent />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
    
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    render(<FormComponent onSubmit={mockOnSubmit} />);
    
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
    render(<FormComponent />);
    
    // Fill form and submit
    await userEvent.type(screen.getByLabelText(/full name/i), 'John Doe');
    await userEvent.click(screen.getByRole('button', { name: /submit/i }));
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/form submitted successfully/i)).toBeInTheDocument();
    });
  });
});
```

## Best Practices Summary

### 1. Consistency
- Use consistent form layouts and styling
- Maintain predictable interaction patterns
- Follow established design system guidelines

### 2. Accessibility
- Provide proper labels and ARIA attributes
- Ensure keyboard navigation support
- Maintain color contrast ratios
- Support screen readers with semantic markup

### 3. Usability
- Provide clear error messages
- Show validation feedback in real-time
- Offer helpful placeholder text
- Include undo/redo functionality when appropriate

### 4. Performance
- Debounce expensive operations
- Optimize form rendering with memoization
- Lazy load complex form sections
- Minimize re-renders with efficient state management

### 5. Security
- Sanitize user input
- Validate data on both client and server
- Protect against CSRF attacks
- Encrypt sensitive data in transit and at rest

### 6. Mobile Optimization
- Use responsive layouts
- Optimize touch targets
- Implement appropriate keyboard layouts
- Consider offline form capabilities