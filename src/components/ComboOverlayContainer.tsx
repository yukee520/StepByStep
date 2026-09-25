import React from 'react';
import ComboOverlay from '@/components/ComboOverlay';
import { useGameScoreStore } from '@/store/useGameScoreStore';

export type ComboOverlayContainerProps = {
  accentColor: string;
  mutedColor: string;
  fontSize: number;
  labelSize: number;
};

function ComboOverlayContainerBase({
  accentColor,
  mutedColor,
  fontSize,
  labelSize,
}: ComboOverlayContainerProps): React.ReactElement {
  const combo = useGameScoreStore((s) => s.combo);

  return (
    <ComboOverlay
      combo={combo}
      accentColor={accentColor}
      mutedColor={mutedColor}
      fontSize={fontSize}
      labelSize={labelSize}
    />
  );
}

const ComboOverlayContainer = React.memo(ComboOverlayContainerBase);
export default ComboOverlayContainer;