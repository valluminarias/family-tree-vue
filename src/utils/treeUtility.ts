// Utility: Deep clone a tree node, skipping cyclic references (like 'parent')
export function cloneTreeWithoutCycles<T extends object>(obj: T, skipKeys: string[] = ['parent']): T {
  const seen = new WeakMap();
  function clone(item: any): any {
    if (item === null || typeof item !== 'object') return item;
    if (seen.has(item)) return seen.get(item);
    if (Array.isArray(item)) {
      const arr: any[] = [];
      seen.set(item, arr);
      for (const v of item) arr.push(clone(v));
      return arr;
    }
    const result: any = {};
    seen.set(item, result);
    for (const key of Object.keys(item)) {
      if (skipKeys.includes(key)) continue;
      result[key] = clone(item[key]);
    }
    return result;
  }
  return clone(obj);
}

/**
 * Traverses a tree, annotates each node with depth and parent, and groups nodes by depth.
 * @param root The root node of the tree.
 * @returns { nodes: PositionedTreeNode[], nodesByDepth: Map<number, PositionedTreeNode[]> }
 */
export function traverseAndAnnotateTree<T extends { children?: T[]; partners?: T[]; id: string; depth?: number; parent?: T | null }>(
  root: T
): { nodes: T[]; nodesByDepth: Map<number, T[]> } {
  const nodes: T[] = [];
  const nodesByDepth = new Map<number, T[]>();
  const visited = new Set<string>();
  const queue: { node: T; depth: number; parent: T | null }[] = [
    { node: root, depth: 0, parent: null }
  ];

  while (queue.length > 0) {
    const { node, depth, parent } = queue.shift()!;
    if (visited.has(node.id)) continue;
    visited.add(node.id);

    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth)!.push(node);

    (node as any).depth = depth;
    (node as any).parent = parent;
    nodes.push(node);

    // Traverse children
    if (node.children) {
      for (const child of node.children) {
        if (child && !visited.has(child.id)) {
          queue.push({
            node: child,
            depth: depth + 1,
            parent: node
          });
        }
      }
    }
    // Traverse partners at the same depth
    if (node.partners) {
      for (const partner of node.partners) {
        if (partner && !visited.has(partner.id)) {
          queue.push({
            node: partner,
            depth: depth,
            parent: null // or node, depending on your logic
          });
        }
      }
    }
  }

  return { nodes, nodesByDepth };
} 