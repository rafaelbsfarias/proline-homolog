# Partner Workflow Integration Guide

This document provides comprehensive guidance for integrating partner workflows into the ProLine Hub application, covering the complete lifecycle from partner onboarding to service delivery and checklist management.

## Overview

The partner workflow in ProLine Hub encompasses several interconnected systems that enable partners to provide services to clients through a streamlined process. This includes partner registration, service catalog management, quote creation, checklist completion, and service delivery tracking.

## Partner Registration Flow

### Partner Account Creation

The partner registration process involves collecting essential business information and verifying credentials.

```javascript
// Partner registration service
const registerPartner = async (partnerData) => {
  try {
    // Validate required fields
    const requiredFields = ['companyName', 'cnpj', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !partnerData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Check if CNPJ already exists
    const existingPartner = await findPartnerByCNPJ(partnerData.cnpj);
    if (existingPartner) {
      throw new Error('A partner with this CNPJ already exists');
    }
    
    // Create partner account
    const partner = await createPartnerAccount({
      company_name: partnerData.companyName,
      cnpj: partnerData.cnpj,
      email: partnerData.email,
      phone: partnerData.phone,
      description: partnerData.description,
      status: 'pending_verification'
    });
    
    // Send verification email
    await sendVerificationEmail(partner.email, partner.id);
    
    return {
      success: true,
      partnerId: partner.id,
      message: 'Partner registration successful. Please check your email for verification.'
    };
  } catch (error) {
    console.error('Partner registration error:', error);
    throw error;
  }
};
```

### Verification Process

After registration, partners must verify their email and provide additional documentation.

```jsx
const PartnerVerification = ({ partnerId, onComplete }) => {
  const [verificationStep, setVerificationStep] = useState('email');
  const [documents, setDocuments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleEmailVerification = async (verificationCode) => {
    try {
      await verifyPartnerEmail(partnerId, verificationCode);
      setVerificationStep('documents');
    } catch (error) {
      console.error('Email verification failed:', error);
      throw error;
    }
  };
  
  const handleDocumentUpload = async (documentType, file) => {
    try {
      const documentUrl = await uploadDocument(file);
      setDocuments(prev => ({
        ...prev,
        [documentType]: documentUrl
      }));
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  };
  
  const handleSubmitDocuments = async () => {
    setIsSubmitting(true);
    try {
      await submitPartnerDocuments(partnerId, documents);
      await updatePartnerStatus(partnerId, 'pending_admin_review');
      onComplete();
    } catch (error) {
      console.error('Document submission failed:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="partner-verification">
      {verificationStep === 'email' && (
        <EmailVerificationStep
          onSubmit={handleEmailVerification}
        />
      )}
      
      {verificationStep === 'documents' && (
        <DocumentSubmissionStep
          documents={documents}
          onDocumentUpload={handleDocumentUpload}
          onSubmit={handleSubmitDocuments}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};
```

## Service Catalog Management

### Service Definition

Partners define their service offerings with pricing and descriptions.

```jsx
const ServiceCatalogManager = ({ partnerId }) => {
  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const loadServices = async () => {
      try {
        const partnerServices = await fetchPartnerServices(partnerId);
        setServices(partnerServices);
      } catch (error) {
        console.error('Failed to load services:', error);
      }
    };
    
    loadServices();
  }, [partnerId]);
  
  const handleSaveService = async (serviceData) => {
    setIsSaving(true);
    try {
      const savedService = editingService
        ? await updateService(editingService.id, serviceData)
        : await createService({ ...serviceData, partnerId });
      
      if (editingService) {
        setServices(prev => prev.map(s => 
          s.id === editingService.id ? savedService : s
        ));
      } else {
        setServices(prev => [...prev, savedService]);
      }
      
      setEditingService(null);
    } catch (error) {
      console.error('Failed to save service:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteService = async (serviceId) => {
    try {
      await deleteService(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (error) {
      console.error('Failed to delete service:', error);
      throw error;
    }
  };
  
  return (
    <div className="service-catalog-manager">
      <div className="service-list">
        <h2>Service Catalog</h2>
        <SolidButton onClick={() => setEditingService({})}>
          Add New Service
        </SolidButton>
        
        <div className="services">
          {services.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={() => setEditingService(service)}
              onDelete={() => handleDeleteService(service.id)}
            />
          ))}
        </div>
      </div>
      
      {editingService && (
        <ServiceEditor
          service={editingService}
          onSave={handleSaveService}
          onCancel={() => setEditingService(null)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
```

### Service Categories

Services are categorized to help clients find the right partner.

```javascript
const SERVICE_CATEGORIES = [
  { id: 'mechanic', name: 'Mechanic', icon: '🔧' },
  { id: 'body', name: 'Body Shop', icon: '🚗' },
  { id: 'paint', name: 'Paint Shop', icon: '🎨' },
  { id: 'electrical', name: 'Electrical', icon: '⚡' },
  { id: 'tires', name: 'Tires', icon: '🛞' },
  { id: 'washing', name: 'Washing', icon: '💧' }
];

const ServiceCategorySelector = ({ selectedCategory, onChange }) => {
  return (
    <div className="service-category-selector">
      <label>Select Service Category</label>
      <div className="category-options">
        {SERVICE_CATEGORIES.map(category => (
          <div
            key={category.id}
            className={`category-option ${
              selectedCategory === category.id ? 'selected' : ''
            }`}
            onClick={() => onChange(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## Quote Creation and Management

### Quote Generation

Partners create quotes based on client requests and vehicle inspections.

```jsx
const QuoteGenerator = ({ serviceOrderId, vehicleId, partnerId }) => {
  const [quote, setQuote] = useState({
    service_order_id: serviceOrderId,
    partner_id: partnerId,
    status: 'draft',
    items: [],
    total_value: 0
  });
  
  const [selectedServices, setSelectedServices] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleServiceSelection = (service, isSelected) => {
    if (isSelected) {
      setSelectedServices(prev => [...prev, service]);
    } else {
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    }
  };
  
  const handleGenerateQuote = async () => {
    setIsGenerating(true);
    try {
      // Calculate totals
      const items = selectedServices.map(service => ({
        service_id: service.id,
        description: service.description,
        quantity: 1,
        unit_price: service.price,
        total_price: service.price
      }));
      
      const totalValue = items.reduce((sum, item) => sum + item.total_price, 0);
      
      // Generate quote
      const newQuote = await createQuote({
        service_order_id: serviceOrderId,
        partner_id: partnerId,
        status: 'pending_admin_approval',
        total_value: totalValue,
        items: items
      });
      
      setQuote(newQuote);
    } catch (error) {
      console.error('Failed to generate quote:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="quote-generator">
      <ServiceSelector
        partnerId={partnerId}
        selectedServices={selectedServices}
        onServiceToggle={handleServiceSelection}
      />
      
      <QuotePreview
        items={quote.items}
        totalValue={quote.total_value}
      />
      
      <div className="quote-actions">
        <OutlineButton onClick={() => router.back()}>
          Cancel
        </OutlineButton>
        <SolidButton
          onClick={handleGenerateQuote}
          disabled={selectedServices.length === 0 || isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Quote'}
        </SolidButton>
      </div>
    </div>
  );
};
```

### Quote Approval Workflow

Quotes go through an approval process involving admins and clients.

```javascript
const QuoteApprovalWorkflow = ({ quoteId }) => {
  const [quote, setQuote] = useState(null);
  const [approvalStep, setApprovalStep] = useState('admin'); // admin, client
  
  useEffect(() => {
    const loadQuote = async () => {
      try {
        const quoteData = await fetchQuote(quoteId);
        setQuote(quoteData);
        
        // Determine current approval step
        if (quoteData.status === 'pending_admin_approval') {
          setApprovalStep('admin');
        } else if (quoteData.status === 'pending_client_approval') {
          setApprovalStep('client');
        }
      } catch (error) {
        console.error('Failed to load quote:', error);
      }
    };
    
    loadQuote();
  }, [quoteId]);
  
  const handleAdminApproval = async (decision, notes) => {
    try {
      if (decision === 'approve') {
        await approveQuoteByAdmin(quoteId, notes);
        setApprovalStep('client');
      } else if (decision === 'reject') {
        await rejectQuoteByAdmin(quoteId, notes);
        // Handle rejection
      }
    } catch (error) {
      console.error('Admin approval failed:', error);
      throw error;
    }
  };
  
  const handleClientApproval = async (decision, notes) => {
    try {
      if (decision === 'approve') {
        await approveQuoteByClient(quoteId, notes);
        // Quote approved, proceed to service order
      } else if (decision === 'reject') {
        await rejectQuoteByClient(quoteId, notes);
        // Handle rejection
      }
    } catch (error) {
      console.error('Client approval failed:', error);
      throw error;
    }
  };
  
  if (!quote) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="quote-approval-workflow">
      <QuoteDetails quote={quote} />
      
      {approvalStep === 'admin' && (
        <AdminApprovalStep
          quote={quote}
          onApprove={handleAdminApproval}
          onReject={handleAdminApproval}
        />
      )}
      
      {approvalStep === 'client' && (
        <ClientApprovalStep
          quote={quote}
          onApprove={handleClientApproval}
          onReject={handleClientApproval}
        />
      )}
    </div>
  );
};
```

## Checklist Workflow

### Checklist Initialization

Checklists are initialized based on service categories and contexts.

```javascript
const initializeChecklist = async ({ vehicleId, context, category, partnerId }) => {
  try {
    // Check if checklist already exists
    const existingChecklist = await findExistingChecklist({
      vehicle_id: vehicleId,
      context_type: context.type,
      context_id: context.id,
      category: category,
      partner_id: partnerId
    });
    
    if (existingChecklist) {
      return existingChecklist;
    }
    
    // Create new checklist from template
    const template = await fetchChecklistTemplate(category);
    
    const newChecklist = await createChecklist({
      vehicle_id: vehicleId,
      context_type: context.type,
      context_id: context.id,
      category: category,
      partner_id: partnerId,
      template_version: template.version,
      status: 'draft'
    });
    
    // Initialize checklist items from template
    const checklistItems = await Promise.all(
      template.items.map(item => 
        createChecklistItem({
          checklist_id: newChecklist.id,
          item_key: item.key,
          status: 'NA', // Not applicable until inspected
          template_item_id: item.id
        })
      )
    );
    
    return {
      ...newChecklist,
      items: checklistItems
    };
  } catch (error) {
    console.error('Checklist initialization failed:', error);
    throw error;
  }
};
```

### Checklist Completion

Partners complete checklists by filling items and adding evidence.

```jsx
const ChecklistCompletion = ({ vehicleId, context, category, partnerId }) => {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    const loadChecklist = async () => {
      try {
        setLoading(true);
        const checklistData = await initializeChecklist({
          vehicleId,
          context,
          category,
          partnerId
        });
        setChecklist(checklistData);
      } catch (error) {
        console.error('Failed to load checklist:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChecklist();
  }, [vehicleId, context, category, partnerId]);
  
  const handleItemUpdate = async (itemKey, updates) => {
    try {
      const updatedItem = await updateChecklistItem({
        checklist_id: checklist.id,
        item_key: itemKey,
        ...updates
      });
      
      setChecklist(prev => ({
        ...prev,
        items: prev.items.map(item =>
          item.item_key === itemKey ? updatedItem : item
        )
      }));
    } catch (error) {
      console.error('Failed to update checklist item:', error);
      throw error;
    }
  };
  
  const handleEvidenceUpload = async (itemKey, file) => {
    try {
      // Upload file and get URL
      const { uploadUrl, mediaUrl } = await getUploadUrl({
        contentType: file.type,
        fileName: file.name
      });
      
      // Upload file
      await uploadFile(uploadUrl, file);
      
      // Create evidence record
      const evidence = await createEvidence({
        checklist_id: checklist.id,
        item_key: itemKey,
        media_url: mediaUrl,
        media_type: getFileType(file.type)
      });
      
      // Update checklist with new evidence
      setChecklist(prev => ({
        ...prev,
        evidences: [...(prev.evidences || []), evidence]
      }));
    } catch (error) {
      console.error('Failed to upload evidence:', error);
      throw error;
    }
  };
  
  const handleSaveChecklist = async () => {
    setSaving(true);
    try {
      await saveChecklist(checklist.id);
    } catch (error) {
      console.error('Failed to save checklist:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };
  
  const handleSubmitChecklist = async () => {
    setSaving(true);
    try {
      await submitChecklist(checklist.id);
      setChecklist(prev => ({ ...prev, status: 'submitted' }));
    } catch (error) {
      console.error('Failed to submit checklist:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <LoadingSpinner message="Loading checklist..." />;
  }
  
  if (!checklist) {
    return <ErrorMessage message="Failed to load checklist" />;
  }
  
  return (
    <div className="checklist-completion">
      <ChecklistHeader
        vehicle={checklist.vehicle}
        partner={checklist.partner}
        category={category}
        status={checklist.status}
      />
      
      <ChecklistGroups
        groups={checklist.groups}
        items={checklist.items}
        evidences={checklist.evidences}
        onItemUpdate={handleItemUpdate}
        onEvidenceUpload={handleEvidenceUpload}
      />
      
      <ChecklistActions
        status={checklist.status}
        onSave={handleSaveChecklist}
        onSubmit={handleSubmitChecklist}
        saving={saving}
      />
    </div>
  );
};
```

### Evidence Management

Managing evidence collection and storage.

```jsx
const EvidenceManager = ({ checklistId, itemKey, onEvidenceAdded }) => {
  const [evidences, setEvidences] = useState([]);
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    const loadEvidences = async () => {
      try {
        const itemEvidences = await fetchEvidences({
          checklist_id: checklistId,
          item_key: itemKey
        });
        setEvidences(itemEvidences);
      } catch (error) {
        console.error('Failed to load evidences:', error);
      }
    };
    
    loadEvidences();
  }, [checklistId, itemKey]);
  
  const handleFileUpload = async (file) => {
    if (!isValidFileType(file)) {
      throw new Error('Invalid file type. Please upload JPG, PNG, or MP4 files.');
    }
    
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum file size is 10MB.');
    }
    
    setUploading(true);
    try {
      // Get signed upload URL
      const { uploadUrl, mediaUrl } = await getSignedUploadUrl({
        contentType: file.type,
        fileName: file.name,
        fileSize: file.size
      });
      
      // Upload file directly to storage
      await uploadFileToStorage(uploadUrl, file);
      
      // Create evidence record
      const evidence = await createEvidenceRecord({
        checklist_id: checklistId,
        item_key: itemKey,
        media_url: mediaUrl,
        media_type: getFileType(file.type),
        file_name: file.name,
        file_size: file.size
      });
      
      setEvidences(prev => [...prev, evidence]);
      onEvidenceAdded(evidence);
    } catch (error) {
      console.error('Failed to upload evidence:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteEvidence = async (evidenceId) => {
    try {
      await deleteEvidence(evidenceId);
      setEvidences(prev => prev.filter(e => e.id !== evidenceId));
    } catch (error) {
      console.error('Failed to delete evidence:', error);
      throw error;
    }
  };
  
  return (
    <div className="evidence-manager">
      <div className="evidence-gallery">
        {evidences.map(evidence => (
          <EvidenceCard
            key={evidence.id}
            evidence={evidence}
            onDelete={() => handleDeleteEvidence(evidence.id)}
          />
        ))}
      </div>
      
      <div className="evidence-upload">
        <FileUpload
          onFileSelect={handleFileUpload}
          uploading={uploading}
          accept={['image/jpeg', 'image/png', 'video/mp4']}
          maxSize={MAX_FILE_SIZE}
        />
      </div>
    </div>
  );
};

const isValidFileType = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'video/mp4'];
  return validTypes.includes(file.type);
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
```

## Part Request Workflow

### Part Request Creation

Partners can request parts during checklist completion.

```jsx
const PartRequestManager = ({ checklistId, itemKey, onPartRequestCreated }) => {
  const [partRequest, setPartRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    const loadPartRequest = async () => {
      try {
        const existingRequest = await findPartRequest({
          checklist_id: checklistId,
          item_key: itemKey
        });
        setPartRequest(existingRequest);
      } catch (error) {
        console.error('Failed to load part request:', error);
      }
    };
    
    loadPartRequest();
  }, [checklistId, itemKey]);
  
  const handleCreatePartRequest = async (requestData) => {
    try {
      const newPartRequest = await createPartRequest({
        checklist_id: checklistId,
        item_key: itemKey,
        ...requestData,
        status: 'draft'
      });
      
      setPartRequest(newPartRequest);
      onPartRequestCreated(newPartRequest);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to create part request:', error);
      throw error;
    }
  };
  
  const handleUpdatePartRequest = async (updates) => {
    try {
      const updatedPartRequest = await updatePartRequest(partRequest.id, updates);
      setPartRequest(updatedPartRequest);
    } catch (error) {
      console.error('Failed to update part request:', error);
      throw error;
    }
  };
  
  const handleSendPartRequest = async () => {
    try {
      const sentRequest = await sendPartRequest(partRequest.id);
      setPartRequest(sentRequest);
    } catch (error) {
      console.error('Failed to send part request:', error);
      throw error;
    }
  };
  
  return (
    <div className="part-request-manager">
      {!partRequest ? (
        <SolidButton
          onClick={() => setIsModalOpen(true)}
          icon={<PlusIcon />}
        >
          Request Part
        </SolidButton>
      ) : (
        <PartRequestCard
          partRequest={partRequest}
          onUpdate={handleUpdatePartRequest}
          onSend={handleSendPartRequest}
        />
      )}
      
      <PartRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreatePartRequest}
      />
    </div>
  );
};
```

### Part Request Approval

Admins review and approve part requests.

```jsx
const PartRequestApproval = ({ partRequestId }) => {
  const [partRequest, setPartRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadPartRequest = async () => {
      try {
        setLoading(true);
        const request = await fetchPartRequest(partRequestId);
        setPartRequest(request);
      } catch (error) {
        console.error('Failed to load part request:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadPartRequest();
  }, [partRequestId]);
  
  const handleApproval = async (decision, notes) => {
    try {
      const updatedRequest = await updatePartRequestStatus(partRequestId, {
        status: decision,
        admin_notes: notes,
        updated_at: new Date().toISOString()
      });
      
      setPartRequest(updatedRequest);
    } catch (error) {
      console.error('Failed to approve part request:', error);
      throw error;
    }
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!partRequest) {
    return <ErrorMessage message="Part request not found" />;
  }
  
  return (
    <div className="part-request-approval">
      <PartRequestDetails partRequest={partRequest} />
      
      {partRequest.status === 'draft' && (
        <PartRequestApprovalForm
          partRequest={partRequest}
          onApprove={(notes) => handleApproval('approved', notes)}
          onReject={(notes) => handleApproval('rejected', notes)}
        />
      )}
      
      {(partRequest.status === 'approved' || partRequest.status === 'rejected') && (
        <PartRequestStatusMessage
          status={partRequest.status}
          notes={partRequest.admin_notes}
        />
      )}
    </div>
  );
};
```

## Service Delivery Workflow

### Service Order Creation

Once quotes are approved, service orders are created.

```javascript
const createServiceOrder = async (approvedQuote) => {
  try {
    // Create service order from approved quote
    const serviceOrder = await createServiceOrderRecord({
      vehicle_id: approvedQuote.service_order.vehicle_id,
      client_id: approvedQuote.service_order.client_id,
      quote_id: approvedQuote.id,
      status: 'pending_scheduling',
      priority: 'normal',
      created_by: 'system'
    });
    
    // Create individual services from quote items
    const services = await Promise.all(
      approvedQuote.items.map(item => 
        createServiceRecord({
          service_order_id: serviceOrder.id,
          service_category: approvedQuote.partner.category,
          description: item.description,
          estimated_days: getEstimatedDays(item.description),
          value: item.unit_price,
          status: 'pending'
        })
      )
    );
    
    // Create service order items
    const serviceOrderItems = await Promise.all(
      approvedQuote.items.map((item, index) => 
        createServiceOrderItem({
          service_order_id: serviceOrder.id,
          service_id: services[index].id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })
      )
    );
    
    return {
      serviceOrder,
      services,
      serviceOrderItems
    };
  } catch (error) {
    console.error('Failed to create service order:', error);
    throw error;
  }
};
```

### Scheduling and Execution

Scheduling services and tracking execution.

```jsx
const ServiceScheduler = ({ serviceOrderId }) => {
  const [serviceOrder, setServiceOrder] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [isScheduling, setIsScheduling] = useState(false);
  
  useEffect(() => {
    const loadServiceOrder = async () => {
      try {
        const order = await fetchServiceOrder(serviceOrderId);
        setServiceOrder(order);
        
        const existingSchedule = await fetchSchedule(serviceOrderId);
        setSchedule(existingSchedule);
      } catch (error) {
        console.error('Failed to load service order:', error);
      }
    };
    
    loadServiceOrder();
  }, [serviceOrderId]);
  
  const handleScheduleService = async (scheduleData) => {
    setIsScheduling(true);
    try {
      const newSchedule = await createSchedule({
        service_order_id: serviceOrderId,
        ...scheduleData,
        status: 'scheduled'
      });
      
      setSchedule(newSchedule);
      
      // Update service order status
      await updateServiceOrderStatus(serviceOrderId, 'scheduled');
    } catch (error) {
      console.error('Failed to schedule service:', error);
      throw error;
    } finally {
      setIsScheduling(false);
    }
  };
  
  const handleStartService = async () => {
    try {
      await updateServiceOrderStatus(serviceOrderId, 'in_progress');
      setServiceOrder(prev => ({ ...prev, status: 'in_progress' }));
    } catch (error) {
      console.error('Failed to start service:', error);
      throw error;
    }
  };
  
  const handleCompleteService = async () => {
    try {
      await updateServiceOrderStatus(serviceOrderId, 'completed');
      setServiceOrder(prev => ({ ...prev, status: 'completed' }));
    } catch (error) {
      console.error('Failed to complete service:', error);
      throw error;
    }
  };
  
  if (!serviceOrder) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="service-scheduler">
      <ServiceOrderHeader serviceOrder={serviceOrder} />
      
      {!schedule ? (
        <ScheduleForm
          serviceOrder={serviceOrder}
          onSchedule={handleScheduleService}
          isScheduling={isScheduling}
        />
      ) : (
        <ScheduleDetails
          schedule={schedule}
          onStartService={handleStartService}
          onCompleteService={handleCompleteService}
          serviceOrderStatus={serviceOrder.status}
        />
      )}
    </div>
  );
};
```

## Timeline and Status Tracking

### Timeline Management

Tracking the progression of partner workflows through a timeline.

```jsx
const PartnerTimeline = ({ vehicleId, serviceOrderId }) => {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadTimeline = async () => {
      try {
        setLoading(true);
        const events = await fetchTimelineEvents({
          vehicle_id: vehicleId,
          service_order_id: serviceOrderId
        });
        setTimelineEvents(events);
      } catch (error) {
        console.error('Failed to load timeline:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadTimeline();
  }, [vehicleId, serviceOrderId]);
  
  const addTimelineEvent = async (eventData) => {
    try {
      const newEvent = await createTimelineEvent({
        vehicle_id: vehicleId,
        service_order_id: serviceOrderId,
        ...eventData
      });
      
      setTimelineEvents(prev => [...prev, newEvent]);
    } catch (error) {
      console.error('Failed to add timeline event:', error);
      throw error;
    }
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="partner-timeline">
      <h3>Service Timeline</h3>
      <Timeline
        events={timelineEvents}
        onEventAdd={addTimelineEvent}
      />
    </div>
  );
};
```

### Status Notifications

Sending notifications for status changes.

```javascript
const notifyStatusChange = async ({ eventType, entityId, recipients, metadata }) => {
  try {
    // Create timeline event
    const timelineEvent = await createTimelineEvent({
      event_type: eventType,
      entity_id: entityId,
      metadata: metadata
    });
    
    // Send notifications to recipients
    await Promise.all(
      recipients.map(recipient => 
        sendNotification({
          recipient_id: recipient.id,
          recipient_type: recipient.type,
          event_type: eventType,
          entity_id: entityId,
          message: generateNotificationMessage(eventType, metadata),
          timeline_event_id: timelineEvent.id
        })
      )
    );
    
    return timelineEvent;
  } catch (error) {
    console.error('Failed to notify status change:', error);
    throw error;
  }
};

const generateNotificationMessage = (eventType, metadata) => {
  const messages = {
    'quote_created': `New quote created for ${metadata.vehicle_plate}`,
    'quote_approved_admin': `Quote approved by admin for ${metadata.vehicle_plate}`,
    'quote_approved_client': `Quote approved by client for ${metadata.vehicle_plate}`,
    'checklist_submitted': `Checklist submitted for ${metadata.vehicle_plate}`,
    'service_scheduled': `Service scheduled for ${metadata.vehicle_plate}`,
    'service_started': `Service started for ${metadata.vehicle_plate}`,
    'service_completed': `Service completed for ${metadata.vehicle_plate}`
  };
  
  return messages[eventType] || 'Status updated';
};
```

## Integration Points

### API Integration

Key API endpoints for partner workflow integration:

```javascript
// Partner service endpoints
const partnerAPI = {
  // Partner management
  registerPartner: (data) => api.post('/api/partner/register', data),
  verifyPartner: (partnerId, code) => api.post(`/api/partner/${partnerId}/verify`, { code }),
  updatePartnerProfile: (partnerId, data) => api.put(`/api/partner/${partnerId}/profile`, data),
  
  // Service catalog
  getServices: (partnerId) => api.get(`/api/partner/${partnerId}/services`),
  createService: (partnerId, data) => api.post(`/api/partner/${partnerId}/services`, data),
  updateService: (serviceId, data) => api.put(`/api/partner/services/${serviceId}`, data),
  deleteService: (serviceId) => api.delete(`/api/partner/services/${serviceId}`),
  
  // Quote management
  getQuotes: (partnerId) => api.get(`/api/partner/${partnerId}/quotes`),
  createQuote: (data) => api.post('/api/partner/quotes', data),
  updateQuote: (quoteId, data) => api.put(`/api/partner/quotes/${quoteId}`, data),
  approveQuote: (quoteId) => api.post(`/api/partner/quotes/${quoteId}/approve`),
  rejectQuote: (quoteId) => api.post(`/api/partner/quotes/${quoteId}/reject`),
  
  // Checklist operations
  getChecklist: (params) => api.post('/api/partner/checklist/load', params),
  saveChecklist: (data) => api.post('/api/partner/checklist/save', data),
  submitChecklist: (data) => api.put('/api/partner/checklist/submit', data),
  uploadEvidence: (data) => api.post('/api/partner/evidences/upload', data),
  
  // Part requests
  getPartRequests: (checklistId) => api.get(`/api/partner/checklist/${checklistId}/part-requests`),
  createPartRequest: (checklistId, data) => api.post(`/api/partner/checklist/${checklistId}/part-requests`, data),
  updatePartRequest: (requestId, data) => api.put(`/api/partner/part-requests/${requestId}`, data),
  sendPartRequest: (requestId) => api.post(`/api/partner/part-requests/${requestId}/send`),
  
  // Service orders
  getServiceOrders: (partnerId) => api.get(`/api/partner/${partnerId}/service-orders`),
  updateServiceOrder: (orderId, data) => api.put(`/api/partner/service-orders/${orderId}`, data),
  scheduleService: (orderId, data) => api.post(`/api/partner/service-orders/${orderId}/schedule`, data),
  startService: (orderId) => api.post(`/api/partner/service-orders/${orderId}/start`),
  completeService: (orderId) => api.post(`/api/partner/service-orders/${orderId}/complete`)
};
```

### Hook Integration

Custom hooks for managing partner workflow state:

```javascript
// Custom hook for partner data
const usePartnerData = (partnerId) => {
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadPartner = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await partnerAPI.getPartner(partnerId);
        setPartner(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    
    if (partnerId) {
      loadPartner();
    }
  }, [partnerId]);
  
  const updatePartner = async (data) => {
    try {
      const updatedPartner = await partnerAPI.updatePartner(partnerId, data);
      setPartner(updatedPartner);
      return updatedPartner;
    } catch (error) {
      setError(error);
      throw error;
    }
  };
  
  return { partner, loading, error, updatePartner };
};

// Custom hook for service catalog
const useServiceCatalog = (partnerId) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const data = await partnerAPI.getServices(partnerId);
        setServices(data);
      } catch (error) {
        console.error('Failed to load services:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadServices();
  }, [partnerId]);
  
  const createService = async (serviceData) => {
    try {
      const newService = await partnerAPI.createService(partnerId, serviceData);
      setServices(prev => [...prev, newService]);
      return newService;
    } catch (error) {
      console.error('Failed to create service:', error);
      throw error;
    }
  };
  
  const updateService = async (serviceId, serviceData) => {
    try {
      const updatedService = await partnerAPI.updateService(serviceId, serviceData);
      setServices(prev => 
        prev.map(service => 
          service.id === serviceId ? updatedService : service
        )
      );
      return updatedService;
    } catch (error) {
      console.error('Failed to update service:', error);
      throw error;
    }
  };
  
  const deleteService = async (serviceId) => {
    try {
      await partnerAPI.deleteService(serviceId);
      setServices(prev => prev.filter(service => service.id !== serviceId));
    } catch (error) {
      console.error('Failed to delete service:', error);
      throw error;
    }
  };
  
  return {
    services,
    loading,
    createService,
    updateService,
    deleteService
  };
};
```

## Error Handling and Validation

### Form Validation

Comprehensive validation for partner workflow forms:

```javascript
const validatePartnerRegistration = (data) => {
  const errors = {};
  
  // Required fields
  if (!data.companyName) {
    errors.companyName = 'Company name is required';
  }
  
  if (!data.cnpj) {
    errors.cnpj = 'CNPJ is required';
  } else if (!isValidCNPJ(data.cnpj)) {
    errors.cnpj = 'Invalid CNPJ format';
  }
  
  if (!data.email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Invalid email format';
  }
  
  if (!data.phone) {
    errors.phone = 'Phone is required';
  }
  
  // Optional fields with constraints
  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateServiceCreation = (data) => {
  const errors = {};
  
  if (!data.name) {
    errors.name = 'Service name is required';
  }
  
  if (!data.price) {
    errors.price = 'Price is required';
  } else if (isNaN(data.price) || data.price <= 0) {
    errors.price = 'Price must be a positive number';
  }
  
  if (!data.description) {
    errors.description = 'Description is required';
  }
  
  if (!data.category) {
    errors.category = 'Category is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateQuoteCreation = (data) => {
  const errors = {};
  
  if (!data.items || data.items.length === 0) {
    errors.items = 'At least one service must be selected';
  }
  
  if (data.items) {
    data.items.forEach((item, index) => {
      if (!item.service_id) {
        errors[`item_${index}_service`] = 'Service selection is required';
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      
      if (!item.unit_price || item.unit_price <= 0) {
        errors[`item_${index}_price`] = 'Price must be greater than 0';
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

### Error Boundary Implementation

Error boundaries for graceful error handling:

```jsx
class PartnerWorkflowErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to monitoring service
    logError({
      error: error,
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userId: getCurrentUserId(),
      url: window.location.href
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong with the partner workflow</h2>
          <p>We've been notified of this issue and are working to fix it.</p>
          
          <div className="error-details">
            <SolidButton onClick={() => window.location.reload()}>
              Reload Page
            </SolidButton>
            
            <OutlineButton onClick={() => window.history.back()}>
              Go Back
            </OutlineButton>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="error-debug">
              <summary>Debug Information</summary>
              <pre>{this.state.error?.toString()}</pre>
              <pre>{this.state.errorInfo?.componentStack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Usage
const PartnerWorkflowWrapper = () => {
  return (
    <PartnerWorkflowErrorBoundary>
      <PartnerWorkflow />
    </PartnerWorkflowErrorBoundary>
  );
};
```

## Performance Optimization

### Data Fetching Optimization

Optimizing data fetching for better performance:

```javascript
// Use SWR for data caching and revalidation
import useSWR from 'swr';

const usePartnerServices = (partnerId) => {
  const { data, error, mutate } = useSWR(
    partnerId ? [`/api/partner/${partnerId}/services`] : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds
      refreshInterval: 0 // Disable automatic refresh
    }
  );
  
  return {
    services: data,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  };
};

// Prefetch data for smoother navigation
const prefetchPartnerData = async (partnerId) => {
  try {
    // Prefetch services
    await prefetch(`/api/partner/${partnerId}/services`);
    
    // Prefetch recent quotes
    await prefetch(`/api/partner/${partnerId}/quotes?limit=10`);
    
    // Prefetch service orders
    await prefetch(`/api/partner/${partnerId}/service-orders?limit=10`);
  } catch (error) {
    console.warn('Failed to prefetch partner data:', error);
  }
};
```

### Lazy Loading and Code Splitting

Splitting code for faster initial loads:

```jsx
// Lazy load heavy components
const HeavyChecklistComponent = lazy(() => 
  import('@/modules/partner/components/checklist/HeavyChecklistComponent')
);

const PartnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('services');
  
  return (
    <div className="partner-dashboard">
      <PartnerTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="tab-content">
        {activeTab === 'services' && (
          <Suspense fallback={<LoadingSpinner />}>
            <ServiceCatalogManager />
          </Suspense>
        )}
        
        {activeTab === 'quotes' && (
          <Suspense fallback={<LoadingSpinner />}>
            <QuoteManager />
          </Suspense>
        )}
        
        {activeTab === 'checklists' && (
          <Suspense fallback={<LoadingSpinner />}>
            <HeavyChecklistComponent />
          </Suspense>
        )}
      </div>
    </div>
  );
};
```

## Testing and Quality Assurance

### Unit Testing

Testing individual components and functions:

```javascript
// Partner service tests
describe('Partner Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should create partner with valid data', async () => {
    const partnerData = {
      companyName: 'Test Company',
      cnpj: '12.345.678/0001-90',
      email: 'test@test.com',
      phone: '(11) 99999-9999'
    };
    
    const mockResponse = {
      id: 'partner-123',
      ...partnerData,
      status: 'pending_verification'
    };
    
    partnerAPI.registerPartner.mockResolvedValue(mockResponse);
    
    const result = await registerPartner(partnerData);
    
    expect(result.success).toBe(true);
    expect(result.partnerId).toBe('partner-123');
    expect(partnerAPI.registerPartner).toHaveBeenCalledWith(partnerData);
  });
  
  test('should validate required fields', () => {
    const invalidData = {
      email: 'test@test.com'
    };
    
    const { isValid, errors } = validatePartnerRegistration(invalidData);
    
    expect(isValid).toBe(false);
    expect(errors.companyName).toBe('Company name is required');
    expect(errors.cnpj).toBe('CNPJ is required');
    expect(errors.phone).toBe('Phone is required');
  });
  
  test('should handle duplicate partner', async () => {
    const partnerData = {
      companyName: 'Test Company',
      cnpj: '12.345.678/0001-90',
      email: 'test@test.com',
      phone: '(11) 99999-9999'
    };
    
    partnerAPI.registerPartner.mockRejectedValue(
      new Error('A partner with this CNPJ already exists')
    );
    
    await expect(registerPartner(partnerData)).rejects.toThrow(
      'A partner with this CNPJ already exists'
    );
  });
});
```

### Integration Testing

Testing component interactions:

```javascript
// Integration tests for checklist workflow
describe('Checklist Workflow', () => {
  test('should initialize checklist with template items', async () => {
    render(
      <ChecklistCompletion
        vehicleId="vehicle-123"
        context={{ type: 'quote', id: 'quote-456' }}
        category="mechanic"
        partnerId="partner-789"
      />
    );
    
    // Wait for checklist to load
    await waitFor(() => {
      expect(screen.getByText('Engine Oil Level')).toBeInTheDocument();
      expect(screen.getByText('Brake Fluid Level')).toBeInTheDocument();
    });
    
    // Verify checklist items are created
    expect(checklistAPI.createChecklist).toHaveBeenCalledWith({
      vehicle_id: 'vehicle-123',
      context_type: 'quote',
      context_id: 'quote-456',
      category: 'mechanic',
      partner_id: 'partner-789',
      template_version: 'v1',
      status: 'draft'
    });
  });
  
  test('should save checklist with evidence', async () => {
    const user = userEvent.setup();
    
    render(
      <ChecklistCompletion
        vehicleId="vehicle-123"
        context={{ type: 'quote', id: 'quote-456' }}
        category="mechanic"
        partnerId="partner-789"
      />
    );
    
    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    });
    
    // Fill in some checklist items
    await user.selectOptions(
      screen.getByLabelText('Engine Oil Level'),
      'OK'
    );
    
    // Save checklist
    await user.click(screen.getByRole('button', { name: /save/i }));
    
    // Verify save API was called
    expect(checklistAPI.saveChecklist).toHaveBeenCalled();
  });
});
```

## Monitoring and Analytics

### Performance Monitoring

Monitoring application performance:

```javascript
// Performance monitoring utility
const monitorWorkflowPerformance = (workflowName) => {
  const startTime = performance.now();
  
  return {
    end: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Send timing data to analytics
      analytics.track('workflow_performance', {
        workflow_name: workflowName,
        duration_ms: duration,
        timestamp: new Date().toISOString()
      });
      
      // Log performance issues
      if (duration > 5000) { // 5 seconds threshold
        console.warn(`Slow workflow detected: ${workflowName} took ${duration}ms`);
      }
    }
  };
};

// Usage in workflow components
const PartnerDashboard = () => {
  const performanceMonitor = useMemo(
    () => monitorWorkflowPerformance('partner_dashboard_load'),
    []
  );
  
  useEffect(() => {
    return () => {
      performanceMonitor.end();
    };
  }, [performanceMonitor]);
  
  // Component implementation
};
```

### User Behavior Analytics

Tracking user interactions:

```javascript
// Analytics tracking for partner workflows
const trackPartnerInteraction = (action, properties = {}) => {
  analytics.track('partner_interaction', {
    action,
    partner_id: getCurrentPartnerId(),
    timestamp: new Date().toISOString(),
    ...properties
  });
};

// Track checklist completion
const trackChecklistCompletion = (checklistId, itemsCompleted, totalTime) => {
  trackPartnerInteraction('checklist_completed', {
    checklist_id: checklistId,
    items_completed: itemsCompleted,
    total_time_minutes: totalTime,
    completion_rate: calculateCompletionRate(itemsCompleted)
  });
};

// Track quote creation
const trackQuoteCreation = (quoteId, servicesIncluded, totalValue) => {
  trackPartnerInteraction('quote_created', {
    quote_id: quoteId,
    services_included: servicesIncluded,
    total_value: totalValue,
    average_service_value: totalValue / servicesIncluded.length
  });
};
```

## Security Considerations

### Authentication and Authorization

Ensuring proper access control:

```javascript
// Role-based access control for partner workflows
const usePartnerAuthorization = (requiredPermissions) => {
  const { user, isAuthenticated } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        setLoading(true);
        
        if (!isAuthenticated) {
          setIsAuthorized(false);
          return;
        }
        
        // Check if user has required permissions
        const hasPermission = await checkUserPermissions(user.id, requiredPermissions);
        setIsAuthorized(hasPermission);
      } catch (error) {
        console.error('Authorization check failed:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthorization();
  }, [user, isAuthenticated, requiredPermissions]);
  
  return { isAuthorized, loading };
};

// Usage in partner components
const PartnerDashboard = () => {
  const { isAuthorized, loading } = usePartnerAuthorization(['manage_services', 'create_quotes']);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthorized) {
    return <UnauthorizedMessage />;
  }
  
  return (
    <div className="partner-dashboard">
      {/* Dashboard content */}
    </div>
  );
};
```

### Data Protection

Protecting sensitive partner and client data:

```javascript
// Data encryption for sensitive information
const encryptSensitiveData = (data) => {
  // Encrypt sensitive fields
  const encryptedData = {
    ...data,
    cnpj: encrypt(data.cnpj),
    bank_account: data.bank_account ? encrypt(data.bank_account) : undefined,
    tax_documents: data.tax_documents ? encrypt(data.tax_documents) : undefined
  };
  
  return encryptedData;
};

// Data access logging
const logDataAccess = (userId, resourceId, action) => {
  auditLogger.info('data_access', {
    user_id: userId,
    resource_id: resourceId,
    action: action,
    timestamp: new Date().toISOString(),
    ip_address: getClientIpAddress()
  });
};

// Usage in data access functions
const fetchPartnerData = async (partnerId, requestingUserId) => {
  try {
    // Log access attempt
    logDataAccess(requestingUserId, partnerId, 'read');
    
    // Check authorization
    const isAuthorized = await checkAuthorization(requestingUserId, partnerId, 'read');
    if (!isAuthorized) {
      throw new Error('Unauthorized access to partner data');
    }
    
    // Fetch and decrypt data
    const encryptedData = await database.fetchPartner(partnerId);
    const decryptedData = decryptSensitiveData(encryptedData);
    
    return decryptedData;
  } catch (error) {
    console.error('Failed to fetch partner data:', error);
    throw error;
  }
};
```

## Conclusion

This integration guide provides a comprehensive overview of the partner workflow in ProLine Hub, covering registration, service management, quote creation, checklist completion, and service delivery. By following these patterns and best practices, developers can create robust, performant, and maintainable partner workflow implementations.

Key takeaways:

1. **Modular Architecture**: Break workflows into manageable components
2. **Error Handling**: Implement comprehensive error handling and validation
3. **Performance**: Optimize data fetching and component loading
4. **Security**: Ensure proper authentication and data protection
5. **Testing**: Write comprehensive tests for all workflow components
6. **Monitoring**: Track performance and user behavior
7. **Accessibility**: Ensure workflows are usable by everyone

Regular review and updates to these patterns will help maintain a high-quality partner experience in the ProLine Hub system.