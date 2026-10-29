<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { MandalaFigure, type ColorMode, type FigureData, type HoverInfo, type MandalaOptions } from '@samotracia/figures';

const props = defineProps<{
  data: FigureData;
  colorMode: ColorMode;
  theme: 'light' | 'dark';
  focus: string | null;
  options?: Partial<MandalaOptions>;
}>();
const emit = defineEmits<{ hover: [info: HoverInfo | null] }>();

const canvas = ref<HTMLCanvasElement>();
let figure: MandalaFigure | null = null;

onMounted(() => {
  if (!canvas.value) return;
  figure = new MandalaFigure(canvas.value, props.data, { ...props.options, colorMode: props.colorMode, theme: props.theme });
  figure.onHover = (info) => emit('hover', info);
  figure.setFocus(props.focus);
  figure.start();
});

onBeforeUnmount(() => figure?.destroy());

watch(() => props.colorMode, (m) => figure?.setColorMode(m));
watch(() => props.theme, (t) => figure?.setTheme(t));
watch(() => props.focus, (f) => figure?.setFocus(f));
watch(() => props.data, (d) => figure?.setData(d));
watch(() => props.options, (o) => o && figure?.setOptions(o), { deep: true });
</script>

<template>
  <canvas ref="canvas" class="figure" aria-label="Mandala: cada pétalo es un elemento de la colección" />
</template>

<style scoped>
.figure {
  display: block;
  width: min(100%, 78vh);
  aspect-ratio: 1;
  margin: 0 auto;
  touch-action: manipulation;
  cursor: crosshair;
}
</style>
