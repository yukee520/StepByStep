const applyJudgment = useCallback(
  (judgment: Judgment, note: Note, deltaRatio: number): void => {
    const stats = statsRef.current;
    const base = JUDGMENT_SCORE[judgment];

    // Combo multiplier: 1.0× at combo 0, +0.1× per 10 combo, capped at 2.0×
    const tier = Math.floor(stats.combo / 10);
    const multiplier = Math.min(1.0 + tier * 0.1, 2.0);
    const awarded =
      judgment === 'miss' ? 0 : Math.round(base * multiplier);

    stats.score += awarded;

    if (judgment === 'miss') {
      stats.combo = 0;
      stats.miss += 1;
      setMissCount(stats.miss);
    } else {
      stats.combo += 1;
      if (stats.combo > stats.maxCombo) {
        stats.maxCombo = stats.combo;
      }
      if (judgment === 'perfect') {
        stats.perfect += 1;
        setPerfectCount(stats.perfect);
      } else if (judgment === 'great') {
        stats.great += 1;
        setGreatCount(stats.great);
      } else {
        stats.good += 1;
        setGoodCount(stats.good);
      }
    }

    setScore(stats.score);
    setCombo(stats.combo);
    setMaxCombo(stats.maxCombo);

    if (onNoteHit) {
      const event: JudgmentEvent = {
        id: genId('evt'),
        noteId: note.id,
        direction: note.direction,
        judgment,
        deltaPx: deltaRatio,
        timeMs: Date.now(),
        comboAfter: stats.combo,
        scoreAwarded: awarded,
      };
      onNoteHit({
        direction: event.direction,
        judgment: event.judgment,
        key: event.id,
        timeMs: event.timeMs,
      });
    }
  },
  [onNoteHit],
);