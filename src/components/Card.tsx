import React from 'react';
import { View, type ViewProps, type ViewStyle } from 'react-native';
import { NEON_PALETTE } from '@/theme/colors';

export type CardProps = ViewProps & {
  padded?: boolean;
  elevated?: boolean;
  /** Highlight this card with a brighter cyan border + subtle glow. */
  highlighted?: boolean;
  style?: ViewStyle;
};

export default function Card({
  children,
  padded = true,
  elevated = false,
  highlighted = false,
  style,
  ...rest
}: CardProps): React.ReactElement {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(26, 11, 46, 0.6)',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: highlighted
            ? NEON_PALETTE.primary
            : 'rgba(0, 229, 255, 0.18)',
        },
        highlighted
          ? {
              shadowColor: NEON_PALETTE.primary,
              shadowOpacity: 0.35,
              shadowRadius: 14,
              shadowOffset: { width: 0, height: 0 },
              elevation: 4,
            }
          : null,
        elevated && !highlighted
          ? {
              shadowColor: '#000000',
              shadowOpacity: 0.4,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 4 },
              elevation: 3,
            }
          : null,
        padded ? { padding: 16 } : null,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}