import { StyleSheet, Text } from "react-native";

import { Card } from "@/components/card";
import { ProgressCard } from "@/components/dashboard/progress-card";
import { RecentPRs } from "@/components/dashboard/recent-prs";
import { SectionTitle } from "@/components/dashboard/section-title";
import { Fonts } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { buildWeeklyExerciseBest1RM, getSortedWeeks } from "@/lib/dashboard/progress";
import { TABLES } from "@/lib/db/database";
import { useLiveQuery } from "@/lib/db/live-query";
import { useT } from "@/lib/i18n/locale-context";
import { listCompletedWorkoutLogs } from "@/lib/repositories/workouts";

import { BodyPartProgressCard } from "./body-part-progress-card";
import { EmptyCard } from "./empty-card";

// Progress → General (web: GeneralTab).
export function GeneralView() {
  const t = useT();
  const theme = useTheme();
  const logs = useLiveQuery(() => listCompletedWorkoutLogs(200), [TABLES.workoutLogs]);

  if (logs.length === 0) {
    return (
      <>
        <EmptyCard symbol="chart.line.uptrend.xyaxis" title={t.progress.noWorkoutsYet} body={t.progress.noWorkoutsHint} />
        <RecentPRs />
      </>
    );
  }

  const weeks = getSortedWeeks(buildWeeklyExerciseBest1RM(logs)).length;

  return (
    <>
      {weeks < 2 && <EmptyCard symbol="calendar.badge.clock" title={t.progress.noData} body={t.progress.needTwoWeeks} />}
      <ProgressCard />
      <BodyPartProgressCard logs={logs} />
      <RecentPRs />
      <Card>
        <SectionTitle symbol="figure.arms.open" title={t.progress.muscleHeatmap} />
        <Text style={[styles.comingSoon, { color: theme.primary }]}>{t.common.comingSoon}</Text>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  comingSoon: {
    fontFamily: Fonts?.mono,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
