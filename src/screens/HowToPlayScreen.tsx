import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import NeonBackground from '@/components/NeonBackground';
import { NEON_PALETTE } from '@/theme/colors';
import type { Direction } from '@/types/song';

type DirectionExample = {
  direction: Direction;
  icon: string;
  color: string;
  label: string;
};

const DIRECTION_EXAMPLES: DirectionExample[] = [
  { direction: 'left', icon: 'chevron-back', color: NEON_PALETTE.lane.left, label: 'Left' },
  { direction: 'down', icon: 'chevron-down', color: NEON_PALETTE.lane.down, label: 'Down' },
  { direction: 'up', icon: 'chevron-up', color: NEON_PALETTE.lane.up, label: 'Up' },
  { direction: 'right', icon: 'chevron-forward', color: NEON_PALETTE.lane.right, label: 'Right' },
];

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
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
      }}
    >
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: color,
          marginRight: 12,
        }}
      />
      <Text
        style={{
          fontSize: 14,
          fontWeight: '700',
          flex: 1,
          color,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: NEON_PALETTE.textDim,
          marginRight: 16,
        }}
      >
        {windowLabel}
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '800',
          color: NEON_PALETTE.text,
        }}
      >
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
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 }}>
      <Ionicons
        name={icon}
        size={18}
        color={NEON_PALETTE.primary}
        style={{ marginTop: 2 }}
      />
      <Text
        style={{
          fontSize: 13,
          color: NEON_PALETTE.text,
          marginLeft: 12,
          flex: 1,
          lineHeight: 20,
        }}
      >
        {text}
      </Text>
    </View>
  );
}

export default function HowToPlayScreen(): React.ReactElement {
  return (
    <NeonBackground showGrid>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="How to Play" />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons
                name="game-controller-outline"
                size={24}
                color={NEON_PALETTE.primary}
              />
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '800',
                  color: NEON_PALETTE.text,
                  marginLeft: 12,
                }}
              >
                The Basics
              </Text>
            </View>
            <Text
              style={{
                fontSize: 13,
                color: NEON_PALETTE.text,
                marginTop: 12,
                lineHeight: 20,
              }}
            >
              Arrows fall from the top of the screen down four lanes. When an
              arrow reaches the row of direction buttons at the bottom, tap the
              matching arrow.
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: NEON_PALETTE.text,
                marginTop: 12,
                lineHeight: 20,
              }}
            >
              The closer your tap is to the exact moment the arrow crosses the
              buttons, the better your judgment. Chain hits without missing to
              build a combo and multiply your score.
            </Text>
          </Card>

          <View style={{ marginTop: 16 }}>
            <Card>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '800',
                  color: NEON_PALETTE.text,
                }}
              >
                The Four Directions
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: NEON_PALETTE.textDim,
                  marginTop: 4,
                }}
              >
                Each lane has its own neon color.
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  marginTop: 16,
                  gap: 12,
                }}
              >
                {DIRECTION_EXAMPLES.map((example) => (
                  <View
                    key={example.direction}
                    style={{
                      width: '47%',
                      borderRadius: 16,
                      padding: 16,
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: example.color,
                    }}
                  >
                    <Ionicons
                      name={example.icon}
                      size={36}
                      color={example.color}
                    />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '800',
                        color: example.color,
                        marginTop: 8,
                        letterSpacing: 1,
                      }}
                    >
                      {example.label}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>

          <View style={{ marginTop: 16 }}>
            <Card>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '800',
                  color: NEON_PALETTE.text,
                }}
              >
                Judgments
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: NEON_PALETTE.textDim,
                  marginTop: 4,
                }}
              >
                Timing windows in lane distance.
              </Text>

              <View style={{ marginTop: 8 }}>
                <JudgmentRow
                  color={NEON_PALETTE.perfect}
                  label="Perfect"
                  windowLabel="±3.5%"
                  points="300"
                />
                <JudgmentRow
                  color={NEON_PALETTE.great}
                  label="Great"
                  windowLabel="±7%"
                  points="200"
                />
                <JudgmentRow
                  color={NEON_PALETTE.good}
                  label="Good"
                  windowLabel="±12%"
                  points="100"
                />
                <JudgmentRow
                  color={NEON_PALETTE.miss}
                  label="Miss"
                  windowLabel="Beyond ±12%"
                  points="0"
                />
              </View>
            </Card>
          </View>

          <View style={{ marginTop: 16 }}>
            <Card>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '800',
                  color: NEON_PALETTE.text,
                }}
              >
                Combo & Score
              </Text>
              <