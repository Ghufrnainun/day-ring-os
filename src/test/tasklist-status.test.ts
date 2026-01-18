import { describe, it, expect } from 'vitest';
import { getNextStatus, getUndoToastMessage } from '../lib/taskStatus';

describe('TaskList status helpers', () => {
  it('getNextStatus toggles between pending and done', () => {
    expect(getNextStatus('pending')).toBe('done');
    expect(getNextStatus('done')).toBe('pending');
  });

  it('getNextStatus returns done for unknown status', () => {
    expect(getNextStatus('unknown')).toBe('done');
  });

  it('getUndoToastMessage uses done copy when nextStatus is done', () => {
    expect(getUndoToastMessage('done')).toBe('Task marked as done.');
  });

  it('getUndoToastMessage uses generic copy for non-done status', () => {
    expect(getUndoToastMessage('pending')).toBe('Task updated.');
    expect(getUndoToastMessage('something-else')).toBe('Task updated.');
  });
});
