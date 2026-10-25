<script setup lang="ts">
import { useCopy } from '@/composable/copy';
import { useValidation } from '@/composable/validation';
import { isNotThrowing } from '@/utils/boolean';
import { withDefaultOnError } from '@/utils/defaults';

const textToEncode = ref('Hello world :)');
const encodedText = computed(() => withDefaultOnError(() => encodeURIComponent(textToEncode.value), ''));
const encodeValidation = useValidation({
  source: textToEncode,
  rules: [{ validator: value => isNotThrowing(() => encodeURIComponent(value)), message: 'Impossible to parse this string' }],
});
const { copy: copyEncoded } = useCopy({ source: encodedText });

const textToDecode = ref('Hello%20world%20%3A)');
const decodedText = computed(() => withDefaultOnError(() => decodeURIComponent(textToDecode.value), ''));
const decodeValidation = useValidation({
  source: textToDecode,
  rules: [{ validator: value => isNotThrowing(() => decodeURIComponent(value)), message: 'Impossible to parse this string' }],
});
const { copy: copyDecoded } = useCopy({ source: decodedText });
</script>

<template>
  <c-card title="Encode">
    <n-form-item label="Text to encode" :feedback="encodeValidation.message" :validation-status="encodeValidation.status">
      <c-input-text v-model:value="textToEncode" placeholder="Enter text or URL component" multiline autosize raw-text />
    </n-form-item>
    <c-input-text label="Encoded text" :value="encodedText" placeholder="Encoded output" multiline autosize raw-text readonly mt-2 />
    <div mt-2 flex justify-center>
      <c-button :disabled="!encodedText" @click="copyEncoded()">Copy encoded text</c-button>
    </div>
  </c-card>

  <c-card title="Decode">
    <n-form-item label="URL-encoded text" :feedback="decodeValidation.message" :validation-status="decodeValidation.status">
      <c-input-text v-model:value="textToDecode" placeholder="Enter percent-encoded text" multiline autosize raw-text />
    </n-form-item>
    <c-input-text label="Decoded text" :value="decodedText" placeholder="Decoded output" multiline autosize raw-text readonly mt-2 />
    <div mt-2 flex justify-center>
      <c-button :disabled="!decodedText" @click="copyDecoded()">Copy decoded text</c-button>
    </div>
  </c-card>
</template>
