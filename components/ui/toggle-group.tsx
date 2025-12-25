'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  defaultValue?: string | string[];
}

interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

// Create a type for the context that uses the correct function signature
interface ToggleGroupContextType {
  type: 'single' | 'multiple';
  value: string | string[];
  onItemClick: (itemValue: string) => void;
}

const ToggleGroupContext = React.createContext<ToggleGroupContextType>({
  type: 'single',
  value: [],
  onItemClick: () => {},
});

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, type = 'single', value, onValueChange, defaultValue, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string | string[]>(
      defaultValue || (type === 'single' ? '' : [])
    );

    const currentValue = value !== undefined ? value : internalValue;

    const handleItemClick = React.useCallback((itemValue: string) => {
      if (type === 'single') {
        const newValue = currentValue === itemValue ? '' : itemValue;
        if (value === undefined) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
      } else {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        const newValue = currentArray.includes(itemValue)
          ? currentArray.filter(v => v !== itemValue)
          : [...currentArray, itemValue];
        if (value === undefined) {
          setInternalValue(newValue);
        }
        onValueChange?.(newValue);
      }
    }, [type, currentValue, value, onValueChange]);

    return (
      <ToggleGroupContext.Provider value={{ 
        type, 
        value: currentValue, 
        onItemClick: handleItemClick 
      }}>
        <div
          ref={ref}
          className={cn(
            'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </ToggleGroupContext.Provider>
    );
  }
);

ToggleGroup.displayName = 'ToggleGroup';

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, value, children, onClick, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext);
    const isSelected = context.type === 'single'
      ? context.value === value
      : Array.isArray(context.value) && context.value.includes(value);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      context.onItemClick(value);
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          isSelected
            ? 'bg-background text-foreground shadow'
            : 'hover:bg-muted hover:text-muted-foreground',
          className
        )}
        onClick={handleClick}
        data-state={isSelected ? 'on' : 'off'}
        {...props}
      >
        {children}
      </button>
    );
  }
);

ToggleGroupItem.displayName = 'ToggleGroupItem';

export { ToggleGroup, ToggleGroupItem };