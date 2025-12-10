# UI 组件源码汇总

## c-alert

- **源文件**: src/ui/c-alert/c-alert.vue

```vue
<script lang="ts" setup>
import { useTheme } from './c-alert.theme';

const props = withDefaults(defineProps<{ type?: 'warning'; title?: string }>(), { type: 'warning', title: undefined });
const { type, title } = toRefs(props);

const theme = useTheme();
const variantTheme = computed(() => theme.value[type.value]);
</script>

<template>
  <div class="c-alert" flex items-center b-rd-4px pa-5>
    <div class="c-alert--icon" mr-4 text-40px op-60>
      <slot name="icon">
        <component :is="variantTheme.icon" />
      </slot>
    </div>

    <div class="c-alert--content">
      <div v-if="title" class="c-alert--title" text-15px fw-600>
        {{ title }}
      </div>
      <slot />
    </div>
  </div>
</template>

<style lang="less" scoped>
.c-alert {
  background-color: v-bind('variantTheme.backgroundColor');
  color: v-bind('variantTheme.textColor');
  font-size: inherit;
  line-height: 20px;
}
</style>

```

## c-button

- **源文件**: src/ui/c-button/c-button.vue

```vue
<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router';
import { useAppTheme } from '../theme/themes';
import { useTheme } from './c-button.theme';

const props = withDefaults(
  defineProps<{
    type?: 'default' | 'primary' | 'warning' | 'error'
    variant?: 'basic' | 'text'
    disabled?: boolean
    round?: boolean
    circle?: boolean
    href?: string
    to?: RouteLocationRaw
    size?: 'small' | 'medium' | 'large'
  }>(),
  {
    type: 'default',
    variant: 'basic',
    disabled: false,
    round: false,
    circle: false,
    href: undefined,
    to: undefined,
    size: 'medium',
  },
);
const emits = defineEmits(['click']);

const { variant, disabled, round, circle, href, type, to, size: sizeName } = toRefs(props);

function handleClick(event: MouseEvent) {
  if (!disabled.value) {
    emits('click', event);
  }
}

const theme = useTheme();
const variantTheme = computed(() => theme.value[variant.value][type.value]);
const tag = computed(() => {
  if (href.value) {
    return 'a';
  }
  if (to.value) {
    return 'router-link';
  }
  return 'button';
});
const appTheme = useAppTheme();

const size = computed(() => theme.value.size[sizeName.value]);
</script>

<template>
  <component
    :is="tag"
    :href="href ?? to"
    class="c-button"
    :class="{ disabled, round, circle }"
    :to="to"
    @click="handleClick"
  >
    <slot />
  </component>
</template>

<style lang="less" scoped>
.c-button {
  line-height: 1;
  font-family: inherit;
  font-size: v-bind('size.fontSize');
  border: none;
  text-align: center;
  cursor: pointer;
  text-decoration: none;
  height: v-bind('size.width');
  font-weight: 400;
  color: v-bind('variantTheme.textColor');
  padding: 0 14px;
  border-radius: 4px;
  transition: background-color cubic-bezier(0.4, 0, 0.2, 1) 0.3s;

  background-color: v-bind('variantTheme.backgroundColor');
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  // outline-offset: 1px;
  &.round {
    border-radius: 100px;
  }

  &.circle {
    border-radius: v-bind('size.width');
    width: v-bind('size.width');
    padding: 0;
  }

  &:not(.disabled) {
    &:hover {
      background-color: v-bind('variantTheme.hover.backgroundColor');
    }

    &:active {
      background-color: v-bind('variantTheme.pressed.backgroundColor');
    }
  }

  &:focus {
    outline: 1px solid v-bind('appTheme.primary.color');
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>

```

## c-buttons-select

- **源文件**: src/ui/c-buttons-select/c-buttons-select.vue

```vue
<script setup lang="ts" generic="T extends unknown">
import _ from 'lodash';
import type { CLabelProps } from '../c-label/c-label.types';
import type { CButtonSelectOption } from './c-buttons-select.types';

const props = withDefaults(
  defineProps<{
    options?: CButtonSelectOption<T>[] | string[] | Record<string, T>
    value?: T
    size?: 'small' | 'medium' | 'large'
  } & CLabelProps >(),
  {
    options: () => [],
    value: undefined,
    labelPosition: 'left',
    size: 'medium',
  },
);

const emits = defineEmits(['update:value']);

const { options: rawOptions, size } = toRefs(props);

const options = computed<CButtonSelectOption<T>[]>(() => {
  if (_.isArray(rawOptions.value)) {
    return rawOptions.value.map((option: string | CButtonSelectOption<T>) => {
      if (typeof option === 'string') {
        return { label: option, value: option };
      }

      return option;
    }) as CButtonSelectOption<T>[];
  }

  return _.map(rawOptions.value, (value, label) => ({ label, value })) as CButtonSelectOption<T>[];
});

const value = useVModel(props, 'value', emits);

function selectOption(option: CButtonSelectOption<T>) {
  // @ts-expect-error vue template generic is a bit flacky thanks to withDefaults
  value.value = option.value;
}
</script>

<template>
  <c-label v-bind="props">
    <div class="flex gap-2">
      <c-tooltip
        v-for="option in options" :key="option.value"
        :tooltip="option.tooltip"
      >
        <c-button
          :test-id="option.value"
          :size="size"
          :type="option.value === value ? 'primary' : 'default'"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </c-button>
      </c-tooltip>
    </div>
  </c-label>
</template>

```

## c-card

- **源文件**: src/ui/c-card/c-card.vue

```vue
<script lang="ts" setup>
import { useTheme } from './c-card.theme';

const props = defineProps<{
  title?: string
}>();

const { title } = toRefs(props);

const theme = useTheme();
</script>

<template>
  <div class="c-card">
    <div v-if="title" class="c-card-title">
      {{ title }}
    </div>
    <slot />
  </div>
</template>

<style lang="less" scoped>
.c-card {
  background-color: v-bind('theme.backgroundColor');
  border: 1px solid v-bind('theme.borderColor');
  border-radius: 4px;
  padding: 20px 24px;

  &-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 20px;
  }
}
</style>

```

## c-collapse

- **源文件**: src/ui/c-collapse/c-collapse.vue

```vue
<script lang="ts" setup>
const props = withDefaults(defineProps<{ title?: string }>(), { title: '' });
const { title } = toRefs(props);

const isCollapsed = ref(true);
</script>

<template>
  <div>
    <div flex cursor-pointer items-center @click="isCollapsed = !isCollapsed">
      <icon-mdi-triangle-down :class="{ 'transform-rotate--90': isCollapsed }" op-50 transition />

      <slot name="title">
        <span class="ml-2" font-bold>{{ title }}</span>
      </slot>
    </div>

    <div
      v-show="!isCollapsed"
      mt-2
    >
      <slot />
    </div>
  </div>
</template>

```

## c-diff-editor

- **源文件**: src/ui/c-diff-editor/c-diff-editor.vue

```vue
<script setup lang="ts">
import * as monaco from 'monaco-editor';
import { useStyleStore } from '@/stores/style.store';

const props = withDefaults(defineProps<{ options?: monaco.editor.IDiffEditorOptions }>(), { options: () => ({}) });
const { options } = toRefs(props);

const editorContainer = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneDiffEditor | null = null;

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

  editor = monaco.editor.createDiffEditor(editorContainer.value, {
    originalEditable: true,
    minimap: {
      enabled: false,
    },
  });

  editor.setModel({
    original: monaco.editor.createModel('original text', 'txt'),
    modified: monaco.editor.createModel('modified text', 'txt'),
  });
});
</script>

<template>
  <div ref="editorContainer" h-600px />
</template>

```

## c-file-upload

- **源文件**: src/ui/c-file-upload/c-file-upload.vue

```vue
<script lang="ts" setup>
import _ from 'lodash';

const props = withDefaults(defineProps<{
  multiple?: boolean
  accept?: string
  title?: string
}>(), {
  multiple: false,
  accept: undefined,
  title: 'Drag and drop files here, or click to select files',
});

const emit = defineEmits<{
  (event: 'filesUpload', files: File[]): void
  (event: 'fileUpload', file: File): void
}>();

const { multiple } = toRefs(props);

const isOverDropZone = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);

function triggerFileInput() {
  fileInput.value?.click();
}

function handleFileInput(event: Event) {
  const files = (event.target as HTMLInputElement).files;

  handleUpload(files);
}

function handleDrop(event: DragEvent) {
  event.preventDefault();
  const files = event.dataTransfer?.files;

  handleUpload(files);
}

function handleUpload(files: FileList | null | undefined) {
  if (_.isNil(files) || _.isEmpty(files)) {
    return;
  }

  if (multiple.value) {
    emit('filesUpload', Array.from(files));
    return;
  }

  emit('fileUpload', files[0]);
}
</script>

<template>
  <div
    class="flex flex-col cursor-pointer items-center justify-center border-2px border-gray-300 border-opacity-50 rounded-lg border-dashed p-8 transition-colors"
    :class="{
      'border-primary border-opacity-100': isOverDropZone,
    }"
    @click="triggerFileInput"
    @drop.prevent="handleDrop"
    @dragover.prevent
    @dragenter="isOverDropZone = true"
    @dragleave="isOverDropZone = false"
  >
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      :multiple="multiple"
      :accept="accept"
      @change="handleFileInput"
    >
    <slot>
      <span op-70>
        {{ title }}
      </span>

      <!-- separator -->
      <div my-4 w-full flex items-center justify-center op-70>
        <div class="h-1px max-w-100px flex-1 bg-gray-300 op-50" />
        <div class="mx-2 text-gray-400">
          or
        </div>
        <div class="h-1px max-w-100px flex-1 bg-gray-300 op-50" />
      </div>

      <c-button>
        Browse files
      </c-button>
    </slot>
  </div>
</template>

```

## c-input-text

- **源文件**: src/ui/c-input-text/c-input-text.vue

```vue
<script lang="ts" setup>
import { useAppTheme } from '../theme/themes';
import { useTheme } from './c-input-text.theme';
import { generateRandomId } from '@/utils/random';
import { type UseValidationRule, useValidation } from '@/composable/validation';

const props = withDefaults(
  defineProps<{
    value?: string
    id?: string
    placeholder?: string
    label?: string
    readonly?: boolean
    disabled?: boolean
    validationRules?: UseValidationRule<string>[]
    validationWatch?: Ref<unknown>[]
    validation?: ReturnType<typeof useValidation>
    labelPosition?: 'top' | 'left'
    labelWidth?: string
    labelAlign?: 'left' | 'right'
    clearable?: boolean
    testId?: string
    autocapitalize?: 'none' | 'sentences' | 'words' | 'characters' | 'on' | 'off' | string
    autocomplete?: 'on' | 'off' | string
    autocorrect?: 'on' | 'off' | string
    spellcheck?: 'true' | 'false' | boolean
    rawText?: boolean
    type?: 'text' | 'password'
    multiline?: boolean
    rows?: number | string
    autosize?: boolean
    autofocus?: boolean
    monospace?: boolean
  }>(),
  {
    value: '',
    id: generateRandomId,
    placeholder: 'Input text',
    label: undefined,
    readonly: false,
    disabled: false,
    validationRules: () => [],
    validationWatch: undefined,
    validation: undefined,
    labelPosition: 'top',
    labelWidth: 'auto',
    labelAlign: 'left',
    clearable: false,
    testId: undefined,
    autocapitalize: undefined,
    autocomplete: undefined,
    autocorrect: undefined,
    spellcheck: undefined,
    rawText: false,
    type: 'text',
    multiline: false,
    rows: 3,
    autosize: false,
    autofocus: false,
    monospace: false,
  },
);
const emit = defineEmits(['update:value']);
const value = useVModel(props, 'value', emit);
const showPassword = ref(false);

const { id, placeholder, label, validationRules, labelPosition, labelWidth, labelAlign, autosize, readonly, disabled, clearable, type, multiline, rows, rawText, autofocus, monospace } = toRefs(props);

const validation
  = props.validation
  ?? useValidation({
    rules: validationRules,
    source: value,
    watch: props.validationWatch,
  });

const theme = useTheme();
const appTheme = useAppTheme();

const textareaRef = ref<HTMLTextAreaElement>();
const inputRef = ref<HTMLInputElement>();
const inputWrapperRef = ref<HTMLElement>();

watch(
  [value, autosize, multiline, inputWrapperRef, textareaRef],
  () => nextTick(() => {
    if (props.multiline && autosize.value) {
      resizeTextarea();
    }
  }),
  { immediate: true },
);

function resizeTextarea() {
  if (!textareaRef.value || !inputWrapperRef.value) {
    return;
  }

  const scrollHeight = textareaRef.value.scrollHeight + 2;

  inputWrapperRef.value.style.height = `${scrollHeight}px`;
}

const htmlInputType = computed(() => {
  if (props.type === 'password' && !showPassword.value) {
    return 'password';
  }

  return 'text';
});

function focus() {
  if (textareaRef.value) {
    textareaRef.value.focus();
  }

  if (inputRef.value) {
    inputRef.value.focus();
  }
}

function blur() {
  if (textareaRef.value) {
    textareaRef.value.blur?.();
  }

  if (inputRef.value) {
    inputRef.value.blur?.();
  }
}

onMounted(() => {
  if (autofocus.value) {
    focus();
  }
});

defineExpose({
  inputWrapperRef,
  focus,
  blur,
});
</script>

<template>
  <div
    class="c-input-text"
    :class="{ disabled, 'error': !validation.isValid, 'label-left': labelPosition === 'left', multiline }"
  >
    <label v-if="label" :for="id" class="label"> {{ label }} </label>

    <div class="feedback-wrapper">
      <div ref="inputWrapperRef" class="input-wrapper">
        <slot name="prefix" />

        <textarea
          v-if="multiline"
          :id="id"
          ref="textareaRef"
          v-model="value"
          class="input"
          :class="{
            'leading-5 !font-mono': monospace,
          }"
          :placeholder="placeholder"
          :readonly="readonly"
          :disabled="disabled"
          :data-test-id="testId"
          :autocapitalize="autocapitalize ?? (rawText ? 'off' : undefined)"
          :autocomplete="autocomplete ?? (rawText ? 'off' : undefined)"
          :autocorrect="autocorrect ?? (rawText ? 'off' : undefined)"
          :spellcheck="spellcheck ?? (rawText ? false : undefined)"
          :rows="rows"
        />

        <input
          v-else
          :id="id"
          ref="inputRef"
          v-model="value"
          :type="htmlInputType"
          class="input"
          :class="{
            'leading-5 !font-mono': monospace,
          }"
          size="1"
          :placeholder="placeholder"
          :readonly="readonly"
          :disabled="disabled"
          :data-test-id="testId"
          :autocapitalize="autocapitalize ?? (rawText ? 'off' : undefined)"
          :autocomplete="autocomplete ?? (rawText ? 'off' : undefined)"
          :autocorrect="autocorrect ?? (rawText ? 'off' : undefined)"
          :spellcheck="spellcheck ?? (rawText ? false : undefined)"
        >

        <c-button v-if="clearable && value" variant="text" circle size="small" @click="value = ''">
          <icon-mdi-close />
        </c-button>

        <c-button v-if="type === 'password'" variant="text" circle size="small" @click="showPassword = !showPassword">
          <icon-mdi-eye v-if="!showPassword" />
          <icon-mdi-eye-off v-if="showPassword" />
        </c-button>
        <slot name="suffix" />
      </div>
      <span v-if="!validation.isValid" class="feedback"> {{ validation.message }} </span>
    </div>
  </div>
</template>

<style lang="less" scoped>
.c-input-text {
  display: inline-flex;
  flex-direction: column;
  width: 100%;

  &.label-left {
    flex-direction: row;
    align-items: baseline;
  }

  &.error {
    & > .input {
      border-color: v-bind('appTheme.error.color');
      &:hover,
      &:focus {
        border-color: v-bind('appTheme.error.color');
      }

      &:focus {
        background-color: v-bind('appTheme.error.color + 22');
      }
    }

    & .feedback {
      color: v-bind('appTheme.error.color');
    }
  }

  & > .label {
    margin-bottom: 5px;
    flex: 0 0 v-bind('labelWidth');
    text-align: v-bind('labelAlign');
    padding-right: 12px;
  }

  .feedback-wrapper {
    flex: 1 1 0;
    min-width: 0;
  }
  .input-wrapper {
    display: flex;
    flex-direction: row;
    align-items: center;
    background-color: v-bind('theme.backgroundColor');
    color: transparent;
    border: 1px solid v-bind('theme.borderColor');
    border-radius: 4px;
    padding: 0 4px 0 12px;
    transition: border-color 0.2s ease-in-out;

    .multiline& {
      resize: vertical;
      overflow: hidden;

      & > textarea {
        height: 100%;
        resize: none;
        word-break: break-word;
        white-space: pre-wrap;
        overflow-wrap: break-word;
        border: none;
        outline: none;
        font-family: inherit;
        font-size: inherit;
        color: v-bind('appTheme.text.baseColor');

        &::placeholder {
          color: v-bind('appTheme.text.mutedColor');
        }
      }
    }

    & > .input {
      flex: 1 1 0;
      min-width: 0;
      padding: 10px 0;
      outline: none;
      background-color: transparent;
      background-image: none;
      -webkit-box-shadow: none;
      -moz-box-shadow: none;
      box-shadow: none;
      border: none;
      color: v-bind('appTheme.text.baseColor');

      &::placeholder {
        color: v-bind('appTheme.text.mutedColor');
      }
    }

    &:hover {
      border-color: v-bind('appTheme.primary.color');
    }

    &:focus-within {
      border-color: v-bind('appTheme.primary.color');

      background-color: v-bind('theme.focus.backgroundColor');
    }
  }

  &.error .input-wrapper {
    border-color: v-bind('appTheme.error.color');

    &:hover,
    &:focus-within {
      border-color: v-bind('appTheme.error.color');
    }

    &:focus-within {
      background-color: v-bind('appTheme.error.color + 22');
    }
  }

  &.disabled .input-wrapper {
    opacity: 0.5;

    &:hover,
    &:focus-within {
      border-color: v-bind('theme.borderColor');
    }

    & > .input {
      cursor: not-allowed;
    }
  }
}
</style>

```

## c-key-value-list

- **源文件**: src/ui/c-key-value-list/c-key-value-list.vue

```vue
<script lang="ts" setup>
import _ from 'lodash';
import type { CKeyValueListItems } from './c-key-value-list.types';

const props = withDefaults(defineProps<{ items?: CKeyValueListItems }>(), { items: () => [] });
const { items } = toRefs(props);

const formattedItems = computed(() => items.value.filter(item => !_.isNil(item.value) || !item.hideOnNil));
</script>

<template>
  <div flex flex-col gap-2>
    <div v-for="item in formattedItems" :key="item.label" class="c-key-value-list__item">
      <div class="c-key-value-list__key" text-13px lh-normal>
        {{ item.label }}
      </div>

      <c-key-value-list-item :item="item" class="c-key-value-list__value" font-bold lh-normal />
    </div>
  </div>
</template>

```

## c-label

- **源文件**: src/ui/c-label/c-label.vue

```vue
<script lang="ts" setup>
import { toRefs } from 'vue';
import type { CLabelProps } from './c-label.types';

const props = withDefaults(defineProps<CLabelProps>(), { label: undefined, labelAlign: 'left', labelFor: undefined, labelPosition: 'top', labelWidth: 'auto' });
const { label, labelAlign, labelFor, labelPosition, labelWidth } = toRefs(props);
</script>

<template>
  <div
    :class="{
      'flex-col': labelPosition === 'top',
      'flex-row': labelPosition === 'left',
    }"
    flex
    items-baseline
  >
    <label
      v-if="label" :for="labelFor" :style="{ flex: `0 0 ${labelWidth}` }"
      mb-5px
      pr-12px
      :class="{
        'text-left': labelAlign === 'left',
        'text-center': labelAlign === 'center',
        'text-right': labelAlign === 'right',
      }"
    >
      {{ label }}
    </label>
    <slot />
  </div>
</template>

```

## c-link

- **源文件**: src/ui/c-link/c-link.vue

```vue
<script lang="ts" setup>
import { type RouteLocationRaw, RouterLink } from 'vue-router';
import { useTheme } from './c-link.theme';

const props = defineProps<{
  href?: string
  to?: RouteLocationRaw
}>();

const { href, to } = toRefs(props);

const theme = useTheme();
const tag = computed(() => {
  if (href?.value) {
    return 'a';
  }
  if (to?.value) {
    return RouterLink;
  }
  return 'span';
});
</script>

<template>
  <component :is="tag" :href="href ?? to" class="c-link" :to="to">
    <slot />
  </component>
</template>

<style lang="less" scoped>
.c-link {
  line-height: inherit;
  font-family: inherit;
  font-size: inherit;
  border: none;
  cursor: pointer;
  text-decoration: none;
  font-weight: 400;
  color: v-bind('theme.default.textColor');
  border-radius: 4px;
  transition: color cubic-bezier(0.4, 0, 0.2, 1) 0.3s;

  outline-offset: 1px;

  &:hover {
    color: v-bind('theme.default.hover.textColor');
  }

  &:active {
    color: v-bind('theme.default.textColor');
  }

  &:focus {
    color: v-bind('theme.default.outline.color');
  }
}
</style>

```

## c-markdown

- **源文件**: src/ui/c-markdown/c-markdown.vue

```vue
<script setup lang="ts">
import { marked } from 'marked';
import DomPurify from 'dompurify';

const props = withDefaults(defineProps<{ markdown?: string }>(), { markdown: '' });
const { markdown } = toRefs(props);

marked.use({
  renderer: {
    link(href, title, text) {
      return `<a class="text-primary transition decoration-none hover:underline" href="${href}" target="_blank" rel="noopener">${text}</a>`;
    },
  },
});

const html = computed(() => DomPurify.sanitize(marked(markdown.value), { ADD_ATTR: ['target'] }));
</script>

<template>
  <div v-html="html" />
</template>

```

## c-modal

- **源文件**: src/ui/c-modal/c-modal.vue

```vue
<script setup lang="ts">
import { useTheme } from './c-modal.theme';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{ open?: boolean; centered?: boolean }>(), {
  open: false,
  centered: true,
});

const emit = defineEmits(['update:open']);

const isOpen = useVModel(props, 'open', emit, { passive: true });

const { centered } = toRefs(props);

function close() {
  isOpen.value = false;
}

function open() {
  isOpen.value = true;
}

function toggle() {
  isOpen.value = !isOpen.value;
}

defineExpose({
  close,
  open,
  toggle,
  isOpen,
});

const theme = useTheme();
const modal = ref();

onClickOutside(modal, () => {
  if (isOpen.value) {
    close();
  }
});
</script>

<template>
  <transition>
    <div v-if="isOpen" class="c-modal--overlay" fixed left-0 top-0 z-10 h-full w-full flex justify-center px-2 :class="{ 'items-center': centered }">
      <div ref="modal" class="c-modal--container" v-bind="$attrs" max-w-xl w-full flex-grow rounded-md pa-24px>
        <slot />
      </div>
    </div>
  </transition>
</template>

<style scoped lang="less">
.c-modal--overlay {
  background-color: rgba(0, 0, 0, 0.5);
}

.c-modal--container {
  background-color: v-bind('theme.background');
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>

```

## c-modal-value

- **源文件**: src/ui/c-modal-value/c-modal-value.vue

```vue
<script lang="ts" setup>
import { useCopy } from '@/composable/copy';

const props = withDefaults(defineProps<{ value: string; label?: string; copyable?: boolean }>(), { label: undefined, copyable: true });
const { value, label } = toRefs(props);

const { copy, isJustCopied } = useCopy({ source: value });

const isModalOpen = ref(false);
const toggleModal = useToggle(isModalOpen);
</script>

<template>
  <slot name="label" :value="value" :toggle-modal="toggleModal" :is-modal-open="isModalOpen">
    <c-button class="text-left" @click="isModalOpen = true">
      {{ label }}
    </c-button>
  </slot>

  <c-modal v-model:open="isModalOpen">
    <slot name="value" :value="value" :toggle-modal="toggleModal" :is-modal-open="isModalOpen">
      {{ value }}
    </slot>

    <div mt-4 flex justify-center>
      <c-button class="w-full" @click="copy">
        {{ isJustCopied ? 'Copied!' : 'Copy' }}
      </c-button>
    </div>
  </c-modal>
</template>

```

## c-select

- **源文件**: src/ui/c-select/c-select.vue

```vue
<script setup lang="ts" generic="T extends unknown">
import { useAppTheme } from '../theme/themes';
import type { CLabelProps } from '../c-label/c-label.types';
import type { CSelectOption } from './c-select.types';
import { useTheme } from './c-select.theme';
import { clamp } from '@/modules/shared/number.models';
import { useFuzzySearch } from '@/composable/fuzzySearch';

const props = withDefaults(
  defineProps<{
    options?: CSelectOption<T>[] | string[]
    value?: T
    placeholder?: string
    size?: 'small' | 'medium' | 'large'
    searchable?: boolean
  } & CLabelProps >(),
  {
    options: () => [],
    value: undefined,
    placeholder: undefined,
    size: 'medium',
    searchable: false,
  },
);

const emits = defineEmits(['update:value']);

const { options: rawOptions, placeholder, size: sizeName, searchable } = toRefs(props);

const options = computed(() => {
  return rawOptions.value.map((option: string | CSelectOption<T>) => {
    if (typeof option === 'string') {
      return { label: option, value: option };
    }

    return option;
  });
});

const keys = useMagicKeys();
const value = useVModel(props, 'value', emits);
const theme = useTheme();
const appTheme = useAppTheme();

const isOpen = ref(false);
const selectedOption = shallowRef<CSelectOption<T> | undefined>(options.value.find((option: CSelectOption<T>) => option.value === value.value));
const focusIndex = ref(0);
const elementRef = ref(null);

const size = computed(() => theme.value.sizes[sizeName.value as 'small' | 'medium' | 'large']);

const searchQuery = ref('');
const searchInputRef = ref();

whenever(() => !isOpen.value, () => {
  focusIndex.value = 0;
  searchQuery.value = '';
});

whenever(() => isOpen.value, () => {
  nextTick(() => searchInputRef.value?.focus());
});

onClickOutside(elementRef, close);
whenever(keys.escape, close);

watch(
  value,
  (newValue) => {
    const option = options.value.find((option: CSelectOption<T>) => option.value === newValue);
    if (option) {
      selectedOption.value = option;
    }
  },
);

const { searchResult: filteredOptions } = useFuzzySearch<CSelectOption<T>>({
  search: searchQuery,
  data: options.value,
  options: {
    keys: ['label'],
    shouldSort: false,
    threshold: 0.3,
    filterEmpty: false,
  },
});

function close() {
  isOpen.value = false;
}

function toggleOpen() {
  isOpen.value = !isOpen.value;
}

function selectOption({ option }: { option: CSelectOption<T> }) {
  selectedOption.value = option;
  // @ts-expect-error vue template generic is a bit flacky thanks to withDefaults
  value.value = option.value;
  isOpen.value = false;
}

function handleKeydown(event: KeyboardEvent) {
  const { key } = event;
  const isEnter = ['Enter'].includes(key);
  const isArrowUpOrDown = ['ArrowUp', 'ArrowDown'].includes(key);
  const isArrowDown = key === 'ArrowDown';

  if (isEnter) {
    const valueCanBeSelected = isOpen.value && focusIndex.value !== -1;

    if (valueCanBeSelected) {
      selectOption({ option: filteredOptions.value[focusIndex.value] });
    }
    else {
      toggleOpen();
    }

    event.preventDefault();
    return;
  }

  if (isArrowUpOrDown) {
    const increment = isArrowDown ? 1 : -1;
    focusIndex.value = clamp({
      value: focusIndex.value + increment,
      min: 0,
      max: options.value.length - 1,
    });

    event.preventDefault();
  }
}

function onSearchInput() {
  focusIndex.value = 0;
}
</script>

<template>
  <c-label v-bind="props">
    <div ref="elementRef" relative class="c-select" w-full>
      <div
        flex flex-nowrap cursor-pointer items-center
        :class="{ 'is-open': isOpen, 'important:border-primary': isOpen }"
        class="c-select-input"
        tabindex="0"
        hover:important:border-primary
        @click="toggleOpen"
        @keydown="handleKeydown"
      >
        <div flex-1 truncate>
          <slot name="displayed-value">
            <input v-if="searchable && isOpen" ref="searchInputRef" v-model="searchQuery" type="text" placeholder="Search..." class="search-input" w-full lh-normal color-current @input="onSearchInput">
            <span v-else-if="selectedOption" lh-normal>
              {{ selectedOption.label }}
            </span>
            <span v-else class="placeholder" lh-normal>
              {{ placeholder ?? 'Select an option' }}
            </span>
          </slot>
        </div>

        <icon-mdi-chevron-down class="chevron" />
      </div>

      <transition name="dropdown">
        <div v-show="isOpen" class="c-select-dropdown" absolute z-10 mt-1 max-h-312px w-full overflow-y-auto pretty-scrollbar>
          <template v-if="!filteredOptions.length">
            <slot name="empty">
              <div px-4 py-1 opacity-70>
                No results found
              </div>
            </slot>
          </template>
          <template v-else>
            <div
              v-for="(option, index) in filteredOptions"
              :key="option.label"
              cursor-pointer
              px-4
              py-1
              :class="{ active: selectedOption?.label === option.label, hover: focusIndex === index }"
              class="c-select-dropdown-option"
              @click="selectOption({ option })"
            >
              {{ option.label }}
            </div>
          </template>
        </div>
      </transition>
    </div>
  </c-label>
</template>

<style lang="less" scoped>
.c-select {
  .search-input{
    all: unset;

    &::placeholder {
      color: v-bind('appTheme.text.mutedColor');
    }
  }

  .c-select-input {
    background-color: v-bind('theme.backgroundColor');
    border: 1px solid v-bind('theme.borderColor');
    border-radius: 4px;
    padding: 0 12px;
    font-family: inherit;
    font-size: v-bind('size.fontSize');
    height: v-bind('size.height');
    transition: border-color 0.2s ease-in-out;

    .placeholder, .chevron {
      color: v-bind('appTheme.text.mutedColor');
    }
  }

  .c-select-dropdown {
    background-color: v-bind('theme.backgroundColor');
    border-radius: 4px;
    // box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
    box-shadow: v-bind('theme.dropdownShadow');
    font-family: inherit;
    font-size: inherit;
    line-height: 1;
    padding: 6px;

    .c-select-dropdown-option{
      border-radius: 4px;
      padding: 8px 12px;
      background-color: transparent;
      transition: background-color 0.2s ease-in-out;

      &.active {
        color: v-bind('theme.option.active.textColor');
      }

      &:hover, &.hover {
        background-color: v-bind('theme.option.hover.backgroundColor');
      }
    }
  }
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-enter-to,
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>

```

## c-table

- **源文件**: src/ui/c-table/c-table.vue

```vue
<script lang="ts" setup>
import _ from 'lodash';
import type { HeaderConfiguration } from './c-table.types';

const props = withDefaults(defineProps<{ data?: Record<string, unknown>[]; headers?: HeaderConfiguration ; hideHeaders?: boolean; description?: string }>(), { data: () => [], headers: undefined, hideHeaders: false, description: 'Data table' });
const { data, headers: rawHeaders, hideHeaders } = toRefs(props);

const headers = computed(() => {
  if (rawHeaders.value) {
    if (Array.isArray(rawHeaders.value)) {
      return rawHeaders.value.map((value) => {
        if (typeof value === 'string') {
          return { key: value, label: value };
        }

        const { key, label } = value;

        return {
          key,
          label: label ?? key,
        };
      });
    }

    return _.map(rawHeaders.value, (value, key) => ({
      key, label: value,
    }));
  }

  return _.chain(data.value)
    .map(row => Object.keys(row))
    .flatten()
    .uniq()
    .map(key => ({ key, label: key }))
    .value();
});
</script>

<template>
  <div class="relative overflow-x-auto rounded">
    <table class="w-full border-collapse text-left text-sm text-gray-500 dark:text-gray-400" role="table" :aria-label="description">
      <thead v-if="!hideHeaders" class="bg-#ffffff uppercase text-gray-700 dark:bg-#333333 dark:text-gray-400" border-b="1px solid dark:transparent #efeff5">
        <tr>
          <th v-for="header in headers" :key="header.key" scope="col" class="px-6 py-3 text-xs">
            {{ header.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in data" :key="i" border-b="1px solid dark:#282828 #efeff5" class="bg-white dark:bg-#232323"
          :class="{
            'important:border-b-none': i === data.length - 1,
          }"
        >
          <td v-for="header in headers" :key="header.key" class="px-6 py-4">
            <slot :name="header.key" :row="row" :headers="headers" :value="row[header.key]">
              {{ row[header.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

```

## c-text-copyable

- **源文件**: src/ui/c-text-copyable/c-text-copyable.vue

```vue
<script setup lang="ts">
import { useCopy } from '@/composable/copy';

const props = withDefaults(defineProps<{ value?: string; displayedValue?: string; showIcon?: boolean }>(), { value: '', displayedValue: undefined, showIcon: true });
const { value, displayedValue, showIcon } = toRefs(props);

const { copy, isJustCopied } = useCopy({ source: value, createToast: false });
</script>

<template>
  <c-tooltip :tooltip="isJustCopied ? 'Copied!' : 'Copy to clipboard'" cursor-pointer @click="copy">
    <span flex items-center gap-2>
      {{ displayedValue ?? value }}
      <icon-mdi-content-copy v-if="showIcon" op-40 />
    </span>
  </c-tooltip>
</template>

```

## c-tooltip

- **源文件**: src/ui/c-tooltip/c-tooltip.vue

```vue
<script setup lang="ts">
const props = withDefaults(defineProps<{ tooltip?: string; position?: 'top' | 'bottom' | 'left' | 'right' }>(), {
  tooltip: undefined,
  position: 'top',
});
const { tooltip, position } = toRefs(props);

const targetRef = ref();
const isTargetHovered = useElementHover(targetRef);
</script>

<template>
  <div relative inline-block>
    <div ref="targetRef">
      <slot />
    </div>

    <div
      v-if="tooltip || $slots.tooltip"
      class="absolute z-10 whitespace-nowrap rounded bg-black px-12px py-6px text-sm text-white shadow-lg transition transition transition-duration-0.2s"
      :class="{
        'op-0 scale-0': isTargetHovered === false,
        'op-100 scale-100': isTargetHovered,
        'bottom-100% left-50% -translate-x-1/2 mb-5px': position === 'top',
        'top-100% left-50% -translate-x-1/2 mt-5px': position === 'bottom',
        'right-100% top-50% -translate-y-1/2 mr-5px': position === 'left',
        'left-100% top-50% -translate-y-1/2 ml-5px': position === 'right',
      }"
    >
      <slot
        v-if="isTargetHovered"
        name="tooltip"
      >
        {{ tooltip }}
      </slot>
    </div>
  </div>
</template>

```

