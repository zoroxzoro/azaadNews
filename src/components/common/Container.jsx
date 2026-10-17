import React from 'react';

/**
 * Editorial Container Component
 * Follows Broadsheet grid standard max-width of 1280px with consistent gutters
 */
export default function Container({
  children,
  className = '',
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={`max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
