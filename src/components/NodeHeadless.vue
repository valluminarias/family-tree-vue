<script setup lang="ts">
import { ref, inject, onUnmounted } from "vue";
import type { NodePositionUpdate } from "./Tree.vue";

const props = defineProps({
  node: Object,
  dragEnabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: "update-position", update: NodePositionUpdate): void;
}>();

const scale = inject("scale", ref(1));

const nodeElRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const lastX = ref(0);
const lastY = ref(0);
const currentX = ref(0);
const currentY = ref(0);

const handleMouseDown = (event: MouseEvent) => {
  if (!props.dragEnabled) return;
  if (!nodeElRef.value) return;
  isDragging.value = true;
  lastX.value = event.clientX;
  lastY.value = event.clientY;
  const style = window.getComputedStyle(nodeElRef.value);
  currentX.value = parseInt(style.left, 10) || 0;
  currentY.value = parseInt(style.top, 10) || 0;
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
};

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value || !nodeElRef.value) return;
  const dx = (event.clientX - lastX.value) / scale.value;
  const dy = (event.clientY - lastY.value) / scale.value;
  currentX.value += dx;
  currentY.value += dy;
  nodeElRef.value.style.left = `${currentX.value}px`;
  nodeElRef.value.style.top = `${currentY.value}px`;
  emit("update-position", { id: props.node?.id, dx, dy });
  lastX.value = event.clientX;
  lastY.value = event.clientY;
};

const handleMouseUp = () => {
  isDragging.value = false;
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
  emit("update-position", {
    id: props.node?.id,
    dx: currentX.value - parseFloat(String(props.node?.x)),
    dy: currentY.value - parseFloat(String(props.node?.y)),
    isDragEnd: true,
  });
};

onUnmounted(() => {
  if (isDragging.value && props.dragEnabled) {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }
});
</script>

<template>
  <div
    ref="nodeElRef"
    @mousedown.prevent.stop="handleMouseDown"
    :style="{
        cursor: dragEnabled ? 'grab' : 'default',
      left: `${node?.x}px`,
      top: `${node?.y}px`,
      position: 'absolute',
    }"
  >
    <slot
      :node="node"
      :updatePosition="(payload: NodePositionUpdate) => emit('update-position', payload)"
      :isDragging="isDragging"
    />
  </div>
</template>
