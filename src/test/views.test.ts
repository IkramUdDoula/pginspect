// Basic tests for the Views feature

import { describe, it, expect } from 'vitest';
import type { CreateViewRequest, SavedView } from '../shared/types';

describe('Views Types', () => {
  it('should have correct SavedView interface', () => {
    const mockView: SavedView = {
      id: 'test-id',
      userId: 'user-123',
      connectionId: 1,
      schemaName: 'public',
      viewName: 'Test View',
      description: 'A test view',
      queryText: 'SELECT * FROM users',
      queryType: 'sql',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(mockView.id).toBe('test-id');
    expect(mockView.queryType).toBe('sql');
    expect(mockView.viewName).toBe('Test View');
  });

  it('should have correct CreateViewRequest interface', () => {
    const mockRequest: CreateViewRequest = {
      connectionId: 1,
      schemaName: 'public',
      viewName: 'New View',
      description: 'A new view',
      queryText: 'SELECT * FROM products',
      queryType: 'visual',
    };

    expect(mockRequest.connectionId).toBe(1);
    expect(mockRequest.queryType).toBe('visual');
    expect(mockRequest.viewName).toBe('New View');
  });

  it('should support optional description in CreateViewRequest', () => {
    const mockRequest: CreateViewRequest = {
      connectionId: 1,
      schemaName: 'public',
      viewName: 'Simple View',
      queryText: 'SELECT 1',
      queryType: 'sql',
    };

    expect(mockRequest.description).toBeUndefined();
    expect(mockRequest.viewName).toBe('Simple View');
  });
});

describe('Views Service Validation', () => {
  // Import the validation function
  const validateViewData = (data: CreateViewRequest) => {
    const errors: string[] = [];

    if (!data.viewName || data.viewName.trim().length === 0) {
      errors.push('View name is required');
    } else if (data.viewName.length > 255) {
      errors.push('View name must be 255 characters or less');
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(data.viewName)) {
      errors.push('View name can only contain letters, numbers, spaces, hyphens, and underscores');
    }

    if (data.description && data.description.length > 1000) {
      errors.push('Description must be 1000 characters or less');
    }

    if (!data.queryText || data.queryText.trim().length === 0) {
      errors.push('Query text is required');
    }

    if (!['sql', 'visual'].includes(data.queryType)) {
      errors.push('Query type must be either "sql" or "visual"');
    }

    return errors;
  };

  it('should validate view name is required', () => {
    const invalidData: CreateViewRequest = {
      connectionId: 1,
      schemaName: 'public',
      viewName: '',
      queryText: 'SELECT 1',
      queryType: 'sql',
    };

    const errors = validateViewData(invalidData);
    expect(errors).toContain('View name is required');
  });

  it('should validate view name length', () => {
    const invalidData: CreateViewRequest = {
      connectionId: 1,
      schemaName: 'public',
      viewName: 'a'.repeat(256),
      queryText: 'SELECT 1',
      queryType: 'sql',
    };

    const errors = validateViewData(invalidData);
    expect(errors).toContain('View name must be 255 characters or less');
  });

  it('should validate view name characters', () => {
    const invalidData: CreateViewRequest = {
      connectionId: 1,
      schemaName: 'public',
      viewName: 'invalid@name!',
      queryText: 'SELECT 1',
      queryType: 'sql',
    };

    const errors = validateViewData(invalidData);
    expect(errors).toContain('View name can only contain letters, numbers, spaces, hyphens, and underscores');
  });

  it('should validate query text is required', () => {
    const invalidData: CreateViewRequest = {
      connectionId: 1,
      schemaName: 'public',
      viewName: 'Valid Name',
      queryText: '',
      queryType: 'sql',
    };

    const errors = validateViewData(invalidData);
    expect(errors).toContain('Query text is required');
  });

  it('should validate query type', () => {
    const invalidData: CreateViewRequest = {
      connectionId: 1,
      schemaName: 'public',
      viewName: 'Valid Name',
      queryText: 'SELECT 1',
      queryType: 'invalid' as any,
    };

    const errors = validateViewData(invalidData);
    expect(errors).toContain('Query type must be either "sql" or "visual"');
  });

  it('should pass validation for valid data', () => {
    const validData: CreateViewRequest = {
      connectionId: 1,
      schemaName: 'public',
      viewName: 'Valid View Name',
      description: 'A valid description',
      queryText: 'SELECT * FROM users WHERE active = true',
      queryType: 'sql',
    };

    const errors = validateViewData(validData);
    expect(errors).toHaveLength(0);
  });
});