<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import cronstrue from 'cronstrue';
import 'cronstrue/locales/zh_CN';
import InputCopyable from '../../components/InputCopyable.vue';

const { t, locale } = useI18n();

const cronstrueLocale = computed(() => {
  const l = locale.value?.toLowerCase?.() ?? '';
  if (l.startsWith('zh')) {
    return 'zh_CN';
  }
  // 默认使用 cronstrue 内置英文
  return undefined;
});

// --- Types & Constants ---
type CronType = '*' | '?' | 'range' | 'step' | 'specific';

// 根据当前语言切换星期显示：中文用 日一二三四五六，其他语言用英文缩写
const weekNames = computed(() => {
  const l = locale.value?.toLowerCase?.() ?? '';
  if (l.startsWith('zh')) {
    return ['日', '一', '二', '三', '四', '五', '六'];
  }
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
});

interface CronState {
  type: CronType
  rangeStart: number
  rangeEnd: number
  stepStart: number
  stepInterval: number
  specificList: number[]
}

const cronMode = ref<'standard' | 'advanced'>('standard');
const isAdvanced = computed(() => cronMode.value === 'advanced');

const advancedFieldCount = ref<6 | 7>(6);
const isSevenFieldMode = computed({
  get: () => isAdvanced.value && advancedFieldCount.value === 7,
  set: (value: boolean) => {
    if (isAdvanced.value) {
      advancedFieldCount.value = value ? 7 : 6;
    }
  },
});

const modeOptions = computed(() => [
  { value: 'standard', label: t('tools.crontab-generator.texts.mode.standard') },
  { value: 'advanced', label: t('tools.crontab-generator.texts.mode.advanced') },
]);

const tabOptions = computed(() => {
  const base = [
    { value: 'minute', label: t('tools.crontab-generator.texts.tabs.minute') },
    { value: 'hour', label: t('tools.crontab-generator.texts.tabs.hour') },
    { value: 'day', label: t('tools.crontab-generator.texts.tabs.day') },
    { value: 'month', label: t('tools.crontab-generator.texts.tabs.month') },
    { value: 'week', label: t('tools.crontab-generator.texts.tabs.week') },
  ];

  if (isAdvanced.value) {
    base.unshift({ value: 'second', label: t('tools.crontab-generator.texts.tabs.second') });
    if (advancedFieldCount.value === 7) {
      base.push({ value: 'year', label: t('tools.crontab-generator.texts.tabs.year') });
    }
  }

  return base;
});

// Helper for week Select options - 跟随 weekNames 和 locale 变化，值为 0-6（0=周日）
const weekOptions = computed(() => weekNames.value.map((name, index) => ({ label: name, value: index })));

const currentTab = ref('minute');

// --- Reactive State ---
const second = reactive<CronState>({ type: '*', rangeStart: 0, rangeEnd: 59, stepStart: 0, stepInterval: 1, specificList: [] });
const minute = reactive<CronState>({ type: '*', rangeStart: 0, rangeEnd: 59, stepStart: 0, stepInterval: 1, specificList: [] });
const hour = reactive<CronState>({ type: '*', rangeStart: 0, rangeEnd: 23, stepStart: 0, stepInterval: 1, specificList: [] });
const day = reactive<CronState>({ type: '*', rangeStart: 1, rangeEnd: 31, stepStart: 1, stepInterval: 1, specificList: [] });
const month = reactive<CronState>({ type: '*', rangeStart: 1, rangeEnd: 12, stepStart: 1, stepInterval: 1, specificList: [] });
// 星期内部使用 0-6（0=周日），与 cronstrue 默认的 day-of-week 规则对齐
const week = reactive<CronState>({ type: '?', rangeStart: 0, rangeEnd: 6, stepStart: 0, stepInterval: 1, specificList: [] });
const year = reactive<CronState>({ type: '*', rangeStart: 1970, rangeEnd: 2099, stepStart: 1970, stepInterval: 1, specificList: [] });

watch(cronMode, (mode) => {
  if (mode === 'standard' && (currentTab.value === 'second' || currentTab.value === 'year')) {
    // 标准模式下没有 秒 / 年，强制回到分钟
    currentTab.value = 'minute';
  }
  else if (mode === 'advanced' && currentTab.value === 'minute') {
    // 切到高级模式时，如果还是默认的分钟 Tab，就自动切到秒
    currentTab.value = 'second';
  }
});

// --- Helpers ---
const formatPad = (val: number) => val < 10 ? `0${val}` : val;

function generateField(state: CronState): string {
  switch (state.type) {
    case '*': return '*';
    case '?': return '?';
    case 'range': return `${state.rangeStart}-${state.rangeEnd}`;
    case 'step': return `${state.stepStart}/${state.stepInterval}`;
    case 'specific':
      if (state.specificList.length === 0) {
        return '*';
      }
      return state.specificList.sort((a, b) => a - b).join(',');
    default: return '*';
  }
}

function toggleSpecific(state: CronState, val: number) {
  state.type = 'specific'; // Auto switch type when specific buttons are clicked
  const idx = state.specificList.indexOf(val);
  if (idx > -1) {
    state.specificList.splice(idx, 1);
  }
  else {
    state.specificList.push(val);
  }
}

// --- Computed Cron String (from UI state) ---
const cronString = computed(() => {
  const base = `${generateField(minute)} ${generateField(hour)} ${generateField(day)} ${generateField(month)} ${generateField(week)}`;

  if (isAdvanced.value) {
    const secondExpr = generateField(second);
    if (advancedFieldCount.value === 7) {
      const yearExpr = generateField(year);
      return `${secondExpr} ${base} ${yearExpr}`;
    }
    return `${secondExpr} ${base}`;
  }

  return base;
});

// --- Editable Cron Input + Human Readable Translation ---
const cronInput = ref('');
const humanReadable = ref('');

// 同步 UI 生成的 cron 到输入框，但在用户手动修改后不强制覆盖
watch(
  cronString,
  (val, oldVal) => {
    if (!cronInput.value || cronInput.value === oldVal) {
      cronInput.value = val;
    }
  },
  { immediate: true },
);

// 当用户在上面的输入框里手动输入 7 段（包含秒和年）时，自动切换到高级模式
watch(
  cronInput,
  (expr) => {
    const parts = (expr || '').trim().split(/\s+/).filter(Boolean);
    if ((parts.length === 7 || parts.length === 6) && cronMode.value !== 'advanced') {
      cronMode.value = 'advanced';
    }
  },
);

watch(
  [cronInput, cronstrueLocale],
  ([expr, loc]) => {
    try {
      const options = loc ? { locale: loc } : undefined;
      // expr 为用户当前输入的 cron 表达式
      humanReadable.value = cronstrue.toString(expr as string, options as any);
    }
    catch (e) {
      humanReadable.value = t('tools.crontab-generator.texts.invalid');
    }
  },
  { immediate: true },
);
</script>

<template>
  <c-card :title="t('tools.crontab-generator.texts.cardTitle')">
    <!-- Mode Toggle -->
    <div class="mb-4 flex justify-end">
      <c-buttons-select
        :value="cronMode"
        :options="modeOptions"
        size="small"
        @update:value="(val: 'standard' | 'advanced') => cronMode = val"
      />
    </div>
    <!-- Result Display Section -->
    <div class="mb-6 flex flex-col gap-4">
      <c-alert :title="humanReadable" type="warning">
        <template #icon>
          <icon-mdi-clock-time-four-outline />
        </template>
        <div class="mt-2 min-w-300px w-full whitespace-nowrap">
          <InputCopyable v-model:value="cronInput" />
        </div>
      </c-alert>
    </div>

    <!-- Configuration Tabs -->
    <div class="mb-6">
      <!-- 6/7 Field Toggle (advanced mode only) -->
      <div v-if="isAdvanced" class="mb-4 flex items-center gap-4">
        <span class="text-sm font-medium">{{ t('tools.crontab-generator.texts.advancedFields') }}:</span>
        <label class="flex cursor-pointer items-center gap-2">
          <n-switch v-model:value="isSevenFieldMode" />
        </label>
      </div>

      <c-buttons-select
        :value="currentTab"
        :options="tabOptions"
        expanded
        @update:value="(val: string) => currentTab = val"
      />
    </div>

    <!-- Configuration Content -->
    <div class="config-content min-h-300px">
      <!-- Second Configuration (advanced only) -->
      <div v-if="isAdvanced && currentTab === 'second'" class="flex flex-col gap-4">
        <div class="config-row">
          <label class="radio-label">
            <input v-model="second.type" type="radio" value="*">
            <span>{{ t('tools.crontab-generator.texts.second.every') }}</span>
          </label>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="second.type" type="radio" value="range">
            <span>{{ t('tools.crontab-generator.texts.second.cycle') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.from') }}</span>
            <c-input-text size="small" :value="String(second.rangeStart)" class="w-70px" @update:value="(v: string) => second.rangeStart = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.to') }}</span>
            <c-input-text size="small" :value="String(second.rangeEnd)" class="w-70px" @update:value="(v: string) => second.rangeEnd = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.secondUnit') }}</span>
          </div>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="second.type" type="radio" value="step">
            <span>{{ t('tools.crontab-generator.texts.second.interval') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.every') }}</span>
            <c-input-text size="small" :value="String(second.stepInterval)" class="w-70px" @update:value="(v: string) => second.stepInterval = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.secondUnit') }} {{ t('tools.crontab-generator.texts.common.startingAt') }}</span>
            <c-input-text size="small" :value="String(second.stepStart)" class="w-70px" @update:value="(v: string) => second.stepStart = Number(v)" />
          </div>
        </div>

        <div class="config-row items-start">
          <label class="radio-label mt-1">
            <input v-model="second.type" type="radio" value="specific">
            <span>{{ t('tools.crontab-generator.texts.second.specific') }}</span>
          </label>
          <div class="ml-4 flex flex-wrap gap-2">
            <c-button
              v-for="i in 60"
              :key="i - 1"
              size="small"
              :type="second.specificList.includes(i - 1) ? 'primary' : 'default'"
              @click="toggleSpecific(second, i - 1)"
            >
              {{ formatPad(i - 1) }}
            </c-button>
          </div>
        </div>
      </div>

      <!-- Minute Configuration -->
      <div v-if="currentTab === 'minute'" class="flex flex-col gap-4">
        <div class="config-row">
          <label class="radio-label">
            <input v-model="minute.type" type="radio" value="*">
            <span>{{ t('tools.crontab-generator.texts.minute.every') }}</span>
          </label>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="minute.type" type="radio" value="range">
            <span>{{ t('tools.crontab-generator.texts.minute.cycle') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.from') }}</span>
            <c-input-text size="small" :value="String(minute.rangeStart)" class="w-70px" @update:value="(v: string) => minute.rangeStart = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.to') }}</span>
            <c-input-text size="small" :value="String(minute.rangeEnd)" class="w-70px" @update:value="(v: string) => minute.rangeEnd = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.minuteUnit') }}</span>
          </div>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="minute.type" type="radio" value="step">
            <span>{{ t('tools.crontab-generator.texts.minute.interval') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.every') }}</span>
            <c-input-text size="small" :value="String(minute.stepInterval)" class="w-70px" @update:value="(v: string) => minute.stepInterval = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.minuteUnit') }} {{ t('tools.crontab-generator.texts.common.startingAt') }}</span>
            <c-input-text size="small" :value="String(minute.stepStart)" class="w-70px" @update:value="(v: string) => minute.stepStart = Number(v)" />
          </div>
        </div>

        <div class="config-row items-start">
          <label class="radio-label mt-1">
            <input v-model="minute.type" type="radio" value="specific">
            <span>{{ t('tools.crontab-generator.texts.minute.specific') }}</span>
          </label>
          <div class="ml-4 flex flex-wrap gap-2">
            <c-button
              v-for="i in 60"
              :key="i - 1"
              size="small"
              :type="minute.specificList.includes(i - 1) ? 'primary' : 'default'"
              @click="toggleSpecific(minute, i - 1)"
            >
              {{ formatPad(i - 1) }}
            </c-button>
          </div>
        </div>
      </div>

      <!-- Hour Configuration -->
      <div v-if="currentTab === 'hour'" class="flex flex-col gap-4">
        <div class="config-row">
          <label class="radio-label">
            <input v-model="hour.type" type="radio" value="*">
            <span>{{ t('tools.crontab-generator.texts.hour.every') }}</span>
          </label>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="hour.type" type="radio" value="range">
            <span>{{ t('tools.crontab-generator.texts.hour.cycle') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.from') }}</span>
            <c-input-text size="small" :value="String(hour.rangeStart)" class="w-70px" @update:value="(v: string) => hour.rangeStart = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.to') }}</span>
            <c-input-text size="small" :value="String(hour.rangeEnd)" class="w-70px" @update:value="(v: string) => hour.rangeEnd = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.hourUnit') }}</span>
          </div>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="hour.type" type="radio" value="step">
            <span>{{ t('tools.crontab-generator.texts.hour.interval') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.every') }}</span>
            <c-input-text size="small" :value="String(hour.stepInterval)" class="w-70px" @update:value="(v: string) => hour.stepInterval = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.hourUnit') }} {{ t('tools.crontab-generator.texts.common.startingAt') }}</span>
            <c-input-text size="small" :value="String(hour.stepStart)" class="w-70px" @update:value="(v: string) => hour.stepStart = Number(v)" />
          </div>
        </div>

        <div class="config-row items-start">
          <label class="radio-label mt-1">
            <input v-model="hour.type" type="radio" value="specific">
            <span>{{ t('tools.crontab-generator.texts.hour.specific') }}</span>
          </label>
          <div class="ml-4 flex flex-wrap gap-2">
            <c-button
              v-for="i in 24"
              :key="i - 1"
              size="small"
              :type="hour.specificList.includes(i - 1) ? 'primary' : 'default'"
              @click="toggleSpecific(hour, i - 1)"
            >
              {{ formatPad(i - 1) }}
            </c-button>
          </div>
        </div>
      </div>

      <!-- Day Configuration -->
      <div v-if="currentTab === 'day'" class="flex flex-col gap-4">
        <div class="config-row">
          <label class="radio-label">
            <input v-model="day.type" type="radio" value="*">
            <span>{{ t('tools.crontab-generator.texts.day.every') }}</span>
          </label>
        </div>
        <div class="config-row">
          <label class="radio-label">
            <input v-model="day.type" type="radio" value="?">
            <span>{{ t('tools.crontab-generator.texts.day.none') }}</span>
          </label>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="day.type" type="radio" value="range">
            <span>{{ t('tools.crontab-generator.texts.day.cycle') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.from') }}</span>
            <c-input-text size="small" :value="String(day.rangeStart)" class="w-70px" @update:value="(v: string) => day.rangeStart = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.to') }}</span>
            <c-input-text size="small" :value="String(day.rangeEnd)" class="w-70px" @update:value="(v: string) => day.rangeEnd = Number(v)" />
          </div>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="day.type" type="radio" value="step">
            <span>{{ t('tools.crontab-generator.texts.day.interval') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.every') }}</span>
            <c-input-text size="small" :value="String(day.stepInterval)" class="w-70px" @update:value="(v: string) => day.stepInterval = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.dayUnit') }} {{ t('tools.crontab-generator.texts.common.startingAt') }}</span>
            <c-input-text size="small" :value="String(day.stepStart)" class="w-70px" @update:value="(v: string) => day.stepStart = Number(v)" />
          </div>
        </div>

        <div class="config-row items-start">
          <label class="radio-label mt-1">
            <input v-model="day.type" type="radio" value="specific">
            <span>{{ t('tools.crontab-generator.texts.day.specific') }}</span>
          </label>
          <div class="ml-4 flex flex-wrap gap-2">
            <c-button
              v-for="i in 31"
              :key="i"
              size="small"
              :type="day.specificList.includes(i) ? 'primary' : 'default'"
              @click="toggleSpecific(day, i)"
            >
              {{ formatPad(i) }}
            </c-button>
          </div>
        </div>
      </div>

      <!-- Month Configuration -->
      <div v-if="currentTab === 'month'" class="flex flex-col gap-4">
        <div class="config-row">
          <label class="radio-label">
            <input v-model="month.type" type="radio" value="*">
            <span>{{ t('tools.crontab-generator.texts.month.every') }}</span>
          </label>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="month.type" type="radio" value="range">
            <span>{{ t('tools.crontab-generator.texts.month.cycle') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.from') }}</span>
            <c-input-text size="small" :value="String(month.rangeStart)" class="w-70px" @update:value="(v: string) => month.rangeStart = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.to') }}</span>
            <c-input-text size="small" :value="String(month.rangeEnd)" class="w-70px" @update:value="(v: string) => month.rangeEnd = Number(v)" />
          </div>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="month.type" type="radio" value="step">
            <span>{{ t('tools.crontab-generator.texts.month.interval') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.every') }}</span>
            <c-input-text size="small" :value="String(month.stepInterval)" class="w-70px" @update:value="(v: string) => month.stepInterval = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.monthUnit') }} {{ t('tools.crontab-generator.texts.common.startingAt') }}</span>
            <c-input-text size="small" :value="String(month.stepStart)" class="w-70px" @update:value="(v: string) => month.stepStart = Number(v)" />
          </div>
        </div>

        <div class="config-row items-start">
          <label class="radio-label mt-1">
            <input v-model="month.type" type="radio" value="specific">
            <span>{{ t('tools.crontab-generator.texts.month.specific') }}</span>
          </label>
          <div class="ml-4 flex flex-wrap gap-2">
            <c-button
              v-for="i in 12"
              :key="i"
              size="small"
              :type="month.specificList.includes(i) ? 'primary' : 'default'"
              @click="toggleSpecific(month, i)"
            >
              {{ formatPad(i) }}
            </c-button>
          </div>
        </div>
      </div>

      <!-- Week Configuration -->
      <div v-if="currentTab === 'week'" class="flex flex-col gap-4">
        <div class="config-row">
          <label class="radio-label">
            <input v-model="week.type" type="radio" value="*">
            <span>{{ t('tools.crontab-generator.texts.week.every') }}</span>
          </label>
        </div>
        <div class="config-row">
          <label class="radio-label">
            <input v-model="week.type" type="radio" value="?">
            <span>{{ t('tools.crontab-generator.texts.week.none') }}</span>
          </label>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="week.type" type="radio" value="range">
            <span>{{ t('tools.crontab-generator.texts.week.cycle') }}</span>
          </label>
          <div class="input-group items-center">
            <span>{{ t('tools.crontab-generator.texts.common.from') }}</span>
            <c-select
              size="small"
              class="w-100px"
              :value="week.rangeStart"
              :options="weekOptions"
              @update:value="(v: number) => week.rangeStart = v"
            />
            <span>{{ t('tools.crontab-generator.texts.common.to') }}</span>
            <c-select
              size="small"
              class="w-100px"
              :value="week.rangeEnd"
              :options="weekOptions"
              @update:value="(v: number) => week.rangeEnd = v"
            />
          </div>
        </div>

        <div class="config-row items-start">
          <label class="radio-label mt-1">
            <input v-model="week.type" type="radio" value="specific">
            <span>{{ t('tools.crontab-generator.texts.week.specific') }}</span>
          </label>
          <div class="ml-4 flex flex-wrap gap-2">
            <c-button
              v-for="(name, i) in weekNames"
              :key="i"
              size="small"
              :type="week.specificList.includes(i) ? 'primary' : 'default'"
              @click="toggleSpecific(week, i)"
            >
              {{ name }}
            </c-button>
          </div>
        </div>
      </div>

      <!-- Year Configuration (advanced only) -->
      <div v-if="isAdvanced && currentTab === 'year'" class="flex flex-col gap-4">
        <div class="config-row">
          <label class="radio-label">
            <input v-model="year.type" type="radio" value="*">
            <span>{{ t('tools.crontab-generator.texts.year.every') }}</span>
          </label>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="year.type" type="radio" value="range">
            <span>{{ t('tools.crontab-generator.texts.year.cycle') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.from') }}</span>
            <c-input-text size="small" :value="String(year.rangeStart)" class="w-90px" @update:value="(v: string) => year.rangeStart = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.to') }}</span>
            <c-input-text size="small" :value="String(year.rangeEnd)" class="w-90px" @update:value="(v: string) => year.rangeEnd = Number(v)" />
          </div>
        </div>

        <div class="config-row">
          <label class="radio-label">
            <input v-model="year.type" type="radio" value="step">
            <span>{{ t('tools.crontab-generator.texts.year.interval') }}</span>
          </label>
          <div class="input-group">
            <span>{{ t('tools.crontab-generator.texts.common.every') }}</span>
            <c-input-text size="small" :value="String(year.stepInterval)" class="w-90px" @update:value="(v: string) => year.stepInterval = Number(v)" />
            <span>{{ t('tools.crontab-generator.texts.common.yearUnit') }} {{ t('tools.crontab-generator.texts.common.startingAt') }}</span>
            <c-input-text size="small" :value="String(year.stepStart)" class="w-90px" @update:value="(v: string) => year.stepStart = Number(v)" />
          </div>
        </div>
      </div>
    </div>
  </c-card>
</template>

<style lang="less" scoped>
.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.radio-label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;

  input[type="radio"] {
    accent-color: var(--primary-color, #007bff);
    transform: scale(1.1);
  }
}

.input-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
