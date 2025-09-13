import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeText, validateJsonField, sanitizeTemplateField, sanitizeUrl } from '../src/lib/security';

describe('Security Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should sanitize malicious HTML on server-side', () => {
      const maliciousHtml = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(maliciousHtml);
      // On server-side, it now removes script tags and dangerous content
      expect(result).toBe('<p>Hello</p>');
      expect(result).not.toContain('<script>');
    });

    it('should preserve safe HTML tags', () => {
      const safeHtml = '<p><strong>Bold text</strong> and <em>italic text</em></p>';
      const result = sanitizeHtml(safeHtml);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags on server-side', () => {
      const maliciousText = '<script>alert("xss")</script>Hello';
      const result = sanitizeText(maliciousText);
      expect(result).toBe('alert("xss")Hello');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should handle plain text', () => {
      const plainText = 'Hello world';
      const result = sanitizeText(plainText);
      expect(result).toBe('Hello world');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
    });
  });

  describe('validateJsonField', () => {
    it('should validate string values', () => {
      const value = 'John Doe';
      const result = validateJsonField(value);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('John Doe');
    });

    it('should sanitize malicious strings', () => {
      const value = '<script>alert("xss")</script>John';
      const result = validateJsonField(value);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).not.toContain('<script>');
    });

    it('should validate numbers', () => {
      const value = 42;
      const result = validateJsonField(value);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(42);
    });

    it('should validate booleans', () => {
      const value = true;
      const result = validateJsonField(value);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(true);
    });

    it('should validate arrays', () => {
      const value = ['item1', 'item2'];
      const result = validateJsonField(value);
      expect(result.isValid).toBe(true);
      expect(Array.isArray(result.sanitized)).toBe(true);
    });

    it('should validate objects with valid keys', () => {
      const value = { name: 'John', age: 30 };
      const result = validateJsonField(value);
      expect(result.isValid).toBe(true);
      expect(typeof result.sanitized).toBe('object');
    });

    it('should reject objects with invalid keys', () => {
      const value = { '<script>': 'malicious' };
      const result = validateJsonField(value);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid field key');
    });

    it('should handle null values', () => {
      const result = validateJsonField(null);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(null);
    });

    it('should handle undefined values', () => {
      const result = validateJsonField(undefined);
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe(undefined);
    });
  });

  describe('sanitizeTemplateField', () => {
    it('should sanitize shortText fields', () => {
      const result = sanitizeTemplateField('shortText', '<script>alert("xss")</script>John');
      expect(result).not.toContain('<script>');
    });

    it('should handle richText fields', () => {
      const result = sanitizeTemplateField('richText', '<p>Content</p><script>alert("xss")</script>');
      expect(result).toContain('<p>Content</p>');
    });

    it('should handle number fields', () => {
      expect(sanitizeTemplateField('number', '42')).toBe(42);
      expect(sanitizeTemplateField('number', 'invalid')).toBe(0);
    });

    it('should handle multiSelect fields', () => {
      const result = sanitizeTemplateField('multiSelect', ['<script>tag1</script>', 'tag2']);
      expect(Array.isArray(result)).toBe(true);
      expect((result as string[]).length).toBe(2);
    });

    it('should handle unknown field types', () => {
      const result = sanitizeTemplateField('unknown', '<script>test</script>');
      expect(result).not.toContain('<script>');
    });
  });

  describe('sanitizeUrl', () => {
    it('should remove javascript: URLs', () => {
      const result = sanitizeUrl('javascript:alert("xss")');
      expect(result).toBe('');
    });

    it('should remove data: URLs', () => {
      const result = sanitizeUrl('data:text/html,<script>alert(1)</script>');
      expect(result).toBe('');
    });

    it('should preserve safe URLs', () => {
      const safeUrl = 'https://example.com/image.png';
      const result = sanitizeUrl(safeUrl);
      expect(result).toBe(safeUrl);
    });

    it('should handle vbscript: URLs', () => {
      const result = sanitizeUrl('vbscript:msgbox("xss")');
      expect(result).toBe('');
    });

    it('should trim whitespace', () => {
      const result = sanitizeUrl('  https://example.com  ');
      expect(result).toBe('https://example.com');
    });
  });
});

