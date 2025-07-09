import { defineStore } from 'pinia';
import { ref } from 'vue';
import { FamilyTree } from '../lib/FamilyTree';

export const useFamilyTreeStore = defineStore('familyTree', () => {
  // Map of treeId -> FamilyTree instance
  const trees = ref(new Map<string, FamilyTree>());

  function createTree(treeId: string): FamilyTree {
    const tree = new FamilyTree();

    if (! trees.value.has(treeId)) {
      trees.value.set(treeId, tree);
    }

    return tree
  }

  return {
    trees,
    createTree,
  };
}); 