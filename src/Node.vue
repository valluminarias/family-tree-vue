<script setup lang="ts">
import type { PropType } from 'vue';

const props = defineProps({
  node: {
    type: Object as PropType<any>,
    required: true,
  },
});

</script>

<template>
  <div
    class="absolute min-w-[100px] min-h-[100px] rounded-lg flex flex-col items-center transition group"
  >
    <div class="relative">
      <span v-if="node.image" class="flex items-center justify-center w-24 h-24 bg-blue-100 rounded-xl transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl">
        <img :src="node.image" alt="Person" class="w-20 h-20 rounded-xl object-cover border-4 border-white" />
      </span>
      <span v-else class="flex items-center justify-center w-24 h-24 bg-blue-100 rounded-xl text-5xl transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl">👤</span>
      
      <span class="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-md font-semibold text-sm text-gray-800 whitespace-nowrap">
        {{ node.label }}
      </span>
    </div>
    <!-- Top buttons -->
    <div
      class="absolute -top-5 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition pointer-events-auto"
    >
      <button 
        @click="$emit('add-parent', node.id)" 
        class="border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-xs bg-white hover:bg-gray-100"
        title="Add parent"
      >
        👨‍👩‍👧
      </button>
    </div>
    <!-- Bottom buttons -->
    <div
      class="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition pointer-events-auto"
    >
      <button @click="$emit('add-node', node)" title="Add child" class="bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-100">👶</button>
      <button @click="$emit('add-partner', node.id)" title="Add partner" class="bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-100">💑</button>
      <button v-if="node.parent" @click="$emit('remove-node', node.id)" title="Remove" class="bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-100">❌</button>
    </div>
  </div>
</template>

<style scoped>
.node {
  position: absolute;
  background-color: white;
  border: 2px solid #ccc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
  padding: 8px 12px;
  min-width: 120px;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.person-icon {
  font-size: 1.2em;
}

.node:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
.top-buttons {
  position: absolute;
  top: -20px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}
.node:hover .top-buttons {
  opacity: 1;
}
.buttons {
  position: absolute;
  bottom: -20px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}
.node:hover .buttons {
  opacity: 1;
}
button {
  background: white;
  border: 1px solid #ccc;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
button:hover {
  background: #f0f0f0;
}
.person-img-wrapper {
  display: flex;
  align-items: center;
}
</style> 