<script setup lang="ts">
import type * as monaco from 'monaco-editor';

const diffOptions: monaco.editor.IDiffEditorOptions = {
  diffAlgorithm: 'legacy',
  ignoreTrimWhitespace: false,
  maxComputationTime: 1500,
  renderWhitespace: 'all',
  unicodeHighlight: {
    ambiguousCharacters: false,
    invisibleCharacters: true,
    nonBasicASCII: false,
  },
};
</script>

<template>
  <c-card w-full important:flex-1 important:pa-0>
    <c-diff-editor :options="diffOptions" />
  </c-card>
</template>
