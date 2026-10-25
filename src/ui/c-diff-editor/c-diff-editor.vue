<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { useStyleStore } from '@/stores/style.store';

const props = withDefaults(defineProps<{ options?: monaco.editor.IDiffEditorOptions }>(), { options: () => ({}) });
const { options } = toRefs(props);

const editorContainer = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneDiffEditor | null = null;
let hoverProvider: monaco.IDisposable | null = null;

monaco.editor.defineTheme('it-tools-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#00000000',
  },
});

monaco.editor.defineTheme('it-tools-light', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#00000000',
  },
});

const styleStore = useStyleStore();

watch(
  () => styleStore.isDarkTheme,
  isDarkTheme => monaco.editor.setTheme(isDarkTheme ? 'it-tools-dark' : 'it-tools-light'),
  { immediate: true },
);

watch(
  () => options.value,
  options => editor?.updateOptions(options),
  { immediate: true, deep: true },
);

useResizeObserver(editorContainer, () => {
  editor?.layout();
});

onMounted(() => {
  if (!editorContainer.value) {
    return;
  }

  hoverProvider = monaco.languages.registerHoverProvider('plaintext', {
    provideHover(model, position) {
      const line = model.getLineContent(position.lineNumber);
      const offset = position.column - 1;
      const codePoint = line.codePointAt(offset);
      if (codePoint === undefined) {
        return null;
      }

      const character = String.fromCodePoint(codePoint);
      const codePointLabel = `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
      const characterLabel = character === ' '
        ? 'SPACE'
        : character === '\u00A0'
          ? 'NO-BREAK SPACE'
          : `\`${character}\``;

      return {
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column + character.length),
        contents: [{ value: `**Unicode:** ${codePointLabel}  \n**Character:** ${characterLabel}` }],
      };
    },
  });

  editor = monaco.editor.createDiffEditor(editorContainer.value, {
    originalEditable: true,
    minimap: {
      enabled: false,
    },
    ...options.value,
  });

  editor.setModel({
    original: monaco.editor.createModel('original text', 'plaintext'),
    modified: monaco.editor.createModel('modified text', 'plaintext'),
  });
});

onBeforeUnmount(() => {
  const model = editor?.getModel();
  hoverProvider?.dispose();
  editor?.dispose();
  model?.original.dispose();
  model?.modified.dispose();
  editor = null;
});
</script>

<template>
  <div ref="editorContainer" h-600px />
</template>
