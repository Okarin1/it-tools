import { AB } from '@vicons/tabler';
import { defineTool } from '../tool';

export const tool = defineTool({
  name: 'Fancy Text Converter',
  path: '/fancy-text-converter',
  description: 'Convert normal text to various fancy styles.',
  keywords: ['text', 'converter'],
  component: () => import('./fancy-text-converter.vue'),
  icon: AB,
  createdAt: new Date('2025-03-17'),
});
