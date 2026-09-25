import React from 'react';
import GameHUD from '@/components/GameHUD';
import { useGameScoreStore } from '@/store/useGameScoreStore';

export type GameHUDContainerProps = {
  title: string;
  accuracy: number;
  elapsedMs: number;
  durationMs: number;
  progress: number;
  onPause: () => void;
};

function GameHUDContainerBase({
  title,
  accuracy,
  elapsedMs,
  durationMs,
  progress,
  onPause,
}: GameHUDContainerProps): React.ReactElement {
  const score = useGameScoreStore((s) => s.score);
  const combo = useGameScoreStore((s) => s.combo);

  return (
    <GameHUD
      title={title}
      score={score}
      combo={combo}
      accuracy={accuracy}
      elapsedMs={elapsedMs}
      durationMs={durationMs}
      progress={progress}
      onPause={onPause}
    />
  );
}

const GameHUDContainer = React.memo(GameHUDContainerBase);
export default GameHUDContainer;