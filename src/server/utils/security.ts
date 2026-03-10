// SQL injection prevention and security utilities

const DANGEROUS_PATTERNS = [
  /;\s*(drop|delete|truncate|alter|create|insert|update)\s+/i, // Multiple statements with DDL/DML
  /union\s+select/i,
  /exec\s*\(/i,
  /execute\s+/i,
  /xp_/i,
  /sp_/i,
];

const ALLOWED_OPERATIONS = ['SELECT', 'WITH', 'EXPLAIN', 'CREATE', 'DROP', 'ALTER', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'];

export function sanitizeSQL(sql: string): { safe: boolean; reason?: string } {
  const trimmed = sql.trim();

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: 'Potentially dangerous SQL pattern detected' };
    }
  }

  // Check if operation is allowed
  const firstWord = trimmed.split(/\s+/)[0].toUpperCase();
  if (!ALLOWED_OPERATIONS.includes(firstWord)) {
    return { safe: false, reason: `Operation ${firstWord} is not allowed.` };
  }

  // Check for multiple statements
  const statements = trimmed.split(';').filter(s => s.trim());
  if (statements.length > 1) {
    return { safe: false, reason: 'Multiple statements are not allowed' };
  }

  return { safe: true };
}

export function validateConnectionString(connStr: string): { valid: boolean; reason?: string } {
  if (!connStr || connStr.trim().length === 0) {
    return { valid: false, reason: 'Connection string is empty' };
  }

  // Basic PostgreSQL connection string validation
  const pgPattern = /^postgres(ql)?:\/\/.+/i;
  if (!pgPattern.test(connStr)) {
    return { valid: false, reason: 'Invalid PostgreSQL connection string format' };
  }

  return { valid: true };
}

export function sanitizeTableName(name: string): string {
  // Remove any characters that aren't alphanumeric, underscore, or dot
  return name.replace(/[^a-zA-Z0-9_.]/g, '');
}

export function sanitizeSchemaName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '');
}

export function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
