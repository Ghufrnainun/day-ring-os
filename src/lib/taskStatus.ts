export function getNextStatus(status: string): string {
  return status === 'done' ? 'pending' : 'done';
}

export function getUndoToastMessage(nextStatus: string): string {
  return nextStatus === 'done' ? 'Task marked as done.' : 'Task updated.';
}

