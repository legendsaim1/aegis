import { describe, it, expect } from 'vitest';

describe('Toast System Logic', () => {
  it('should format toast object with id, message, variant, and duration', () => {
    const createToast = (message, variant = 'info', duration = 4000) => ({
      id: Math.random().toString(36).substring(2, 9),
      message,
      variant,
      duration
    });

    const successToast = createToast('Student uploaded successfully', 'success');
    expect(successToast.message).toBe('Student uploaded successfully');
    expect(successToast.variant).toBe('success');
    expect(successToast.duration).toBe(4000);
    expect(successToast.id).toBeTruthy();

    const errorToast = createToast('Upload failed: file too large', 'error');
    expect(errorToast.variant).toBe('error');

    const infoToast = createToast('Student removed', 'info');
    expect(infoToast.variant).toBe('info');
  });

  it('should filter dismissed toasts by id without mutating original array', () => {
    const toasts = [
      { id: 't1', message: 'First toast' },
      { id: 't2', message: 'Second toast' },
      { id: 't3', message: 'Third toast' }
    ];

    const removeToast = (list, targetId) => list.filter(t => t.id !== targetId);

    const remaining = removeToast(toasts, 't2');
    expect(remaining.length).toBe(2);
    expect(remaining.find(t => t.id === 't2')).toBeUndefined();
    expect(toasts.length).toBe(3); // immutability check
  });
});
