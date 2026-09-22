import React from 'react';
import { View, type ViewProps } from 'react-native';

export type CardProps = ViewProps & {
  padded?: boolean;
  elevated?: boolean;
};

export default function Card({
  children,
  padded = true,
  elevated = false,
  className,
  ...rest
}: CardProps & { className?: string }): React.ReactElement {
  return (
    <View
      className={[
        'bg-card dark:bg-dark-card rounded-2xl border border-border dark:border-dark-border',
        padded ? 'p-4' : '',
        elevated ? 'shadow-sm' : '',
        className ?? '',
      ].join(' ')}
      {...rest}
    >
      {children}
    </View>
  );
}