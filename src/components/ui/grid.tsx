
import React from 'react';
import { cn } from '@/lib/utils';

interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  numCols?: number;
  numColsSm?: number;
  numColsMd?: number;
  numColsLg?: number;
  gapSize?: number;
}

export const Grid: React.FC<GridProps> = ({
  numCols = 1,
  numColsSm,
  numColsMd,
  numColsLg,
  gapSize = 4,
  className,
  children,
  ...props
}) => {
  const gridClasses = cn(
    'grid',
    `grid-cols-${numCols}`,
    numColsSm && `sm:grid-cols-${numColsSm}`,
    numColsMd && `md:grid-cols-${numColsMd}`,
    numColsLg && `lg:grid-cols-${numColsLg}`,
    `gap-${gapSize}`,
    className
  );

  return (
    <div className={gridClasses} {...props}>
      {children}
    </div>
  );
};

interface ColProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: number;
  spanSm?: number;
  spanMd?: number;
  spanLg?: number;
}

export const Col: React.FC<ColProps> = ({
  span,
  spanSm,
  spanMd,
  spanLg,
  className,
  children,
  ...props
}) => {
  const colClasses = cn(
    span && `col-span-${span}`,
    spanSm && `sm:col-span-${spanSm}`,
    spanMd && `md:col-span-${spanMd}`,
    spanLg && `lg:col-span-${spanLg}`,
    className
  );

  return (
    <div className={colClasses} {...props}>
      {children}
    </div>
  );
};
