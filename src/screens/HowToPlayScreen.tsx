import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';

type DirectionExample = {
  direction: 'left' | 'right' | 'up' | 'down';
  icon: string;
  color: string;
  label: string;
};

const DIRECTION_EXAMPLES: DirectionExample[] = [
  { direction: 'left', icon: 'chevron-back', color: '#EF4444', label: 'Left' },
  { direction: 'down', icon: 'chevron-down', color: '#F59E0B', label: 'Down' },
  { direction: 'up', icon: 'chevron-up', color: '#10B981', label: 'Up' },
  { direction: 'right', icon: 'chevron-forward', color: '#3B82F6', label: 'Right' },
];

export default function HowToPlayScreen(): React.ReactElement {
  const { colors } = useTheme();

  return (
    <SafeAreaView className="flex-1 bg-background dark:bg-dark-background" edges={['top']}>
      <ScreenHeader title="How to Play" />

      <ScrollView contentContainerClassName="px-4 pb-10" showsVerticalScrollIndicator={false}>
        <Card>
          <View className="flex-row items-center">
            <Ionicons name="game-controller-outline" size={24} color={colors.primary} />
            <Text className="text-lg font-bold text-text dark:text-dark-text ml-3">
              The Basics
            </Text>
          </View>
          <Text className="text-sm text-text dark:text-dark-text mt-3 leading-5">
            Arrows fall from the top of the screen down four lanes. When an arrow reaches the
            glowing line near the bottom, tap the matching direction button — Left, Down, Up,
            or Right.
          </Text>
          <Text className="text-sm text-text dark:text-dark-text mt-3 leading-5">
            The closer your tap is to the exact moment the arrow crosses the line, the better
            your judgment. Chain hits without missing to build a combo and multiply your score.
          </Text>
        </Card>

        <View className="h-4" />

        <Card>
          <Text className="text-base font-bold text-text dark:text-dark-text">
            The Four Directions
          </Text>
          <Text className="text-xs text-muted dark:text-dark-muted mt-1">
            Each lane has its own color so you can read the chart at a glance.
          </Text>

          <View className="flex-row flex-wrap mt-4 -mx-2">
            {DIRECTION_EXAMPLES.map((example) => (
              <View key={example.direction} className="w-1/2 px-2 mb-3">
                <View
                  className="rounded-2xl p-4 items-center"
                  style={{
                    backgroundColor: `${example.color}22`,
                    borderWidth: 1,
                    borderColor: example.color,
                  }}
                >
                  <Ionicons name={example.icon} size={36} color={example.color} />
                  <Text
                    className="text-base font-bold mt-2"
                    style={{ color: example.color }}
                  >
                    {example.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <View className="h-4" />

        <Card>
          <Text className="text-base font-bold text-text dark:text-dark-text">
            Judgments
          </Text>
          <Text className="text-xs text-muted dark:text-dark-muted mt-1">
            Timing windows in milliseconds.
          </Text>

          <View className="mt-3">
            <JudgmentRow color={colors.perfect} label="Perfect" windowLabel="±45 ms" points="300" />
            <JudgmentRow color={colors.great} label="Great" windowLabel="±90 ms" points="200" />
            <JudgmentRow color={colors.good} label="Good" windowLabel="±140 ms" points="100" />
            <JudgmentRow color={colors.miss} label="Miss" windowLabel="Beyond ±140 ms" points="0" />
          </View>
        </Card>

        <View className="h-4" />

        <Card>
          <Text className="text-base font-bold text-text dark:text-dark-text">
            Combo & Score
          </Text>
          <Text className="text-sm text-text dark:text-dark-text mt-3 leading-5">
            Every consecutive hit increases your combo. At 10, 20, 30 combo and beyond you earn
            bonus points per hit, capped at +100 bonus per note.
          </Text>
          <Text className="text-sm text-text dark:text-dark-text mt-3 leading-5">
            Missing a note resets your combo to zero, but your score is unaffected until then.
          </Text>
        </Card>

        <View className="h-4" />

        <Card>
          <Text className="text-base font-bold text-text dark:text-dark-text">
            Tips
          </Text>
          <TipRow icon="headset-outline" text="Use headphones — audio cues make timing easier." />
          <TipRow icon="speedometer-outline" text="Adjust note speed in Settings to match your reading pace." />
          <TipRow icon="timer-outline" text="If hits feel late or early, tune the input offset in Settings." />
          <TipRow icon="musical-notes-outline" text="Start on Easy, then work up to Normal, Hard, and Expert." />
          <TipRow icon="construct-outline" text="Use the Chart Builder to make your own songs from any audio." />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

type JudgmentRowProps = {
  color: string;
  label: string;
  windowLabel: string;
  points: string;
};

function JudgmentRow({
  color,
  label,
  windowLabel,
  points,
}: JudgmentRowProps): React.ReactElement {
  return (
    <View className="flex-row items-center py-2">
      <View
        className="w-3 h-3 rounded-full mr-3"
        style={{ backgroundColor: color }}
      />
      <Text className="text-sm font-semibold flex-1" style={{ color }}>
        {label}
      </Text>
      <Text className="text-xs text-muted dark:text-dark-muted mr-4">
        {windowLabel}
      </Text>
      <Text className="text-xs font-bold text-text dark:text-dark-text">
        {points} pts
      </Text>
    </View>
  );
}

type TipRowProps = {
  icon: string;
  text: string;
};

function TipRow({ icon, text }: TipRowProps): React.ReactElement {
  const { colors } = useTheme();
  return (
    <View className="flex-row items-start mt-3">
      <Ionicons name={icon} size={18} color={colors.primary} style={{ marginTop: 1 }} />
      <Text className="text-sm text-text dark:text-dark-text ml-3 flex-1 leading-5">
        {text}
      </Text>
    </View>
  );
}