import { EJSON } from 'bson';
import { QueryValidationResult } from '../types/schema.js';

export const ALLOWED_OPERATORS = new Set([
  '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
  '$and', '$or', '$not', '$nor',
  '$exists', '$type',
  '$all', '$elemMatch', '$size',
  '$regex', '$text', '$search', '$options',
  '$expr', '$mod', '$where',
  '$geoWithin', '$geoIntersects', '$near', '$nearSphere',
  '$oid', '$date', '$numberLong', '$numberDecimal', '$binary',
]);

export const BLOCKED_OPERATORS = new Set([
  '$set', '$unset', '$inc', '$dec',
  '$push', '$pull', '$pop', '$addToSet',
  '$rename', '$currentDate', '$mul',
  '$min', '$max', '$setOnInsert',
]);

export function parseQuery(queryString: string): { success: true; query: object } | { success: false; error: string } {
  try {
    const query = EJSON.parse(queryString);
    if (typeof query !== 'object' || query === null) {
      return { success: false, error: 'Query must be a JSON object' };
    }
    return { success: true, query };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Invalid JSON: ${message}` };
  }
}

export function findOperators(obj: unknown, operators: Set<string> = new Set()): Set<string> {
  if (typeof obj !== 'object' || obj === null) {
    return operators;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      findOperators(item, operators);
    }
    return operators;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('$')) {
      operators.add(key);
    }
    findOperators(value, operators);
  }

  return operators;
}

export function detectBlockedOperators(operators: Set<string>): string[] {
  const blocked: string[] = [];
  for (const op of operators) {
    if (BLOCKED_OPERATORS.has(op)) {
      blocked.push(op);
    }
  }
  return blocked;
}

export function calculateNestingDepth(obj: unknown, depth: number = 0): number {
  if (typeof obj !== 'object' || obj === null) {
    return depth;
  }

  if (Array.isArray(obj)) {
    let maxDepth = depth;
    for (const item of obj) {
      maxDepth = Math.max(maxDepth, calculateNestingDepth(item, depth));
    }
    return maxDepth;
  }

  let maxDepth = depth;
  for (const value of Object.values(obj)) {
    maxDepth = Math.max(maxDepth, calculateNestingDepth(value, depth + 1));
  }
  return maxDepth;
}

export function hasUnanchoredRegex(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  if (Array.isArray(obj)) {
    return obj.some((item) => hasUnanchoredRegex(item));
  }

  for (const [key, value] of Object.entries(obj)) {
    if (key === '$regex' && typeof value === 'string' && !value.startsWith('^')) {
      return true;
    }
    if (hasUnanchoredRegex(value)) {
      return true;
    }
  }

  return false;
}

export function generateWarnings(
  query: object,
  collectionExists?: boolean,
  collectionName?: string
): string[] {
  const warnings: string[] = [];

  if (Object.keys(query).length === 0) {
    warnings.push('Empty query will match all documents');
  }

  const depth = calculateNestingDepth(query);
  if (depth > 5) {
    warnings.push('Deeply nested query may impact performance');
  }

  if (hasUnanchoredRegex(query)) {
    warnings.push('Regex without anchor (^) may be slow');
  }

  if (collectionName && collectionExists === false) {
    warnings.push(`Collection '${collectionName}' does not exist`);
  }

  return warnings;
}

export function validateQuery(
  queryString: string,
  collectionExists?: boolean,
  collectionName?: string
): QueryValidationResult {
  const parseResult = parseQuery(queryString);
  if (!parseResult.success) {
    return {
      valid: false,
      error: parseResult.error,
    };
  }

  const query = parseResult.query;
  const operators = findOperators(query);
  const blockedOps = detectBlockedOperators(operators);

  if (blockedOps.length > 0) {
    return {
      valid: false,
      error: `Write operations are not allowed. Detected: ${blockedOps.join(', ')}`,
    };
  }

  const warnings = generateWarnings(query, collectionExists, collectionName);

  const result: QueryValidationResult = {
    valid: true,
  };

  if (warnings.length > 0) {
    result.warnings = warnings;
  }

  return result;
}
