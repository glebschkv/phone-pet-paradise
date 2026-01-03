import { useCallback, useRef, RefObject } from 'react';

interface UseGridKeyboardNavOptions {
  /** Number of columns in the grid */
  columns: number;
  /** Total number of items */
  totalItems: number;
  /** Whether navigation is disabled */
  disabled?: boolean;
  /** Callback when an item is selected via Enter/Space */
  onSelect?: (index: number) => void;
}

interface UseGridKeyboardNavReturn {
  /** Ref to attach to the grid container */
  gridRef: RefObject<HTMLDivElement>;
  /** Key handler to attach to each grid item */
  handleKeyDown: (e: React.KeyboardEvent, currentIndex: number) => void;
  /** Get tabIndex for an item (only first or focused item should be 0) */
  getTabIndex: (index: number, isSelected: boolean) => number;
}

/**
 * Hook for adding keyboard navigation to grid-based components.
 * Supports arrow key navigation with wrap-around.
 *
 * Usage:
 * ```tsx
 * const { gridRef, handleKeyDown, getTabIndex } = useGridKeyboardNav({
 *   columns: 3,
 *   totalItems: items.length,
 *   onSelect: (index) => handleItemClick(items[index])
 * });
 *
 * return (
 *   <div ref={gridRef} role="grid">
 *     {items.map((item, i) => (
 *       <button
 *         key={item.id}
 *         tabIndex={getTabIndex(i, item.isSelected)}
 *         onKeyDown={(e) => handleKeyDown(e, i)}
 *       >
 *         {item.name}
 *       </button>
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useGridKeyboardNav({
  columns,
  totalItems,
  disabled = false,
  onSelect,
}: UseGridKeyboardNavOptions): UseGridKeyboardNavReturn {
  const gridRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
    if (disabled || totalItems === 0) return;

    let nextIndex = currentIndex;
    let handled = false;

    switch (e.key) {
      case 'ArrowLeft':
        nextIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
        handled = true;
        break;
      case 'ArrowRight':
        nextIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
        handled = true;
        break;
      case 'ArrowUp':
        nextIndex = currentIndex >= columns
          ? currentIndex - columns
          : currentIndex + Math.floor((totalItems - 1) / columns) * columns;
        // Ensure we don't go past the end
        if (nextIndex >= totalItems) {
          nextIndex = currentIndex - columns + totalItems % columns;
          if (nextIndex < 0 || nextIndex >= totalItems) nextIndex = currentIndex;
        }
        handled = true;
        break;
      case 'ArrowDown':
        nextIndex = currentIndex + columns < totalItems
          ? currentIndex + columns
          : currentIndex % columns;
        handled = true;
        break;
      case 'Home':
        nextIndex = 0;
        handled = true;
        break;
      case 'End':
        nextIndex = totalItems - 1;
        handled = true;
        break;
      case 'Enter':
      case ' ':
        if (onSelect) {
          onSelect(currentIndex);
          handled = true;
        }
        break;
      default:
        return;
    }

    if (handled) {
      e.preventDefault();

      if (nextIndex !== currentIndex) {
        // Focus the next button
        const buttons = gridRef.current?.querySelectorAll<HTMLButtonElement>(
          'button:not([disabled]), [role="gridcell"]:not([aria-disabled="true"])'
        );
        if (buttons && buttons[nextIndex]) {
          buttons[nextIndex].focus();
        }
      }
    }
  }, [columns, totalItems, disabled, onSelect]);

  const getTabIndex = useCallback((index: number, isSelected: boolean): number => {
    // Use roving tabindex pattern: only the selected/first item is tabbable
    if (isSelected) return 0;
    if (index === 0) return 0;
    return -1;
  }, []);

  return {
    gridRef,
    handleKeyDown,
    getTabIndex,
  };
}
