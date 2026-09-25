import React from 'react';
import GameHUD from '@/components/GameHUD';
import { useGameScoreStore } from '@/store/useGameScoreStore';
import { JUDGMENT_ACCURACY_WEIGHT } from '@/types/game';

export type GameHUDContainerProps = {
  title: string;
  elapsedMs: number;
  durationMs: number;
  progress: number;
  onPause: () => void;
};

function GameHUDContainerBase({
  title,
  elapsedMs,
  durationMs,
  progress,
  onPause,
}: GameHUDContainerProps): React.ReactElement {
  const score = useGameScoreStore((s) => s.score);
  const combo = useGameScoreStore((s) => s.combo);
  const perfect = useGameScoreStore((s) => s.perfect);
  const great = useGameScoreStore((s) => s.great);
  const good = useGameScoreStore((s) => s.good);
  const miss = useGameScoreStore((s) => s.miss);

  const total = perfect + great + good + miss;
  const weighted =
    perfect * JUDGMENT_ACCURACY_WEIGHT.perfect +
    great * JUDGMENT_ACCURACY_WEIGHT.great +
    good * JUDGMENT_ACCURACY_WEIGHT.good;
  const accuracy = total > 0 ? weighted / total : 0;

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