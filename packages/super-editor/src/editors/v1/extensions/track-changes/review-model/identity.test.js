import { describe, expect, it } from 'vitest';
import {
  normalizeEmail,
  getCurrentUserIdentity,
  getChangeAuthorIdentity,
  classifyOwnership,
  isSameUserHighConfidence,
} from './identity.js';

describe('review-model/identity', () => {
  describe('normalizeEmail', () => {
    it('lowercases and trims a string email', () => {
      expect(normalizeEmail('  Alice@Example.COM ')).toBe('alice@example.com');
    });
    it('returns "" for non-string values', () => {
      expect(normalizeEmail(undefined)).toBe('');
      expect(normalizeEmail(null)).toBe('');
      expect(normalizeEmail(42)).toBe('');
      expect(normalizeEmail({ email: 'x' })).toBe('');
    });
    it('returns "" for whitespace-only strings', () => {
      expect(normalizeEmail('   ')).toBe('');
    });
  });

  describe('getCurrentUserIdentity', () => {
    it('extracts identity from a configured editor', () => {
      const editor = { options: { user: { name: 'Alice', email: 'Alice@example.com' } } };
      expect(getCurrentUserIdentity(editor)).toEqual({
        email: 'alice@example.com',
        name: 'Alice',
        hasEmail: true,
      });
    });
    it('returns empty identity for missing editor/user', () => {
      expect(getCurrentUserIdentity(undefined)).toEqual({ email: '', name: '', hasEmail: false });
      expect(getCurrentUserIdentity({ options: {} })).toEqual({ email: '', name: '', hasEmail: false });
    });
  });

  describe('getChangeAuthorIdentity', () => {
    it('reads from a raw mark', () => {
      const mark = { attrs: { author: 'Bob', authorEmail: 'BOB@example.com' } };
      expect(getChangeAuthorIdentity(mark)).toEqual({ email: 'bob@example.com', name: 'Bob', hasEmail: true });
    });
    it('reads from flat attrs', () => {
      expect(getChangeAuthorIdentity({ author: 'Carol', authorEmail: 'carol@example.com' })).toEqual({
        email: 'carol@example.com',
        name: 'Carol',
        hasEmail: true,
      });
    });
    it('returns empty for null', () => {
      expect(getChangeAuthorIdentity(null)).toEqual({ email: '', name: '', hasEmail: false });
    });
  });

  describe('classifyOwnership', () => {
    const alice = { email: 'alice@example.com', name: 'Alice', hasEmail: true };
    const bob = { email: 'bob@example.com', name: 'Bob', hasEmail: true };

    it('returns same-user for matching emails', () => {
      expect(classifyOwnership({ currentUser: alice, change: { ...alice } })).toBe('same-user');
    });
    it('returns different-user for distinct emails', () => {
      expect(classifyOwnership({ currentUser: alice, change: bob })).toBe('different-user');
    });
    it('returns unknown-current-user when current email is missing', () => {
      expect(classifyOwnership({ currentUser: { email: '', name: '', hasEmail: false }, change: bob })).toBe(
        'unknown-current-user',
      );
    });
    it('returns unknown-change-author when change email is missing', () => {
      expect(classifyOwnership({ currentUser: alice, change: { email: '', name: 'B', hasEmail: false } })).toBe(
        'unknown-change-author',
      );
    });
    it('display-name-only never matches', () => {
      expect(
        classifyOwnership({
          currentUser: { email: '', name: 'Alice', hasEmail: false },
          change: { email: '', name: 'Alice', hasEmail: false },
        }),
      ).toBe('unknown-current-user');
    });
    it('returns conflicting when importedAuthor disagrees with name', () => {
      expect(
        classifyOwnership({
          currentUser: alice,
          change: { ...alice, name: 'Imported Alice', importedAuthor: 'Mallory' },
        }),
      ).toBe('conflicting');
    });
    it('isSameUserHighConfidence only on same-user', () => {
      expect(isSameUserHighConfidence('same-user')).toBe(true);
      expect(isSameUserHighConfidence('different-user')).toBe(false);
      expect(isSameUserHighConfidence('unknown-current-user')).toBe(false);
      expect(isSameUserHighConfidence('unknown-change-author')).toBe(false);
      expect(isSameUserHighConfidence('conflicting')).toBe(false);
    });
  });
});
