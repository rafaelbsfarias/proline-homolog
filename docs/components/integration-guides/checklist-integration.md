# Checklist Integration Guide

This document provides guidance on integrating checklist components into the ProLine Hub application, covering component usage, state management, and API integration patterns.

## Overview

The ProLine Hub checklist system consists of several React components that work together to provide a comprehensive checklist management experience. These components handle loading, editing, saving, and viewing checklists for different partner categories.

## Core Components

### ChecklistForm
The main form component that orchestrates the checklist interface.

```jsx
import ChecklistForm from '@/modules/partner/components/checklist/ChecklistForm';

<ChecklistForm
  vehicleId={vehicleId}
  context={{
    type: 'quote',
    id: quoteId
  }}
  category="mechanic"
  onSubmit={handleSave}
  onCancel={handleCancel}
/>
```

### ChecklistGroups
Component that renders checklist items grouped by category.

```jsx
import ChecklistGroups from '@/modules/partner/components/checklist/ChecklistGroups';

<ChecklistGroups
  groups={checklistGroups}
  values={formValues}
  onChange={handleFieldChange}
  onEvidenceChange={handleEvidenceChange}
  onPartRequestChange={handlePartRequestChange}
/>
```

### EvidenceUploader
Component for uploading and managing evidence for checklist items.

```jsx
import EvidenceUploader from '@/modules/partner/components/checklist/EvidenceUploader';

<EvidenceUploader
  itemKey={itemKey}
  evidences={evidences[itemKey] || []}
  onAddEvidence={handleAddEvidence}
  onRemoveEvidence={handleRemoveEvidence}
/>
```

### PartRequestModal
Modal component for creating and editing part requests.

```jsx
import PartRequestModal from '@/modules/partner/components/checklist/PartRequestModal';

<PartRequestModal
  isOpen={isPartRequestModalOpen}
  onClose={closePartRequestModal}
  onSave={handlePartRequestSave}
  partRequest={editingPartRequest}
/>
```

## State Management

### Checklist State Hook
Custom hook for managing checklist state and lifecycle.

```javascript
import { useChecklist } from '@/modules/partner/hooks/useChecklist';

const {
  checklist,
  loading,
  error,
  loadChecklist,
  saveChecklist,
  submitChecklist
} = useChecklist({
  vehicleId,
  context,
  category
});
```

### Form State Management
Managing form state for checklist items.

```javascript
const [formValues, setFormValues] = useState({});
const [evidences, setEvidences] = useState({});
const [partRequests, setPartRequests] = useState({});

const handleFieldChange = (itemKey, field, value) => {
  setFormValues(prev => ({
    ...prev,
    [itemKey]: {
      ...prev[itemKey],
      [field]: value
    }
  }));
};

const handleEvidenceChange = (itemKey, evidenceList) => {
  setEvidences(prev => ({
    ...prev,
    [itemKey]: evidenceList
  }));
};

const handlePartRequestChange = (itemKey, request) => {
  setPartRequests(prev => ({
    ...prev,
    [itemKey]: request
  }));
};
```

## API Integration

### Loading Checklist Data
Loading checklist data from the API.

```javascript
const loadChecklist = async ({ vehicleId, context, category }) => {
  try {
    const response = await fetch('/api/partner/checklist/load', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        vehicle_id: vehicleId,
        context_type: context.type,
        context_id: context.id,
        category: category
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to load checklist');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading checklist:', error);
    throw error;
  }
};
```

### Saving Checklist Data
Saving checklist data to the API.

```javascript
const saveChecklist = async (checklistData) => {
  try {
    const response = await fetch('/api/partner/checklist/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(checklistData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save checklist');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving checklist:', error);
    throw error;
  }
};
```

### Submitting Checklist
Submitting the checklist for approval.

```javascript
const submitChecklist = async (checklistId) => {
  try {
    const response = await fetch('/api/partner/checklist/submit', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        checklist_id: checklistId
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit checklist');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting checklist:', error);
    throw error;
  }
};
```

## Integration Patterns

### Partner Dashboard Integration
Integrating checklist components into the partner dashboard.

```jsx
const PartnerChecklistPage = ({ vehicleId, quoteId }) => {
  const router = useRouter();
  const { category } = usePartnerCategory();
  
  const context = {
    type: 'quote',
    id: quoteId
  };
  
  const handleSave = async (data) => {
    try {
      await saveChecklist(data);
      router.push('/dashboard/partner');
    } catch (error) {
      console.error('Failed to save checklist:', error);
    }
  };
  
  const handleCancel = () => {
    router.push('/dashboard/partner');
  };
  
  return (
    <div className="partner-checklist-page">
      <ChecklistForm
        vehicleId={vehicleId}
        context={context}
        category={category}
        onSubmit={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};
```

### Dynamic Checklist Integration
Integrating dynamic checklist components for non-mechanical categories.

```jsx
const DynamicChecklistPage = ({ vehicleId, quoteId }) => {
  const { category } = usePartnerCategory();
  
  const context = {
    type: 'quote',
    id: quoteId
  };
  
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadDynamicChecklist = async () => {
      try {
        const data = await loadChecklist({ vehicleId, context, category });
        setChecklist(data);
      } catch (error) {
        console.error('Failed to load checklist:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDynamicChecklist();
  }, [vehicleId, context, category]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="dynamic-checklist-page">
      <DynamicChecklistForm
        checklist={checklist}
        category={category}
        onSubmit={handleSubmit}
      />
    </div>
  );
};
```

### Checklist Viewer Integration
Integrating checklist viewer for public access.

```jsx
const ChecklistViewerPage = ({ vehicleId, quoteId, partnerId, category }) => {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadViewerData = async () => {
      try {
        const data = await fetchChecklistView({
          vehicle_id: vehicleId,
          context_type: 'quote',
          context_id: quoteId,
          partner_id: partnerId,
          category: category
        });
        setChecklist(data);
      } catch (error) {
        console.error('Failed to load checklist view:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadViewerData();
  }, [vehicleId, quoteId, partnerId, category]);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="checklist-viewer-page">
      <ChecklistViewer checklist={checklist} />
    </div>
  );
};
```

## Component Composition

### Building Complex Components
Combining multiple components to create complex interfaces.

```jsx
const ChecklistEditor = ({ vehicleId, context, category }) => {
  const {
    checklist,
    loading,
    error,
    loadChecklist,
    saveChecklist,
    submitChecklist
  } = useChecklist({ vehicleId, context, category });
  
  const [formValues, setFormValues] = useState({});
  const [evidences, setEvidences] = useState({});
  const [partRequests, setPartRequests] = useState({});
  
  // Load initial data
  useEffect(() => {
    const initializeChecklist = async () => {
      try {
        const data = await loadChecklist();
        setFormValues(formatInitialValues(data.items));
        setEvidences(formatInitialEvidences(data.evidences));
        setPartRequests(formatInitialPartRequests(data.part_requests));
      } catch (error) {
        console.error('Failed to initialize checklist:', error);
      }
    };
    
    initializeChecklist();
  }, []);
  
  const handleSubmit = async () => {
    try {
      const checklistData = {
        checklist_id: checklist.id,
        items: formatItemsForSave(formValues),
        evidences: formatEvidencesForSave(evidences),
        part_requests: formatPartRequestsForSave(partRequests)
      };
      
      await saveChecklist(checklistData);
      router.push('/dashboard/partner');
    } catch (error) {
      console.error('Failed to save checklist:', error);
    }
  };
  
  const handleFieldChange = (itemKey, field, value) => {
    setFormValues(prev => ({
      ...prev,
      [itemKey]: {
        ...prev[itemKey],
        [field]: value
      }
    }));
  };
  
  const handleEvidenceChange = (itemKey, evidenceList) => {
    setEvidences(prev => ({
      ...prev,
      [itemKey]: evidenceList
    }));
  };
  
  const handlePartRequestChange = (itemKey, request) => {
    setPartRequests(prev => ({
      ...prev,
      [itemKey]: request
    }));
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorDisplay error={error} onRetry={loadChecklist} />;
  }
  
  return (
    <div className="checklist-editor">
      <ChecklistHeader 
        vehicle={checklist.vehicle}
        partner={checklist.partner}
        checklistStatus={checklist.status}
      />
      
      <ChecklistGroups
        groups={checklist.groups}
        values={formValues}
        evidences={evidences}
        partRequests={partRequests}
        onFieldChange={handleFieldChange}
        onEvidenceChange={handleEvidenceChange}
        onPartRequestChange={handlePartRequestChange}
      />
      
      <ChecklistActions
        checklistStatus={checklist.status}
        onSave={handleSubmit}
        onSubmit={submitChecklist}
        onCancel={handleCancel}
      />
    </div>
  );
};
```

## Error Handling

### Graceful Error Handling
Handling errors gracefully in checklist components.

```javascript
const useChecklistWithErrorHandling = (params) => {
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const {
    checklist,
    loading,
    loadChecklist,
    saveChecklist,
    submitChecklist
  } = useChecklist(params);
  
  const loadWithRetry = async () => {
    try {
      await loadChecklist();
      setError(null);
      setRetryCount(0);
    } catch (error) {
      setError(error);
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadWithRetry();
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      }
    }
  };
  
  return {
    checklist,
    loading,
    error,
    retryCount,
    loadChecklist: loadWithRetry,
    saveChecklist,
    submitChecklist
  };
};
```

### User-Friendly Error Messages
Displaying user-friendly error messages.

```jsx
const ErrorDisplay = ({ error, onRetry }) => {
  const getErrorMessage = (error) => {
    if (error.message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timeout. Please try again.';
    }
    return 'Something went wrong. Please try again later.';
  };
  
  return (
    <div className="error-display">
      <h3>Error Loading Checklist</h3>
      <p>{getErrorMessage(error)}</p>
      <SolidButton onClick={onRetry}>Try Again</SolidButton>
    </div>
  );
};
```

## Performance Optimization

### Lazy Loading
Lazy loading components for better performance.

```javascript
import { lazy, Suspense } from 'react';

const ChecklistForm = lazy(() => import('@/modules/partner/components/checklist/ChecklistForm'));
const LoadingSpinner = lazy(() => import('@/modules/common/components/LoadingSpinner'));

const ChecklistPage = ({ vehicleId, quoteId }) => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ChecklistForm vehicleId={vehicleId} quoteId={quoteId} />
    </Suspense>
  );
};
```

### Memoization
Using memoization to prevent unnecessary re-renders.

```jsx
import { memo, useMemo } from 'react';

const ChecklistItem = memo(({ item, value, onChange }) => {
  const handleChange = (field, newValue) => {
    onChange(item.key, field, newValue);
  };
  
  return (
    <div className="checklist-item">
      <label>{item.label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange('value', e.target.value)}
      />
    </div>
  );
});

const ChecklistGroups = memo(({ groups, values, onChange }) => {
  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => a.order - b.order);
  }, [groups]);
  
  return (
    <div className="checklist-groups">
      {sortedGroups.map(group => (
        <div key={group.id} className="checklist-group">
          <h3>{group.title}</h3>
          {group.items.map(item => (
            <ChecklistItem
              key={item.key}
              item={item}
              value={values[item.key]}
              onChange={onChange}
            />
          ))}
        </div>
      ))}
    </div>
  );
});
```

## Testing Integration

### Component Testing
Writing tests for checklist components.

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChecklistForm from './ChecklistForm';

describe('ChecklistForm', () => {
  const defaultProps = {
    vehicleId: 'vehicle-123',
    context: { type: 'quote', id: 'quote-456' },
    category: 'mechanic',
    onSubmit: jest.fn(),
    onCancel: jest.fn()
  };

  test('renders checklist form with vehicle info', async () => {
    render(<ChecklistForm {...defaultProps} />);
    
    expect(screen.getByText('Loading checklist...')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Vehicle Information')).toBeInTheDocument();
    });
  });

  test('allows saving checklist data', async () => {
    render(<ChecklistForm {...defaultProps} />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
    
    // Fill in some data
    await userEvent.type(screen.getByLabelText(/engine oil/i), 'Good condition');
    
    // Click save button
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });
  });

  test('handles form cancellation', async () => {
    render(<ChecklistForm {...defaultProps} />);
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
    
    // Click cancel button
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });
});
```

## Security Considerations

### Input Sanitization
Sanitizing user input to prevent XSS attacks.

```javascript
import DOMPurify from 'dompurify';

const sanitizeInput = (value) => {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

const ChecklistForm = ({ onSubmit, ...props }) => {
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Sanitize form data before sending to API
    const sanitizedData = Object.keys(formData).reduce((acc, key) => {
      acc[key] = typeof formData[key] === 'string' 
        ? sanitizeInput(formData[key])
        : formData[key];
      return acc;
    }, {});
    
    await onSubmit(sanitizedData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
};
```

### Authentication and Authorization
Ensuring proper authentication and authorization.

```javascript
const useAuthenticatedChecklist = ({ checklistId }) => {
  const { user, isAuthenticated, hasPermission } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      redirectToLogin();
      return;
    }
    
    if (!hasPermission('edit_checklist')) {
      redirectToUnauthorized();
      return;
    }
    
    // Load checklist data
    loadChecklist(checklistId);
  }, [isAuthenticated, hasPermission, checklistId]);
  
  // Return checklist data and methods
};
```

## Best Practices

### 1. Component Composition
Build complex interfaces by composing simpler components:

```jsx
// Good: Compose simple components
const ChecklistEditor = () => {
  return (
    <div className="checklist-editor">
      <ChecklistHeader />
      <ChecklistGroups />
      <ChecklistFooter />
    </div>
  );
};

// Bad: Everything in one component
const MonolithicChecklistEditor = () => {
  // All logic and JSX in one component
};
```

### 2. State Management
Keep state localized and predictable:

```javascript
// Good: Localized state with clear data flow
const ChecklistForm = () => {
  const [formData, setFormData] = useState({});
  
  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  return (
    <ChecklistItem 
      value={formData.itemName}
      onChange={(value) => handleChange('itemName', value)}
    />
  );
};

// Bad: Complex nested state
const BadChecklistForm = () => {
  const [state, setState] = useState({
    items: {
      engine: {
        oil: { value: '', status: 'pending' },
        coolant: { value: '', status: 'pending' }
      }
    }
  });
};
```

### 3. Error Boundary Implementation
Handle errors gracefully with error boundaries:

```jsx
class ChecklistErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with the checklist</h2>
          <p>We're working to fix this issue. Please try refreshing the page.</p>
          <SolidButton onClick={() => window.location.reload()}>
            Refresh Page
          </SolidButton>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap checklist components
<ChecklistErrorBoundary>
  <ChecklistForm />
</ChecklistErrorBoundary>
```

### 4. Accessibility
Ensure components are accessible:

```jsx
const ChecklistItem = ({ item, value, onChange }) => {
  return (
    <div className="checklist-item">
      <label htmlFor={`item-${item.key}`}>
        {item.label}
        {item.required && <span aria-label="required">*</span>}
      </label>
      <input
        id={`item-${item.key}`}
        name={item.key}
        value={value}
        onChange={(e) => onChange(item.key, e.target.value)}
        aria-describedby={item.description ? `desc-${item.key}` : undefined}
        aria-required={item.required}
      />
      {item.description && (
        <div id={`desc-${item.key}`} className="item-description">
          {item.description}
        </div>
      )}
    </div>
  );
};
```

## Conclusion

This integration guide provides patterns and best practices for incorporating checklist components into the ProLine Hub application. By following these guidelines, developers can create consistent, performant, and maintainable checklist interfaces that provide excellent user experiences across all supported devices and contexts.

Key takeaways:
1. **Compose components** rather than building monolithic interfaces
2. **Manage state predictably** with clear data flow
3. **Handle errors gracefully** with error boundaries and user-friendly messages
4. **Ensure accessibility** for all users
5. **Optimize performance** with lazy loading and memoization
6. **Test thoroughly** to ensure reliability and maintainability
7. **Follow security best practices** to protect user data