import { TimerOutlined } from '@vicons/material';
import { defineTool } from '../tool';
import { translate } from '@/plugins/i18n.plugin';

export const tool = defineTool({
  name: translate('tools.chronometer.title'),
  path: '/chronometer',
  description: translate('tools.chronometer.description'),
  keywords: ['chronometer', 'timer', 'countdown', 'pomodoro', 'time', 'stopwatch', 'timezone'],
  component: () => import('./chronometer.vue'),
  icon: TimerOutlined,
});
