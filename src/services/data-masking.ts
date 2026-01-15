import { Document } from 'mongodb';
import { ObjectId } from 'bson';
export const MASKED_VALUES = {
  EMAIL: '[MASKED_EMAIL]',
  SECRET: '[MASKED_SECRET]',
  PHONE: '[MASKED_PHONE]',
  SSN: '[MASKED_SSN]',
  CARD: '[MASKED_CARD]',
  STRING: '[MASKED_STRING]',
} as const;
const SENSITIVE_PATTERNS = {
  credentials: /^(password|passwd|secret|token|api_?key|auth|bearer|private_?key|access_?token|refresh_?token)$/i,
  email: /^(e_?mail|email_?address)$/i,
  phone: /^(phone|mobile|telephone|cell|fax)$/i,
  ssn: /^(ssn|social_?security|social_?security_?number)$/i,
  financial: /^(credit_?card|card_?number|cvv|cvc|bank_?account|iban|routing|account_?number)$/i,
  health: /^(medical|patient|diagnosis|prescription|health)$/i,
  infrastructure: /^(connection_?string|db_?password|aws_?secret|private_?key)$/i,
};
export function isSensitiveField(fieldName: string): boolean {
  const name = fieldName.split('.').pop() || fieldName;
  return Object.values(SENSITIVE_PATTERNS).some((pattern) => pattern.test(name));
}
export function getMaskValue(fieldName: string): string {
  const name = fieldName.split('.').pop() || fieldName;
  if (SENSITIVE_PATTERNS.email.test(name)) {
    return MASKED_VALUES.EMAIL;
  }
  if (SENSITIVE_PATTERNS.phone.test(name)) {
    return MASKED_VALUES.PHONE;
  }
  if (SENSITIVE_PATTERNS.ssn.test(name)) {
    return MASKED_VALUES.SSN;
  }
  if (SENSITIVE_PATTERNS.financial.test(name)) {
    return MASKED_VALUES.CARD;
  }
  if (
    SENSITIVE_PATTERNS.credentials.test(name) ||
    SENSITIVE_PATTERNS.health.test(name) ||
    SENSITIVE_PATTERNS.infrastructure.test(name)
  ) {
    return MASKED_VALUES.SECRET;
  }
  return MASKED_VALUES.STRING;
}
export function maskValue(value: unknown, fieldName: string): unknown {
  if (typeof value === 'string') {
    return getMaskValue(fieldName);
  }
  if (typeof value === 'number') {
    return 0;
  }
  if (typeof value === 'boolean') {
    return false;
  }
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'object' && item !== null) {
        return maskDocument(item as Document);
      }
      return maskValue(item, fieldName);
    });
  }
  if (typeof value === 'object' && value !== null) {
    return maskDocument(value as Document);
  }
  return value;
}
export function maskDocument(doc: Document): Document {
  const masked: Document = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value instanceof ObjectId) {
      masked[key] = value.toHexString();
      continue;
    }
    if (value instanceof Date) {
      masked[key] = value.toISOString();
      continue;
    }
    if (isSensitiveField(key)) {
      masked[key] = maskValue(value, key);
      continue;
    }
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      masked[key] = maskDocument(value as Document);
      continue;
    }
    if (Array.isArray(value)) {
      masked[key] = value.map((item) => {
        if (item instanceof ObjectId) {
          return item.toHexString();
        }
        if (item instanceof Date) {
          return item.toISOString();
        }
        if (typeof item === 'object' && item !== null) {
          return maskDocument(item as Document);
        }
        return item;
      });
      continue;
    }
    masked[key] = value;
  }
  return masked;
}
export function maskDocuments(docs: Document[]): Document[] {
  return docs.map((doc) => maskDocument(doc));
}
