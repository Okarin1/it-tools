import { ArrowsShuffle } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Crontab generator',
  path: '/crontab-generator',
  description: '',
  keywords: ['crontab', 'generator'],
  component: () => import('./crontab-generator.vue'),
  icon: ArrowsShuffle,
  createdAt: new Date('2025-11-24'),
});
