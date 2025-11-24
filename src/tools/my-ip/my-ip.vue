<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { computedRefreshableAsync } from '@/composable/computedRefreshable';

const { t } = useI18n();

const API_URL = "https://get.geojs.io/v1/ip/geo.json";

const [clientIPDetails, refreshClientIP] = computedRefreshableAsync(async () => {
  let data: any = {};
  let error = "";

  try {
    const res = await fetch(API_URL);
    data = await res.json();
  } catch (e: any) {
    error = e.toString();
  }

  return {
    ipv4: data.ip ?? `ERROR: ${error || 'Unknown'}`,
    ipv6: "",

    location: {
      country: `${data.country ?? ""}（${data.country_code ?? ""}）`,
      city: `${data.region ?? ''}/${data.city ?? ''}`,
      timezone: data.timezone ?? "",
      organization: data.organization ?? ""
    },
  };
});
</script>

<template>
  <c-card>
    <div v-if="clientIPDetails">
      <input-copyable v-model:value="clientIPDetails.ipv4" label-position="left" label-width="100px" label-align="left" readonly :label="t('tools.my-ip.texts.label-ipv4')" :placeholder="t('tools.my-ip.texts.placeholder-your-ipv4')" />
      <input-copyable v-model:value="clientIPDetails.location.country" label-position="left" label-width="100px" label-align="left" readonly :label="t('tools.my-ip.texts.label-country')" />
      <input-copyable v-model:value="clientIPDetails.location.city" label-position="left" label-width="100px" label-align="left" readonly :label="t('tools.my-ip.texts.label-city')" />
      <input-copyable v-model:value="clientIPDetails.location.timezone" label-position="left" label-width="100px" label-align="left" readonly :label="t('tools.my-ip.texts.label-timezone')" />
      <input-copyable v-model:value="clientIPDetails.location.organization" label-position="left" label-width="100px" label-align="left" readonly :label="t('tools.my-ip.texts.label-organization')" />
    </div>
    <div flex justify-center gap-3 mt-3>
      <c-button @click="refreshClientIP">
        {{ t('tools.my-ip.texts.tag-refresh') }}
      </c-button>
    </div>
  </c-card>
</template>