<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { FamilyTree, TreeNode, PositionedTreeNode, TreeLink, PositionedTreeData } from '../lib/FamilyTree';
import NodeHeadless from './NodeHeadless.vue';
import { cloneTreeWithoutCycles, traverseAndAnnotateTree } from '../utils/treeUtility';
import { 
  groupSiblingsByParent,
  sortParentsByX,
  calculateTotalBlocksWidth,
  positionBlocks,
  positionRootNodes,
  preventOverlap,
  isValidNumber
} from '../utils/layoutUtils';

export interface NodePositionUpdate {
  id: string;
  dx: number;
  dy: number;
  isDragEnd?: boolean;
}

export interface TreeOptions {
  dragEnabled: boolean;
  nodeWidth?: number;
  nodeHeight?: number;
  xSpacing?: number;
  ySpacing?: number;
  partnerNodeSpacing?: number;
}

const props = defineProps<{
  treeData: FamilyTree;
  options: TreeOptions;
}>();

const NODE_WIDTH = props.options.nodeWidth ?? 120;
const NODE_HEIGHT = props.options.nodeHeight ?? 120;
const X_SPACING = props.options.xSpacing ?? 40;
const Y_SPACING = props.options.ySpacing ?? 200;
// const PARTNER_SPACING = props.options.partnerNodeSpacing ?? 20;

const emit = defineEmits<{
  (e: 'add-node', node: PositionedTreeNode): void;
  (e: 'add-partner', nodeId: string): void;
  (e: 'add-parent', nodeId: string): void;
  (e: 'remove-node', nodeId: string): void;
  (e: 'update-position', update: any): void;
  (e: 'layout-updated'): void;
}>();

const isInitialLayout = ref(true);
const layoutTrigger = ref(0);

const positionedData = ref<PositionedTreeData>({
  nodes: [],
  links: [],
  width: 0,
  height: 0,
});

const calculateLinks = (nodes: PositionedTreeNode[]): TreeLink[] => {
    const newLinks: TreeLink[] = [];
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const Y_SPACING_BUS = 100;

    // Step 1: Create Partner links first.
    for (const node of nodes) {
        if (node.partners && node.partners.length > 0) {
            for (const partner of node.partners) {
                if (partner && node.id < partner.id) { 
                    const { x1, y1, x2, y2 } = getOptimalConnectionPoints(node, partner);
                    newLinks.push({ id: `p_${node.id}_${partner.id}`, x1, y1, x2, y2 });
                }
            }
        }
    }

    // Step 2: Group children by family and create their links.
    const families = new Map<string, PositionedTreeNode[]>();
    for (const node of nodes) {
        if (
            node.parent &&
            node.parent.children &&
            node.parent.children.some((child: PositionedTreeNode) => child.id === node.id)
        ) {
            const p1 = node.parent.id;
            const p2 = node.coParentId;
            const familyId = p2 ? [p1, p2].sort().join('_') : p1;
            if (!families.has(familyId)) families.set(familyId, []);
            families.get(familyId)!.push(node);
        }
    }

    for (const [familyId, children] of families.entries()) {
        if (familyId === 'super-root') continue;

        const parentIds = familyId.split('_');
        const parent1 = nodeMap.get(parentIds[0]);

        if (parentIds.length === 1 && parent1) { // Single parent
            if (children.length === 1) {
                const child = children[0];
                const x1 = parent1.x + NODE_WIDTH / 2;
                const y1 = parent1.y + NODE_HEIGHT;
                const x2 = child.x + NODE_WIDTH / 2;
                const y2 = child.y;
                newLinks.push({ id: `pc_${parent1.id}_${child.id}`, x1, y1, x2, y2, hasArrow: true });
            } else { // Bus for multiple children from a single parent
                const parentMidX = parent1.x + NODE_WIDTH / 2;
                const parentMidY = parent1.y + NODE_HEIGHT;
                const busY = parentMidY + Y_SPACING_BUS;

                children.sort((a, b) => a.x - b.x);
                const minChildX = children[0].x + NODE_WIDTH / 2;
                const maxChildX = children[children.length - 1].x + NODE_WIDTH / 2;
                
                newLinks.push({ id: `bus_v_main_${familyId}`, x1: parentMidX, y1: parentMidY, x2: parentMidX, y2: busY });
                newLinks.push({ id: `bus_h_${familyId}`, x1: Math.min(parentMidX, minChildX), y1: busY, x2: Math.max(parentMidX, maxChildX), y2: busY });

                for (const child of children) {
                    const childMidX = child.x + NODE_WIDTH / 2;
                    newLinks.push({ id: `bus_v_child_${child.id}`, x1: childMidX, y1: busY, x2: childMidX, y2: child.y, hasArrow: true });
                }
            }
        } else if (parentIds.length === 2) { // Two parents
            const parent2 = nodeMap.get(parentIds[1]);
            if (!parent1 || !parent2) continue;

            const partnerLinkId = `p_${parentIds[0]}_${parentIds[1]}`;
            let partnerLink = newLinks.find(l => l.id === partnerLinkId);

            if (!partnerLink) {
                const { x1, y1, x2, y2 } = getOptimalConnectionPoints(parent1, parent2);
                partnerLink = { id: partnerLinkId, x1, y1, x2, y2 };
                newLinks.push(partnerLink);
            }

            const parentMidX = (partnerLink.x1 + partnerLink.x2) / 2;
            const parentMidY = (partnerLink.y1 + partnerLink.y2) / 2;

            if (children.length === 1) {
                const child = children[0];
                const childConnectionPoint = { x: child.x + NODE_WIDTH / 2, y: child.y };
                newLinks.push({
                    id: `fam_${familyId}-${child.id}`,
                    x1: parentMidX, y1: parentMidY,
                    x2: childConnectionPoint.x, y2: childConnectionPoint.y,
                    hasArrow: true,
                });
            } else { // Bezel/Bus for multiple children
                const busY = parentMidY + Y_SPACING_BUS;
                children.sort((a, b) => a.x - b.x);
                const minChildX = children[0].x + NODE_WIDTH / 2;
                const maxChildX = children[children.length - 1].x + NODE_WIDTH / 2;
                
                newLinks.push({ id: `bus_v_main_${familyId}`, x1: parentMidX, y1: parentMidY, x2: parentMidX, y2: busY });
                newLinks.push({ id: `bus_h_${familyId}`, x1: Math.min(parentMidX, minChildX), y1: busY, x2: Math.max(parentMidX, maxChildX), y2: busY });

                for (const child of children) {
                    const childMidX = child.x + NODE_WIDTH / 2;
                    newLinks.push({ id: `bus_v_child_${child.id}`, x1: childMidX, y1: busY, x2: childMidX, y2: child.y, hasArrow: true });
                }
            }
        }
    }
    return newLinks;
}

const getOptimalConnectionPoints = (nodeA: PositionedTreeNode, nodeB: PositionedTreeNode) => {
    const pointsA = [
        { x: nodeA.x + NODE_WIDTH / 2, y: nodeA.y }, // Top
        { x: nodeA.x + NODE_WIDTH / 2, y: nodeA.y + NODE_HEIGHT }, // Bottom
        { x: nodeA.x, y: nodeA.y + NODE_HEIGHT / 2 }, // Left
        { x: nodeA.x + NODE_WIDTH, y: nodeA.y + NODE_HEIGHT / 2 }, // Right
    ];
    const pointsB = [
        { x: nodeB.x + NODE_WIDTH / 2, y: nodeB.y }, // Top
        { x: nodeB.x + NODE_WIDTH / 2, y: nodeB.y + NODE_HEIGHT }, // Bottom
        { x: nodeB.x, y: nodeB.y + NODE_HEIGHT / 2 }, // Left
        { x: nodeB.x + NODE_WIDTH, y: nodeB.y + NODE_HEIGHT / 2 }, // Right
    ];

    let minDistance = Infinity;
    let optimalPoints = { x1: pointsA[0].x, y1: pointsA[0].y, x2: pointsB[0].x, y2: pointsB[0].y };

    for (const pA of pointsA) {
        for (const pB of pointsB) {
            const distance = Math.sqrt(Math.pow(pA.x - pB.x, 2) + Math.pow(pA.y - pB.y, 2));
            if (distance < minDistance) {
                minDistance = distance;
                optimalPoints = { x1: pA.x, y1: pA.y, x2: pB.x, y2: pB.y };
            }
        }
    }
    return optimalPoints;
}

const handleNodePositionUpdate = ({ id, dx, dy }: NodePositionUpdate) => {
  const node = positionedData.value.nodes.find(n => n.id === id);
  if (!node) return;

  node.x += dx;
  node.y += dy;

  // Recalculate all links based on the new node positions
  positionedData.value.links = calculateLinks(positionedData.value.nodes);
};

function forceRerender() {
  isInitialLayout.value = true;
  layoutTrigger.value++;
}

const getRootNode = (): TreeNode | null => {
  const roots = props.treeData.getRootNodes();
  
  if (!roots || roots.length === 0) return null;
  
  return roots.find((root: TreeNode) => root.children?.length ?? 0 > 0) || roots[0];
}

watch(
  [() => getRootNode(), layoutTrigger],
  ([newTree]) => {    
    if (!newTree) {
      positionedData.value = { nodes: [], links: [], width: 0, height: 0 };
      return;
    }
    const root = cloneTreeWithoutCycles(newTree) as PositionedTreeNode;
    const annotated = traverseAndAnnotateTree(root);

    const nodes: PositionedTreeNode[] = annotated.nodes;
    const nodesByDepth: Map<number, PositionedTreeNode[]> = annotated.nodesByDepth;
    
    // --- positioning logic ---
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const maxNodesPerLevel = Math.max(
      ...Array.from(nodesByDepth.values()).map(l => l.length),
    );
    const totalWidth = (maxNodesPerLevel > 0 ? maxNodesPerLevel : 1) * (NODE_WIDTH + X_SPACING);
    
    nodesByDepth.forEach((level: PositionedTreeNode[], depth) => {
      const y = depth * Y_SPACING;
      const siblingsByParent = groupSiblingsByParent(level);
      
      const levelParents = sortParentsByX(siblingsByParent, nodeMap);
      let lastPlacedX = -Infinity;

      levelParents.forEach((parentNode: PositionedTreeNode) => {
        const siblings = siblingsByParent.get(parentNode.id);
        
        const layoutBlocks: PositionedTreeNode[][] = [];
        const seen = new Set<string>();

        siblings?.forEach((child: PositionedTreeNode) => {
          if (seen.has(child.id)) return;
          const partners = child.partners || [];

          const block = [child, ...partners];

          seen.add(child.id)
          layoutBlocks.push(block);
        });

        const totalBlocksWidth = calculateTotalBlocksWidth(layoutBlocks, NODE_WIDTH, X_SPACING);

        // --- Center between two parents if possible ---
        let groupCenterX: number;
        let groupStartX: number;

        // Try to find a co-parent for this group
        let coParent: PositionedTreeNode | undefined;
        if (!!siblings && siblings.length > 0 && siblings[0].coParentId) {
          coParent = nodeMap.get(siblings[0].coParentId);
        }

        if (coParent) {
          // Center between two parents
          const parent1Center = parentNode.x + NODE_WIDTH / 2;
          const parent2Center = coParent.x + NODE_WIDTH / 2;
          groupCenterX = (parent1Center + parent2Center) / 2;
        } else {
          // Center under single parent
          groupCenterX = parentNode.x + NODE_WIDTH / 2;
        }
        groupStartX = groupCenterX - totalBlocksWidth / 2;

        if (lastPlacedX !== -Infinity) {
          groupStartX = Math.max(groupStartX, lastPlacedX + X_SPACING);
        }

        positionBlocks(layoutBlocks, groupStartX, parentNode.y, NODE_WIDTH, X_SPACING, Y_SPACING);

        if (layoutBlocks.length > 0) {
          lastPlacedX = groupStartX + totalBlocksWidth - X_SPACING;
        }
      });
      
      positionRootNodes(level, totalWidth, NODE_WIDTH, y);
      preventOverlap(level, NODE_WIDTH, X_SPACING);
    });

    // --- Final adjustments ---
    // Normalize coordinates: find the leftmost node and shift the whole tree
    // so it starts at x=0. This is crucial for centering.
    const allXBeforeShift = nodes.filter(n => n.id !== 'super-root' && n.x !== undefined).map(n => n.x);
    if (allXBeforeShift.length > 0) {
        const minX = Math.min(...allXBeforeShift);
        if (minX !== 0) {
            nodes.forEach(n => {
                if (n.id !== 'super-root') {
                    n.x -= minX;
                }
            });
        }
    }

    const allX = nodes.filter(n => n.id !== 'super-root').map(n => n.x);
    const allY = nodes.filter(n => n.id !== 'super-root').map(n => n.y);
    const maxX = allX.length > 0 ? Math.max(...allX) : 0;
    const maxY = allY.length > 0 ? Math.max(...allY) : 0;
    const finalWidth = allX.length > 0 && maxX !== -Infinity ? maxX + NODE_WIDTH + X_SPACING : 0;
    const finalHeight = allY.length > 0 && maxY !== -Infinity ? maxY + NODE_HEIGHT : 0;

    // Defensive: filter out invalid links
    const newLinks = calculateLinks(nodes).filter(
      l => isValidNumber(l.x1) && isValidNumber(l.y1) && isValidNumber(l.x2) && isValidNumber(l.y2)
    );

    positionedData.value = { nodes, links: newLinks, width: finalWidth, height: finalHeight };

    positionedData.value.nodes = positionedData.value.nodes.filter((n: TreeNode) => n.id !== 'super-root');
    positionedData.value.links = positionedData.value.links.filter((l: TreeLink) => !l.id.includes('super-root'));

    if (isInitialLayout.value && positionedData.value.nodes.length > 0) {
      nextTick(() => {
        emit('layout-updated');
        isInitialLayout.value = false;
      });
    }
  },
  { deep: true, immediate: true }
);

defineExpose({
  forceRerender,
});
</script>

<template>
  <div
    id="tree-content"
    class="tree-layout-container"
    :style="{
      width: positionedData.width + 'px',
      height: positionedData.height + 'px',
    }"
  >
    <svg class="links-container" :width="positionedData.width" :height="positionedData.height">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="6" markerHeight="6"
              orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#999" />
        </marker>
      </defs>
      <g>
        <path
          v-for="link in positionedData.links"
          :key="link.id"
          :d="`M ${link.x1} ${link.y1} L ${link.x2} ${link.y2}`"
          :class="['link', { 'partner-link': link.id.startsWith('p_') }]"
          :marker-end="link.hasArrow ? 'url(#arrow)' : ''"
        />
      </g>
    </svg>
    <NodeHeadless
      v-for="node in positionedData.nodes"
      :key="node.id"
      :node="node"
      :drag-enabled="options.dragEnabled"
      @update-position="handleNodePositionUpdate"
    >
      <slot
        name="node"
        :node="node"
        :NODE_WIDTH="NODE_WIDTH"
        :NODE_HEIGHT="NODE_HEIGHT"
      />
    </NodeHeadless>
  </div>
</template>

<style scoped>
.tree-layout-container {
  position: relative;
  overflow: visible;
}
.links-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.links-svg line {
  stroke: #ccc;
  stroke-width: 2;
}
.links-svg line.partner-link {
  stroke: #ff69b4;
  stroke-width: 1.5;
  stroke-dasharray: 4;
}
.links-svg line.family-link {
  stroke-width: 2;
}
.links-svg line.bus-link {
  stroke: #ccc;
  stroke-width: 2;
}
.links-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.link {
  fill: none;
  stroke: #999;
  stroke-width: 2px;
}
.partner-link {
  stroke-dasharray: 5, 5;
}
</style> 