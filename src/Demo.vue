<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { TreeNode } from './lib/FamilyTree';
import type { TreeOptions } from './components/Tree.vue';

import Tree from "@/components/Tree.vue";
import ZoomContainer from './components/ZoomContainer.vue';
import { useFamilyTreeStore } from './stores/familyTree';

import Node from './Node.vue';

const zoomContainerRef = ref<InstanceType<typeof ZoomContainer> | null>(null);


const { createTree } = useFamilyTreeStore();

const demoTree = createTree('demo')


// Add sample nodes
const alice: TreeNode = { id: crypto.randomUUID(), label: 'Alice' };
const bob: TreeNode = { id: crypto.randomUUID(), label: 'Bob' };
const a: TreeNode = { id: crypto.randomUUID(), label: 'A' };
const b: TreeNode = { id: crypto.randomUUID(), label: 'B' };
const c: TreeNode = { id: crypto.randomUUID(), label: 'C' };
const d: TreeNode = { id: crypto.randomUUID(), label: 'D' };
const e: TreeNode = { id: crypto.randomUUID(), label: 'E' };
const f: TreeNode = { id: crypto.randomUUID(), label: 'F' };
const g: TreeNode = { id: crypto.randomUUID(), label: 'G' };
const h: TreeNode = { id: crypto.randomUUID(), label: 'H' };
const i: TreeNode = { id: crypto.randomUUID(), label: 'I' };
const j: TreeNode = { id: crypto.randomUUID(), label: 'J' };
const k: TreeNode = { id: crypto.randomUUID(), label: 'K' };

demoTree.addNode({ ...bob });
demoTree.addNode({ ...alice });
demoTree.addNode({ ...a });
demoTree.addNode({ ...b });
demoTree.addNode({ ...c });
demoTree.addNode({ ...d });
demoTree.addNode({ ...e });
demoTree.addNode({ ...f });
demoTree.addNode({ ...g });
demoTree.addNode({ ...h });
demoTree.addNode({ ...i });
demoTree.addNode({ ...j });
demoTree.addNode({ ...k });

// 2nd Gen
demoTree.addParent(a.id, bob, alice)
demoTree.addParent(b.id, bob, alice)
demoTree.addParent(c.id, bob, alice)
demoTree.addParent(h.id, bob, alice)
demoTree.addParent(i.id, bob, alice)

// 3rd gen
demoTree.addParent(e.id, b, d)
demoTree.addParent(g.id, c, f)
demoTree.addParent(k.id, a, j)

const treeOptions: TreeOptions = {
  dragEnabled: true,
}

onMounted(() => {
  zoomContainerRef.value?.resetZoom();
})
</script>

<template>
  <div class="flex flex-col h-screen">
    <ZoomContainer ref="zoomContainerRef" class="flex-1 relative overflow-hidden">
      <Tree
        :tree-data="demoTree"
        :options="treeOptions"
      >
        <template #node="slotProps">
          <Node
            v-bind="slotProps"
          />
        </template>
      </Tree>
    </ZoomContainer>
  </div>
</template>

<style scoped>
</style>
