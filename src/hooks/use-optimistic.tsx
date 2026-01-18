'use client';

import { useState, useCallback, useTransition } from 'react';
import { toast } from 'sonner';

interface OptimisticState<T> {
  data: T;
  isOptimistic: boolean;
}

/**
 * Hook for optimistic updates with automatic rollback on error
 * Provides calm error feedback without jarring the user
 */
export function useOptimisticUpdate<T>(
  initialValue: T,
  onError?: (error: Error) => void
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialValue,
    isOptimistic: false,
  });
  const [pending, startTransition] = useTransition();

  const optimisticUpdate = useCallback(
    async (
      newValue: T,
      serverAction: () => Promise<void>,
      rollbackValue?: T
    ) => {
      const previousValue = state.data;

      // Optimistically update UI immediately
      setState({ data: newValue, isOptimistic: true });

      startTransition(async () => {
        try {
          await serverAction();
          // Confirm the update
          setState({ data: newValue, isOptimistic: false });
        } catch (error) {
          // Rollback with calm error message
          setState({
            data: rollbackValue ?? previousValue,
            isOptimistic: false,
          });

          // Calm error feedback
          toast.error("Couldn't save that change", {
            description: 'Your view has been restored. Try again?',
            duration: 4000,
          });

          onError?.(error as Error);
        }
      });
    },
    [state.data, onError]
  );

  return {
    value: state.data,
    isOptimistic: state.isOptimistic,
    isPending: pending,
    update: optimisticUpdate,
    set: (value: T) => setState({ data: value, isOptimistic: false }),
  };
}

/**
 * Hook for optimistic array updates (add, remove, update items)
 */
export function useOptimisticList<T extends { id: string }>(
  initialItems: T[],
  onError?: (error: Error) => void
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const addOptimistic = useCallback(
    async (newItem: T, serverAction: () => Promise<void>) => {
      const previousItems = [...items];

      // Optimistically add
      setItems((prev) => [...prev, newItem]);
      setOptimisticIds((prev) => new Set(prev).add(newItem.id));

      startTransition(async () => {
        try {
          await serverAction();
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(newItem.id);
            return next;
          });
        } catch (error) {
          setItems(previousItems);
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(newItem.id);
            return next;
          });

          toast.error("Couldn't add that", {
            description: 'No worries, nothing was saved.',
            duration: 4000,
          });

          onError?.(error as Error);
        }
      });
    },
    [items, onError]
  );

  const removeOptimistic = useCallback(
    async (id: string, serverAction: () => Promise<void>) => {
      const previousItems = [...items];
      const itemToRemove = items.find((item) => item.id === id);

      if (!itemToRemove) return;

      // Optimistically remove
      setItems((prev) => prev.filter((item) => item.id !== id));
      setOptimisticIds((prev) => new Set(prev).add(id));

      startTransition(async () => {
        try {
          await serverAction();
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        } catch (error) {
          setItems(previousItems);
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });

          toast.error("Couldn't remove that", {
            description: "It's been restored. Try again?",
            duration: 4000,
          });

          onError?.(error as Error);
        }
      });
    },
    [items, onError]
  );

  const updateOptimistic = useCallback(
    async (
      id: string,
      updates: Partial<T>,
      serverAction: () => Promise<void>
    ) => {
      const previousItems = [...items];

      // Optimistically update
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      setOptimisticIds((prev) => new Set(prev).add(id));

      startTransition(async () => {
        try {
          await serverAction();
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        } catch (error) {
          setItems(previousItems);
          setOptimisticIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });

          toast.error("Couldn't save that change", {
            description: 'Your view has been restored.',
            duration: 4000,
          });

          onError?.(error as Error);
        }
      });
    },
    [items, onError]
  );

  return {
    items,
    isOptimistic: (id: string) => optimisticIds.has(id),
    isPending: pending,
    add: addOptimistic,
    remove: removeOptimistic,
    update: updateOptimistic,
    setItems,
  };
}

/**
 * Calm error fallback component
 */
export function CalmErrorFallback({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center animate-fade-in">
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary hover:underline focus:outline-none"
        >
          Try again
        </button>
      )}
    </div>
  );
}
