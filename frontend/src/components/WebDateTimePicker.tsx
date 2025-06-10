import React, { createElement } from 'react';

interface Props {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  min?: string;
  max?: string;
}

export default function WebDateTimePicker({ value, onChange, min, max }: Props) {
  return createElement('input', {
    type: 'date',
    value: value,
    onInput: onChange,
    min: min,
    max: max
  });
}