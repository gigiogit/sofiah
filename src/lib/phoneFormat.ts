// Utility functions for phone number formatting
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function formatBrazilianPhone(numbers: string): string {
  if (numbers.length <= 2) return `(${numbers}`;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

export function isValidBrazilianPhone(numbers: string): boolean {
  return numbers.length === 11 && numbers.startsWith('11');
}