export interface TreeNode {
  id: string;
  label: string;
  parent?: TreeNode | null;
  partners?: TreeNode[];
  children?: TreeNode[];
  coParentId?: string;
  image?: string;
}

export interface PositionedTreeNode extends TreeNode {
  x: number;
  y: number;
  depth: number;
  parent: PositionedTreeNode | null;
  partners: PositionedTreeNode[];
  children: PositionedTreeNode[];
}

export interface TreeLink {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  hasArrow?: boolean;
}

export interface PositionedTreeData {
  nodes: PositionedTreeNode[];
  links: TreeLink[];
  width: number;
  height: number;
}

export type FamilyTreeNodeInput = Omit<TreeNode, "children" | "partners" | "parent">;

export class FamilyTree {
  public nodes: Map<string, TreeNode> = new Map();

  /**
   * Add a new node to the family tree
   * Sets up parent, partners, and children relationships (bidirectional)
   */
  addNode(nodeData: Omit<TreeNode, "children" | "partners" | "parent"> & {
    parent?: TreeNode | null;
    partners?: TreeNode[];
    children?: TreeNode[];
  }): TreeNode {
    const { id, label, parent, partners = [], children = [], coParentId, image } = nodeData;

    // Create the new node
    const newNode: TreeNode = {
      id,
      label,
      parent: parent || null,
      partners: [],
      children: [],
      coParentId,
      image,
    };

    // Add to map
    this.nodes.set(id, newNode);

    // Set parent relationship
    if (parent && parent.id) {
      const parentNode = this.nodes.get(parent.id);
      if (parentNode) {
        parentNode.children?.push(newNode);
        newNode.parent = parentNode;
      }
    }

    // Set partners relationship (bidirectional)
    partners.forEach((partner) => {
      const partnerNode = this.nodes.get(partner.id);
      if (partnerNode) {
        newNode.partners?.push(partnerNode);
        if (!partnerNode.partners?.some((p) => p.id === id)) {
          partnerNode.partners?.push(newNode);
        }
      }
    });

    // Set children relationship
    children.forEach((child) => {
      const childNode = this.nodes.get(child.id);
      if (childNode) {
        newNode.children?.push(childNode);
        childNode.parent = newNode;
      }
    });

    return newNode;
  }
  
  /**
   * Add a parent to a node, with optional co-parent.
   * If parent or co-parent already exists (by id), will use existing node.
   */
  addParent(
    childId: string,
    parentData: FamilyTreeNodeInput & { image?: string },
    coParentData?: FamilyTreeNodeInput & { image?: string }
  ): boolean {
    const child = this.nodes.get(childId);
    if (!child) return false;

    // Create or get parent node
    let parent = this.nodes.get(parentData.id);
    if (!parent) {
      parent = this.addNode({ ...parentData });
    }

    // Set parent-child relationship
    if (!child.parent) {
      child.parent = parent;
      parent.children?.push(child);
    } else {
      // If child already has a parent, do not overwrite
      // Optionally, could support multiple parents, but not in current model
      // Could throw or return undefined
      return false;
    }

    let coParent: TreeNode | undefined = undefined;
    if (coParentData) {
      coParent = this.nodes.get(coParentData.id);
      if (!coParent) {
        coParent = this.addNode({ ...coParentData });
      }
      // Set up partner relationship (bidirectional)
      if (!parent.partners?.some((p) => p.id === coParent!.id)) {
        parent.partners?.push(coParent);
      }
      if (!coParent.partners?.some((p) => p.id === parent!.id)) {
        coParent.partners?.push(parent);
      }
      // Do NOT add child to co-parent's children
      // Optionally, set coParentId on child
      child.coParentId = coParent.id;
    }

    return true;
  }

  /**
   * Update a node's information
   */
  updateNode(
    id: string,
    updates: Partial<Omit<TreeNode, "id" | "children">>
  ): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    // Handle parent change
    if (
      updates.parent?.id !== undefined &&
      updates.parent?.id !== node.parent?.id
    ) {
      // Remove from old parent's children
      if (node.parent?.id) {
        const oldParent = this.nodes.get(node.parent?.id);
        if (oldParent) {
          oldParent.children = oldParent.children?.filter(
            (child) => child.id !== id
          );
        }
      }

      // Add to new parent's children
      if (updates.parent?.id) {
        const newParent = this.nodes.get(updates.parent.id);
        if (newParent) {
          newParent.children?.push(node);
        }
      }
      // Update the node's parent reference
      node.parent = updates.parent || null;
    }

    // Handle partners update (ensure bidirectional consistency)
    if (updates.partners) {
      // Remove this node from old partners' partners
      node.partners?.forEach((partner) => {
        const partnerNode = this.nodes.get(partner.id);
        if (partnerNode) {
          partnerNode.partners = partnerNode.partners?.filter((p) => p.id !== id);
        }
      });
      // Add this node to new partners' partners
      updates.partners.forEach((partner) => {
        const partnerNode = this.nodes.get(partner.id);
        if (partnerNode && !partnerNode.partners?.some((p) => p.id === id)) {
          partnerNode.partners?.push(node);
        }
      });
      node.partners = updates.partners;
    }

    // Update other node data (excluding parent, partners)
    const { parent, partners, ...otherUpdates } = updates;
    Object.assign(node, otherUpdates);
    return true;
  }

  /**
   * Remove a node from the family tree
   * - Removes from parent's children
   * - Removes from partners' partners
   * - Clears parent reference in all children
   */
  removeNode(id: string): boolean {
    const node = this.nodes.get(id);
    if (!node) return false;

    // Remove from parent's children
    if (node.parent?.id) {
      const parent = this.nodes.get(node.parent?.id);
      if (parent) {
        parent.children = parent.children?.filter((child) => child?.id !== id);
      }
    }

    // Remove from partners' partner references
    node.partners?.forEach((partner) => {
      const partnerNode = this.nodes.get(partner.id);
      if (partnerNode) {
        partnerNode.partners = partnerNode.partners?.filter((p) => p.id !== id);
      }
    });

    // Clear parent reference in all children
    node.children?.forEach((child) => {
      const childNode = this.nodes.get(child.id);
      if (childNode) {
        childNode.parent = null;
      }
    });

    // Remove the node
    this.nodes.delete(id);
    return true;
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): TreeNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes in the family tree
   */
  getNodes(): TreeNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get parents of a node
   */
  getParents(nodeId: string): TreeNode[] {
    const node = this.nodes.get(nodeId);
    if (!node || !node.parent?.id) return [];

    const parent = this.nodes.get(node.parent?.id);
    return parent ? [parent] : [];
  }

  /**
   * Get children of a node
   */
  getChildren(nodeId: string): TreeNode[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];

    return node.children
      ?.map((child) => this.nodes.get(child.id))
      ?.filter((child) => child !== undefined) || [];
  }

  /**
   * Get siblings of a node
   */
  getSiblings(nodeId: string): TreeNode[] {
    const node = this.nodes.get(nodeId);
    if (!node || !node.parent?.id) return [];

    const parent = this.nodes.get(node.parent?.id);
    if (!parent) return [];

    return parent.children
      ?.map((child) => this.nodes.get(child.id))
      ?.filter((child) => child?.id !== nodeId)
      ?.filter((sibling) => sibling !== undefined) || [];
  }

  /**
   * Get partners of a node
   */
  getPartners(nodeId: string): TreeNode[] {
    const node = this.nodes.get(nodeId);
    if (!node || !node.partners) return [];

    return node.partners
      .map((partner) => this.nodes.get(partner.id))
      .filter((partner): partner is TreeNode => partner !== undefined);
  }

  /**
   * Get the root nodes (people without parents)
   */
  getRootNodes(): TreeNode[] {
    return Array.from(this.nodes.values()).filter((node) => !node.parent?.id);
  }

  /**
   * Get descendants of a node (children, grandchildren, etc.)
   * @param nodeId - The starting node's ID
   * @param options - Optional: maxDepth (number), filterFn (function)
   */
  getDescendants(
    nodeId: string,
    options?: {
      maxDepth?: number;
      filterFn?: (node: TreeNode) => boolean;
    }
  ): TreeNode[] {
    const descendants: TreeNode[] = [];
    const visited: Set<string> = new Set();
    // Stack holds tuples: [currentId, currentDepth]
    const stack: Array<{ id: string; depth: number }> = [
      { id: nodeId, depth: 0 },
    ];
    const maxDepth = options?.maxDepth;
    const filterFn = options?.filterFn;

    visited.add(nodeId); // Don't include the root node as its own descendant

    while (stack.length > 0) {
      const { id: currentId, depth } = stack.pop()!;
      const node = this.nodes.get(currentId);
      if (!node) continue;

      for (const child of (node.children || [])) {
        if (!child || !child.id) continue;
        if (visited.has(child.id)) continue;
        if (maxDepth !== undefined && depth + 1 > maxDepth) continue;
        visited.add(child.id);
        if (!filterFn || filterFn(child)) {
          descendants.push(child);
        }
        stack.push({ id: child.id, depth: depth + 1 });
      }
    }

    return descendants;
  }

  /**
   * Get ancestors of a node (parents, grandparents, etc.)
   * @param nodeId - The starting node's ID
   * @param options - Optional: maxDepth (number), filterFn (function)
   */
  getAncestors(
    nodeId: string,
    options?: {
      maxDepth?: number;
      filterFn?: (node: TreeNode) => boolean;
    }
  ): TreeNode[] {
    const ancestors: TreeNode[] = [];
    const visited: Set<string> = new Set();
    let currentId = nodeId;
    let depth = 0;
    const maxDepth = options?.maxDepth;
    const filterFn = options?.filterFn;

    while (currentId) {
      const node = this.nodes.get(currentId);
      if (!node || !node.parent || !node.parent.id) break;
      const parent = this.nodes.get(node.parent.id);
      if (!parent || visited.has(parent.id)) break;
      visited.add(parent.id);
      depth++;
      if (maxDepth !== undefined && depth > maxDepth) break;
      if (!filterFn || filterFn(parent)) {
        ancestors.push(parent);
      }
      currentId = parent.id;
    }

    return ancestors;
  }

}

