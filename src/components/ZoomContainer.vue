<script setup lang="ts">
import { ref, computed, provide } from 'vue';

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;

const scale = ref(1);
provide('scale', scale);
const translateX = ref(0);
const translateY = ref(0);
const isPanning = ref(false);
const lastX = ref(0);
const lastY = ref(0);

const containerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);

const containerStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
  transformOrigin: '0 0',
}));

const backgroundStyle = computed(() => {
  const bgScale = 20 * scale.value;
  return {
    backgroundSize: `${bgScale}px ${bgScale}px`,
    backgroundPosition: `${translateX.value}px ${translateY.value}px`,
  };
});

const zoomStep = 0.1;

function getTreeContentEl() {
  return contentRef.value?.querySelector('#tree-content') as HTMLElement | null;
}

function zoomToFit() {
  if (!containerRef.value || !contentRef.value) return;

  const contentEl = getTreeContentEl();
  if (!contentEl) return;

  const containerWidth = containerRef.value.clientWidth;
  const containerHeight = containerRef.value.clientHeight;
  const contentWidth = contentEl.offsetWidth;
  const contentHeight = contentEl.offsetHeight;

  if (contentWidth === 0 || contentHeight === 0) return;

  const scaleX = containerWidth / contentWidth;
  const scaleY = containerHeight / contentHeight;
  const newScale = Math.min(scaleX, scaleY) * 0.9;

  scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

  const verticalOffset = 80;
  const newTranslateX = (containerWidth - contentWidth * scale.value) / 2;
  const newTranslateY = (containerHeight - contentHeight * scale.value) / 2 - verticalOffset;

  translateX.value = newTranslateX;
  translateY.value = newTranslateY;
}

function handleWheel(event: WheelEvent) {
  event.preventDefault();

  const scaleAmount = 0.1;
  const oldScale = scale.value;
  let newScale;

  if (event.deltaY < 0) {
    newScale = scale.value + scaleAmount;
  } else {
    newScale = scale.value - scaleAmount;
  }
  
  scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

  // Zoom towards the mouse cursor
  const mouseX = event.clientX - (containerRef.value?.offsetLeft ?? 0);
  const mouseY = event.clientY - (containerRef.value?.offsetTop ?? 0);

  translateX.value = mouseX - ((mouseX - translateX.value) * scale.value) / oldScale;
  translateY.value = mouseY - ((mouseY - translateY.value) * scale.value) / oldScale;
}

function handleMouseDown(event: MouseEvent) {
  isPanning.value = true;
  lastX.value = event.clientX;
  lastY.value = event.clientY;
  // Change cursor to indicate panning is possible
  if (containerRef.value) {
    containerRef.value.style.cursor = 'grabbing';
  }
}

function handleMouseMove(event: MouseEvent) {
  if (!isPanning.value) return;
  const dx = event.clientX - lastX.value;
  const dy = event.clientY - lastY.value;

  translateX.value += dx;
  translateY.value += dy;

  lastX.value = event.clientX;
  lastY.value = event.clientY;
}

function handleMouseUp() {
  isPanning.value = false;
  // Restore cursor
  if (containerRef.value) {
    containerRef.value.style.cursor = 'grab';
  }
}

function zoomIn() {
  scale.value = Math.min(MAX_SCALE, +(scale.value + zoomStep).toFixed(2));
}

function zoomOut() {
  scale.value = Math.max(MIN_SCALE, +(scale.value - zoomStep).toFixed(2));
}

function resetZoom() {
  if (!containerRef.value || !contentRef.value) return;

  const contentEl = getTreeContentEl();
  if (!contentEl) return;

  const containerWidth = containerRef.value.clientWidth;
  const containerHeight = containerRef.value.clientHeight;
  const contentWidth = contentEl.offsetWidth;
  const contentHeight = contentEl.offsetHeight;

  if (contentWidth === 0 || contentHeight === 0) return;

  scale.value = 1;
  const newTranslateX = (containerWidth - contentWidth) / 2;
  const newTranslateY = (containerHeight - contentHeight) / 2;
  translateX.value = newTranslateX;
  translateY.value = newTranslateY;
}

defineExpose({ zoomToFit, resetZoom });
</script>

<template>
  <div
    ref="containerRef"
    class="zoom-container"
    :style="{
      ...backgroundStyle,
      backgroundColor: '#f9f9f9',
      backgroundImage: 'radial-gradient(circle, #ddd 1px, transparent 1px)',
    }"
    @wheel="handleWheel"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  >
    <div class="controls">
      <button @click="zoomOut" :disabled="scale <= MIN_SCALE">-</button>
      <span style="min-width: 48px; text-align: center;">{{ Math.round(scale * 100) }}%</span>
      <button @click="zoomIn" :disabled="scale >= MAX_SCALE">+</button>
      <button @click="resetZoom">Reset</button>
    </div>
    <div ref="contentRef" class="zoom-content" :style="containerStyle">
      <slot></slot>
    </div>
  </div>
</template>

<style scoped>
.zoom-container {
  position: relative;     
  width: 100%;            
  height: 100%;         
  overflow: hidden;         
  cursor: grab;            
  background-color: #f9f9f9;
  background-image: radial-gradient(circle, #ddd 1px, transparent 1px);
}
.zoom-container:active {
  cursor: grabbing;       
}
.zoom-content {
  width: 100%;            
  height: 100%;           
  padding: 1.5rem;       
  transition: transform 0.1s ease-out;
}
.controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  display: flex;
  gap: 5px;
}
.controls button {
  padding: 5px 10px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-family: sans-serif;
  font-size: 12px;
}
.controls button:hover {
  background: #f0f0f0;
}
</style> 