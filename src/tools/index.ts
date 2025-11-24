import { tool as base64StringConverter } from './base64-string-converter';
import { tool as asciiTextDrawer } from './ascii-text-drawer';
import { tool as textToUnicode } from './text-to-unicode';
import { tool as myIp } from './my-ip';
import { tool as textDiff } from './text-diff';
import { tool as emojiPicker } from './emoji-picker';
import { tool as listConverter } from './list-converter';
import { tool as jsonDiff } from './json-diff';
import { tool as caseConverter } from './case-converter';
import { tool as colorConverter } from './color-converter';
import { tool as dateTimeConverter } from './date-time-converter';
import { tool as textStatistics } from './text-statistics';
import { tool as textToBinary } from './text-to-binary';
import { tool as tokenGenerator } from './token-generator';
import type { ToolCategory } from './tools.types';
import { tool as uuidGenerator } from './uuid-generator';
import { tool as jsonViewer } from './json-viewer';
import { tool as jsonMinify } from './json-minify';
import { tool as sqlPrettify } from './sql-prettify';
import { tool as qrCodeGenerator } from './qr-code-generator';
import { tool as fancyTextConverter } from './fancy-text-converter';
import { tool as jsonToData } from './json-to-data';

export const toolsByCategory: ToolCategory[] = [
  {
    name: 'Crypto',
    components: [tokenGenerator, uuidGenerator],
  },
  {
    name: 'Converter',
    components: [
      dateTimeConverter,
      base64StringConverter,
      colorConverter,
      caseConverter,
      textToBinary,
      textToUnicode,
      listConverter,
      fancyTextConverter,
    ],
  },
  {
    name: 'Web',
    components: [
      qrCodeGenerator,
      myIp,
    ],
  },
  {
    name: 'Development',
    components: [
      jsonViewer,
      jsonMinify,
      jsonDiff,
      jsonToData,
      sqlPrettify,
    ],
  },
  {
    name: 'Text',
    components: [
      textStatistics,
      emojiPicker,
      textDiff,
      asciiTextDrawer,
    ],
  },
];

export const tools = toolsByCategory.flatMap(({ components }) => components);
export const toolsWithCategory = toolsByCategory.flatMap(({ components, name }) =>
  components.map(tool => ({ category: name, ...tool })),
);
