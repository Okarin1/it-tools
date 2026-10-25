<script setup lang="ts">
import { useStorage } from '@vueuse/core';
import { useI18n } from 'vue-i18n';
import { useAppTheme } from '@/ui/theme/themes';

type TimerMode = 'stopwatch' | 'countdown' | 'worldClock' | 'pomodoro';
type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak';

const { t, locale } = useI18n();
const appTheme = useAppTheme();
const mode = ref<TimerMode>('stopwatch');
const now = ref(Date.now());
const notificationsSupported = 'Notification' in window;
const notificationPermission = ref<NotificationPermission>(notificationsSupported ? Notification.permission : 'denied');
const desktopRemindersEnabled = useStorage('chronometer:desktop-reminders-enabled', notificationsSupported && Notification.permission === 'granted');
const isDesktopReminderEnabled = computed(() => notificationsSupported && notificationPermission.value === 'granted' && desktopRemindersEnabled.value);
let activeNotification: Notification | undefined;
let titleFlashTimer: number | undefined;
let originalTitle = '';
function stopTitleFlash() {
  if (titleFlashTimer === undefined) {
    return;
  }

  window.clearInterval(titleFlashTimer);
  titleFlashTimer = undefined;
  document.title = originalTitle;
}
function flashTitle(message: string) {
  if (document.visibilityState === 'visible') {
    return;
  }

  stopTitleFlash();
  originalTitle = document.title;
  let showOriginal = false;
  document.title = message;
  titleFlashTimer = window.setInterval(() => {
    document.title = showOriginal ? originalTitle : message;
    showOriginal = !showOriginal;
  }, 700);
}
function stopTitleFlashWhenVisible() {
  if (document.visibilityState === 'visible') {
    stopTitleFlash();
  }
}
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const selectedTimezone = ref(timezone);
const timezones = computed(() => {
  const supported = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : ['UTC', 'Asia/Hong_Kong', 'Asia/Shanghai', 'Asia/Tokyo', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Los_Angeles'];
  return [...new Set(['UTC', ...supported, timezone])].sort().map(value => ({ label: value, value }));
});
const clockTimer = window.setInterval(() => {
  now.value = Date.now();
}, 10);
async function setDesktopReminders(enabled: boolean) {
  if (!enabled) {
    desktopRemindersEnabled.value = false;
    activeNotification?.close();
    activeNotification = undefined;
    return;
  }

  if (!notificationsSupported || notificationPermission.value === 'denied') {
    return;
  }

  if (notificationPermission.value === 'default') {
    notificationPermission.value = await Notification.requestPermission();
  }

  desktopRemindersEnabled.value = notificationPermission.value === 'granted';
}
function notifyTimerComplete(title: string, body: string) {
  if (document.visibilityState === 'visible') {
    return;
  }

  flashTitle(title);
  if (isDesktopReminderEnabled.value) {
    activeNotification?.close();
    activeNotification = new Notification(title, {
      body,
      icon: '/favicon-32x32.png',
      tag: 'chronometer-timer-complete',
    });
    activeNotification.onclick = () => {
      window.focus();
      activeNotification?.close();
      activeNotification = undefined;
    };
  }
}
const worldClockDate = computed(() => new Intl.DateTimeFormat(locale.value, {
  timeZone: selectedTimezone.value,
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(now.value));
const worldClockTime = computed(() => new Intl.DateTimeFormat(locale.value, {
  timeZone: selectedTimezone.value,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hourCycle: 'h23',
}).format(now.value));
const timezoneName = computed(() => new Intl.DateTimeFormat(locale.value, { timeZone: selectedTimezone.value, timeZoneName: 'long' }).formatToParts(new Date(now.value)).find(part => part.type === 'timeZoneName')?.value ?? selectedTimezone.value);

function formatDuration(milliseconds: number) {
  const ms = Math.max(0, Math.floor(milliseconds));
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor(ms / 60_000) % 60;
  const seconds = Math.floor(ms / 1_000) % 60;
  const fraction = ms % 1_000;
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(fraction, 3)}`;
}

// Stopwatch
const stopwatchElapsed = ref(0);
const stopwatchStartedAt = ref(0);
const stopwatchRunning = ref(false);
const stopwatchDisplay = computed(() => stopwatchElapsed.value + (stopwatchRunning.value ? now.value - stopwatchStartedAt.value : 0));
function toggleStopwatch() {
  if (stopwatchRunning.value) {
    stopwatchElapsed.value += Date.now() - stopwatchStartedAt.value;
    stopwatchRunning.value = false;
  }
  else {
    stopwatchStartedAt.value = Date.now();
    stopwatchRunning.value = true;
  }
}
function resetStopwatch() {
  stopwatchRunning.value = false;
  stopwatchElapsed.value = 0;
}

// Countdown
const countdownHours = ref(0);
const countdownMinutes = ref(5);
const countdownSeconds = ref(0);
const countdownRemaining = ref(300_000);
const countdownDeadline = ref(0);
const countdownRunning = ref(false);
const countdownDisplay = computed(() => countdownRunning.value ? Math.max(0, countdownDeadline.value - now.value) : countdownRemaining.value);
function configuredCountdown() {
  return (countdownHours.value * 3600 + countdownMinutes.value * 60 + countdownSeconds.value) * 1000;
}
function startCountdown() {
  if (countdownRunning.value) {
    countdownRemaining.value = Math.max(0, countdownDeadline.value - Date.now());
    countdownRunning.value = false;
  }
  else if (countdownRemaining.value > 0) {
    countdownDeadline.value = Date.now() + countdownRemaining.value;
    countdownRunning.value = true;
  }
  else {
    countdownRemaining.value = configuredCountdown();
    if (countdownRemaining.value > 0) {
      countdownDeadline.value = Date.now() + countdownRemaining.value;
      countdownRunning.value = true;
    }
  }
}
function resetCountdown() {
  countdownRunning.value = false;
  countdownRemaining.value = configuredCountdown();
}
function setCountdownPreset(minutes: number) {
  countdownRunning.value = false;
  countdownHours.value = 0;
  countdownMinutes.value = minutes;
  countdownSeconds.value = 0;
  countdownRemaining.value = minutes * 60_000;
}
watch([countdownHours, countdownMinutes, countdownSeconds], () => {
  if (!countdownRunning.value) {
    countdownRemaining.value = configuredCountdown();
  }
});

// Pomodoro: focus automatically alternates with short breaks; every fourth focus ends with a long break.
const pomodoroDurations = { focus: 25, shortBreak: 5, longBreak: 15 };
const pomodoroPhase = ref<PomodoroPhase>('focus');
const completedFocuses = ref(0);
const pomodoroRemaining = ref(pomodoroDurations.focus * 60_000);
const pomodoroDeadline = ref(0);
const pomodoroRunning = ref(false);
const pomodoroDisplay = computed(() => pomodoroRunning.value ? Math.max(0, pomodoroDeadline.value - now.value) : pomodoroRemaining.value);
function durationForPhase(phase: PomodoroPhase) {
  return pomodoroDurations[phase] * 60_000;
}
function advancePomodoro() {
  if (pomodoroPhase.value === 'focus') {
    completedFocuses.value += 1;
    pomodoroPhase.value = completedFocuses.value % 4 === 0 ? 'longBreak' : 'shortBreak';
  }
  else {
    pomodoroPhase.value = 'focus';
  }
  pomodoroRemaining.value = durationForPhase(pomodoroPhase.value);
  return pomodoroPhase.value;
}
function togglePomodoro() {
  if (pomodoroRunning.value) {
    pomodoroRemaining.value = Math.max(0, pomodoroDeadline.value - Date.now());
    pomodoroRunning.value = false;
  }
  else if (pomodoroRemaining.value > 0) {
    pomodoroDeadline.value = Date.now() + pomodoroRemaining.value;
    pomodoroRunning.value = true;
  }
}
function resetPomodoro() {
  pomodoroRunning.value = false;
  pomodoroPhase.value = 'focus';
  completedFocuses.value = 0;
  pomodoroRemaining.value = durationForPhase('focus');
}
watch(now, (timestamp) => {
  if (countdownRunning.value && countdownDeadline.value <= timestamp) {
    countdownRemaining.value = 0;
    countdownRunning.value = false;
    notifyTimerComplete(
      t('tools.chronometer.texts.countdownNotificationTitle'),
      t('tools.chronometer.texts.countdownNotificationBody'),
    );
  }
  if (pomodoroRunning.value && pomodoroDeadline.value <= timestamp) {
    pomodoroRunning.value = false;
    pomodoroRemaining.value = 0;
    const endedPhase = pomodoroPhase.value;
    advancePomodoro();
    notifyTimerComplete(
      t(`tools.chronometer.texts.${endedPhase}NotificationTitle`),
      t(`tools.chronometer.texts.${endedPhase}NotificationBody`, { nextPhase: t(`tools.chronometer.texts.${pomodoroPhase.value}`) }),
    );
  }
});

onMounted(() => {
  document.addEventListener('visibilitychange', stopTitleFlashWhenVisible);
  window.addEventListener('focus', stopTitleFlashWhenVisible);
});
onBeforeUnmount(() => {
  window.clearInterval(clockTimer);
  stopTitleFlash();
  document.removeEventListener('visibilitychange', stopTitleFlashWhenVisible);
  window.removeEventListener('focus', stopTitleFlashWhenVisible);
});
</script>

<template>
  <div class="chronometer">
    <div v-if="mode === 'countdown' || mode === 'pomodoro'" class="notification-settings">
      <n-form-item :label="t('tools.chronometer.texts.desktopReminder')" label-placement="left" :show-feedback="false">
        <n-switch
          :value="isDesktopReminderEnabled"
          :disabled="notificationPermission === 'denied' || !notificationsSupported"
          @update:value="setDesktopReminders"
        />
      </n-form-item>
      <div v-if="notificationPermission === 'denied' || !notificationsSupported" class="notification-status">
        {{ t(notificationsSupported ? 'tools.chronometer.texts.desktopNotificationsBlocked' : 'tools.chronometer.texts.desktopNotificationsUnsupported') }}
      </div>
    </div>
    <div class="mode-switch" role="tablist">
      <button v-for="item in (['stopwatch', 'countdown', 'worldClock', 'pomodoro'] as const)" :key="item" type="button" role="tab" :aria-selected="mode === item" :class="{ active: mode === item }" @click="mode = item">
        {{ t(`tools.chronometer.texts.${item}`) }}
      </button>
    </div>

    <c-card v-if="mode === 'stopwatch'" :title="t('tools.chronometer.texts.stopwatch')">
      <div class="timer-display">{{ formatDuration(stopwatchDisplay) }}</div>
      <div class="actions">
        <c-button @click="toggleStopwatch">{{ t(stopwatchRunning ? 'tools.chronometer.texts.pause' : 'tools.chronometer.texts.start') }}</c-button>
        <c-button @click="resetStopwatch">{{ t('tools.chronometer.texts.reset') }}</c-button>
      </div>
    </c-card>

    <c-card v-else-if="mode === 'countdown'" :title="t('tools.chronometer.texts.countdown')">
      <div class="presets">
        <c-button v-for="minutes in [1, 3, 5, 10]" :key="minutes" :disabled="countdownRunning" @click="setCountdownPreset(minutes)">
          {{ minutes }} {{ t('tools.chronometer.texts.minutes') }}
        </c-button>
      </div>
      <div class="duration-inputs">
        <label>{{ t('tools.chronometer.texts.hours') }}<n-input-number v-model:value="countdownHours" :min="0" :max="99" :disabled="countdownRunning" /></label>
        <label>{{ t('tools.chronometer.texts.minutes') }}<n-input-number v-model:value="countdownMinutes" :min="0" :max="59" :disabled="countdownRunning" /></label>
        <label>{{ t('tools.chronometer.texts.seconds') }}<n-input-number v-model:value="countdownSeconds" :min="0" :max="59" :disabled="countdownRunning" /></label>
      </div>
      <div class="timer-display">{{ formatDuration(countdownDisplay) }}</div>
      <div class="actions">
        <c-button :disabled="countdownDisplay <= 0 && configuredCountdown() <= 0" @click="startCountdown">{{ t(countdownRunning ? 'tools.chronometer.texts.pause' : 'tools.chronometer.texts.start') }}</c-button>
        <c-button @click="resetCountdown">{{ t('tools.chronometer.texts.reset') }}</c-button>
      </div>
    </c-card>

    <c-card v-else-if="mode === 'worldClock'" :title="t('tools.chronometer.texts.worldClock')">
      <div class="timezone-picker">
        <n-select v-model:value="selectedTimezone" :options="timezones" filterable />
      </div>
      <div class="clock-date">{{ worldClockDate }}</div>
      <div class="clock-display">{{ worldClockTime }}</div>
      <div class="clock-zone">{{ timezoneName }}</div>
    </c-card>

    <c-card v-else :title="t('tools.chronometer.texts.pomodoro')">
      <div class="phase-label">{{ t(`tools.chronometer.texts.${pomodoroPhase}`) }}</div>
      <div class="timer-display">{{ formatDuration(pomodoroDisplay) }}</div>
      <div class="cycle-label">{{ t('tools.chronometer.texts.completed') }}: {{ completedFocuses }} / 4</div>
      <div class="actions">
        <c-button @click="togglePomodoro">{{ t(pomodoroRunning ? 'tools.chronometer.texts.pause' : 'tools.chronometer.texts.start') }}</c-button>
        <c-button @click="resetPomodoro">{{ t('tools.chronometer.texts.reset') }}</c-button>
        <c-button @click="advancePomodoro(); pomodoroRunning = false">{{ t('tools.chronometer.texts.skip') }}</c-button>
      </div>
    </c-card>
  </div>
</template>

<style lang="less" scoped>
.clock-display,
.clock-date,
.timer-display {
  text-align: center;
  font-family: monospace;
  font-variant-numeric: tabular-nums;
}

.clock-display {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  font-weight: 600;
}

.clock-date {
  margin-top: 1.5rem;
  font-size: 1.1rem;
}

.timezone-picker {
  max-width: 420px;
  margin: 0 auto;
}

.clock-zone,
.cycle-label,
.notification-status {
  margin-top: 0.5rem;
  text-align: center;
  color: v-bind('appTheme.text.mutedColor');
}

.chronometer {
  width: min(100%, 600px);
  margin: 0 auto;
}

.mode-switch,
.actions,
.presets,
.duration-inputs {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin: 1rem 0;
}

.notification-settings {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin: 0.5rem 0 1rem;
  font-size: 0.9rem;
}

.notification-settings :deep(.n-form-item) {
  margin-bottom: 0;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 4px;
  border: 1px solid v-bind('appTheme.default.colorPressed');
  border-radius: 8px;
  background: v-bind('appTheme.background');
}

.mode-switch button {
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 0.65rem 0.5rem;
  color: v-bind('appTheme.text.baseColor');
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
}

.mode-switch button.active {
  border-color: v-bind('appTheme.primary.colorPressed');
  color: #fff;
  background: v-bind('appTheme.primary.colorPressed');
}

.timer-display {
  margin: 1.25rem 0;
  font-size: clamp(2rem, 7vw, 3.5rem);
}

.duration-inputs label {
  display: grid;
  gap: 0.4rem;
  flex: 0 1 96px;
  min-width: 0;
  text-align: center;
}

.duration-inputs {
  flex-wrap: nowrap;
  gap: 0.5rem;
}

.duration-inputs :deep(.n-input-number) {
  width: 96px;
}

@media (max-width: 480px) {
  .mode-switch {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.phase-label {
  text-align: center;
  font-size: 1.25rem;
  font-weight: 600;
}
</style>
