import React from 'react';
import type { AddressItem } from '@/modules/client/types';

export function addressLabel(a: AddressItem): string {
  const street = a.street || '';
  const number = a.number ? `, ${a.number}` : '';
  const city = a.city ? ` - ${a.city}` : '';
  return `${street}${number}${city}`.trim();
}

interface Props {
  addresses: AddressItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
}

export default function CollectPointSelect({
  addresses,
  value,
  onChange,
  className,
  placeholder = 'Selecione um ponto de coleta',
}: Props) {
  const options = (addresses || []).filter(a => a.is_collect_point);
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={className}>
      <option value="">{placeholder}</option>
      {options.map(a => (
        <option key={a.id} value={a.id}>
          {addressLabel(a)}
        </option>
      ))}
    </select>
  );
}
