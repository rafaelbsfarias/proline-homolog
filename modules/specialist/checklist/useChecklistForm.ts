import { useState } from 'react';
import { buildDefaultForm, ChecklistForm, formatDateYYYYMMDD } from './types';

export const useChecklistForm = () => {
  const [form, setForm] = useState<ChecklistForm>(buildDefaultForm(formatDateYYYYMMDD()));

  const setField = (name: keyof ChecklistForm, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const setServiceFlag = (key: keyof ChecklistForm['services'], required: boolean) => {
    setForm(prev => ({
      ...prev,
      services: { ...prev.services, [key]: { ...prev.services[key], required } },
    }));
  };

  const setServiceNotes = (key: keyof ChecklistForm['services'], notes: string) => {
    setForm(prev => ({
      ...prev,
      services: { ...prev.services, [key]: { ...prev.services[key], notes } },
    }));
  };

  const resetForm = () => setForm(buildDefaultForm(formatDateYYYYMMDD()));

  return { form, setField, setServiceFlag, setServiceNotes, resetForm };
};
