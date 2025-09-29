import React from 'react';
import { cn } from '../../styles/theme';
import { useAnimations } from '../ThemeProvider';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'hover' | 'elevated';
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className,
  onClick,
}) => {
  const { withAnimation } = useAnimations();

  const variantClasses = {
    default: 'card',
    hover: 'card-hover cursor-pointer',
    elevated: 'card-elevated',
  };

  const cardClasses = cn(variantClasses[variant], className);

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={withAnimation(cardClasses, 'fadeIn')}
      onClick={onClick}
    >
      {children}
    </Component>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-700', className)}>
      {children}
    </div>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className,
}) => {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
};

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-700', className)}>
      {children}
    </div>
  );
};
