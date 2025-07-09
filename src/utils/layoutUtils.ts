import type { PositionedTreeNode } from '../lib/FamilyTree';

export function groupSiblingsByParent(level: PositionedTreeNode[]): Map<string, PositionedTreeNode[]> {
  const siblingsByParent = new Map<string, PositionedTreeNode[]>();
  level.forEach(node => {
    if (node.parent) {
      const parentId = node.parent.id;
      if (!siblingsByParent.has(parentId)) siblingsByParent.set(parentId, []);
      siblingsByParent.get(parentId)!.push(node);
    }
  });
  return siblingsByParent;
}

export function sortParentsByX(
  siblingsByParent: Map<string, PositionedTreeNode[]>,
  nodeMap: Map<string, PositionedTreeNode>
): PositionedTreeNode[] {
  return Array.from(siblingsByParent.keys())
    .map(id => nodeMap.get(id))
    .filter((p): p is PositionedTreeNode => !!p)
    .sort((a, b) => a.x - b.x);
}

export function buildLayoutBlocks(
  siblings: PositionedTreeNode[]
): PositionedTreeNode[][] {
  const layoutBlocks: PositionedTreeNode[][] = [];
  const used = new Set<string>();
  siblings.forEach((child) => {
    if (used.has(child.id)) return;
    // Always group the child and all its partners (if any) as a block
    const block: PositionedTreeNode[] = [child];
    used.add(child.id);
    if (child.partners && child.partners.length > 0) {
      child.partners.forEach((partner: PositionedTreeNode) => {
        if (partner && !used.has(partner.id)) {
          block.push(partner);
          used.add(partner.id);
        }
      });
    }
    layoutBlocks.push(block);
  });
  return layoutBlocks;
}

export function calculateTotalBlocksWidth(
  layoutBlocks: PositionedTreeNode[][],
  NODE_WIDTH: number,
  X_SPACING: number
): number {
  return layoutBlocks.reduce((sum, block, i) => {
    return sum + block.length * NODE_WIDTH + (block.length - 1) * X_SPACING + (i > 0 ? X_SPACING : 0);
  }, 0);
}

export function positionBlocks(
  layoutBlocks: PositionedTreeNode[][],
  startX: number,
  parentY: number,
  NODE_WIDTH: number,
  X_SPACING: number,
  Y_SPACING: number
): void {
  let currentBlockX = startX;
  layoutBlocks.forEach(block => {
    block.forEach((node, idx) => {
      node.x = currentBlockX + idx * (NODE_WIDTH + X_SPACING);
      node.y = parentY + Y_SPACING;
    });
    const blockWidth = block.length * NODE_WIDTH + (block.length - 1) * X_SPACING;
    currentBlockX += blockWidth + X_SPACING;
  });
}

export function positionRootNodes(
  level: PositionedTreeNode[],
  totalWidth: number,
  NODE_WIDTH: number,
  y: number
): void {
  const numNodesInLevel = level.length;
  level.filter(node => !node.parent).forEach((node, index) => {
    node.x = (totalWidth / (numNodesInLevel + 1)) * (index + 1) - NODE_WIDTH / 2;
    node.y = y;
  });
}

export function preventOverlap(
  level: PositionedTreeNode[],
  NODE_WIDTH: number,
  X_SPACING: number
): void {
  level.sort((a, b) => a.x - b.x);
  for (let i = 1; i < level.length; i++) {
    const prev = level[i - 1];
    const curr = level[i];
    if (curr.x < prev.x + NODE_WIDTH + X_SPACING) {
      curr.x = prev.x + NODE_WIDTH + X_SPACING;
    }
  }
}

export function isValidNumber(n: unknown): boolean {
  return typeof n === 'number' && !isNaN(n) && isFinite(n);
} 