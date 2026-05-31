import {BarChart} from 'react-native-gifted-charts';
import {Colors} from '@/constants/colors';
import {StudySessionLog} from '@/types';

export function WeeklyChart({logs}: {logs: StudySessionLog[]}) {
  const days = Array.from({length: 7}, (_, idx) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    const key = date.toISOString().slice(0, 10);
    const value = logs.filter(log => log.timestamp.slice(0, 10) === key).reduce((sum, log) => sum + log.durationMinutes, 0);
    return {label: date.toLocaleDateString(undefined, {weekday: 'short'}).slice(0, 1), value};
  });
  return <BarChart data={days} barWidth={24} frontColor={Colors.vibrant} yAxisThickness={0} xAxisColor={Colors.softBorder} />;
}
