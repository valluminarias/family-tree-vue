# Family Graph Vue Component

A powerful, interactive family tree visualization component built with Vue 3, TypeScript, and Vite. This library provides a flexible and customizable family tree component that supports complex family relationships, drag-and-drop functionality, and responsive layouts.

## 🚀 Features

- **Interactive Family Trees**: Create and visualize complex family relationships
- **Drag & Drop Support**: Move nodes around the tree with smooth animations
- **Zoom & Pan**: Navigate large family trees with zoom and pan controls
- **Flexible Layout**: Automatic positioning with customizable spacing and node sizes
- **Partner Relationships**: Support for multiple partners and complex family structures
- **Customizable Nodes**: Slot-based node customization for unique designs
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **Responsive Design**: Works across different screen sizes
- **Modern Tech Stack**: Built with Vue 3, TypeScript, and Tailwind CSS

## 📦 Installation

```bash
npm install family-graph-vue
```

## 📦 Exports

This library exports the following main modules:

- **Tree**: The main Vue component for rendering and interacting with the family tree visualization.
- **ZoomContainer**: A Vue component that provides zoom and pan functionality for wrapping the tree or any content.
- **FamilyTree**: A TypeScript class for managing family tree data, relationships, and structure programmatically.

You can import them as follows:

```typescript
import { Tree, ZoomContainer, FamilyTree } from "family-graph-vue";
```

## 🎯 Quick Start

### Basic Usage

```typescript
<template>
  <div class="h-screen">
    <!-- ZoomContainer: Provides zoom and pan functionality -->
    <ZoomContainer>
      <!-- Tree: Renders the interactive family tree visualization -->
      <Tree :tree-data="familyTree" :options="treeOptions">
        <template #node="slotProps">
          <div class="bg-white border rounded p-2">
            {{ slotProps.node.label }}
          </div>
        </template>
      </Tree>
    </ZoomContainer>
  </div>
</template>

<script setup lang="ts">
// Import Tree, ZoomContainer, and FamilyTree from the library
import { Tree, ZoomContainer, FamilyTree } from "family-graph-vue";
import type { TreeNode, TreeOptions } from "family-graph-vue";

// FamilyTree: Class for managing family tree data and relationships
const familyTree = new FamilyTree();

// Add some family members
const alice = { id: "alice", label: "Alice" };
const bob = { id: "bob", label: "Bob" };
const child = { id: "child", label: "Child" };

familyTree.addNode(alice);
familyTree.addNode(bob);
familyTree.addNode(child);

// Set up relationships
familyTree.addParent(child.id, alice, bob);

// Configure tree options
const treeOptions: TreeOptions = {
  dragEnabled: true,
  nodeWidth: 120,
  nodeHeight: 80,
  xSpacing: 40,
  ySpacing: 200,
};
</script>
```

### Tree Component

The main tree visualization component.

#### Props

```typescript
interface TreeProps {
  treeData: FamilyTree; // The family tree instance
  options: TreeOptions; // Configuration options
}
```

#### TreeOptions Interface

```typescript
interface TreeOptions {
  dragEnabled: boolean; // Enable/disable drag functionality
  nodeWidth?: number; // Width of each node (default: 120)
  nodeHeight?: number; // Height of each node (default: 120)
  xSpacing?: number; // Horizontal spacing between nodes (default: 40)
  ySpacing?: number; // Vertical spacing between levels (default: 200)
  partnerNodeSpacing?: number; // Spacing between partner nodes (default: 20)
}
```

#### Events

```typescript
// Node addition events
@add-node="(node: PositionedTreeNode) => void"
@add-partner="(nodeId: string) => void"
@add-parent="(nodeId: string) => void"

// Node removal event
@remove-node="(nodeId: string) => void"

// Position update event
@update-position="(update: NodePositionUpdate) => void"

// Layout update event
@layout-updated="() => void"
```

#### Slots

##### `node` Slot

Customize the appearance of each node in the tree.

```typescript
<Tree :tree-data="familyTree" :options="treeOptions">
  <template #node="{ node, isDragging, onDragStart, onDragEnd }">
    <div
      class="custom-node"
      :class="{ 'dragging': isDragging }"
      @mousedown="onDragStart"
      @mouseup="onDragEnd"
    >
      <img v-if="node.image" :src="node.image" :alt="node.label" />
      <span>{{ node.label }}</span>
    </div>
  </template>
</Tree>
```

### ZoomContainer Component

A wrapper component that provides zoom and pan functionality.

#### Props

```typescript
interface ZoomContainerProps {
  minZoom?: number; // Minimum zoom level (default: 0.1)
  maxZoom?: number; // Maximum zoom level (default: 3)
  initialZoom?: number; // Initial zoom level (default: 1)
}
```

#### Methods

```typescript
// Reset zoom to initial level
zoomContainerRef.value?.resetZoom();

// Zoom to fit all content
zoomContainerRef.value?.zoomToFit();

// Set specific zoom level
zoomContainerRef.value?.setZoom(1.5);
```

## 🎨 Customization Examples

### Custom Node Design

```typescript
<template #node="{ node, isDragging }">
  <div
    class="relative bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-4 shadow-lg"
    :class="{ 'opacity-75 scale-105': isDragging }"
  >
    <div class="flex items-center space-x-3">
      <div
        class="w-12 h-12 bg-white rounded-full flex items-center justify-center"
      >
        <span class="text-blue-600 font-bold text-lg">
          {{ node.label.charAt(0) }}
        </span>
      </div>
      <div>
        <h3 class="font-semibold">{{ node.label }}</h3>
        <p class="text-sm opacity-90">{{ node.id }}</p>
      </div>
    </div>
  </div>
</template>
```

### Advanced Family Tree Setup

```typescript
// Create a complex family tree
const familyTree = new FamilyTree();

// First generation
const john = { id: "john", label: "John Smith" };
const mary = { id: "mary", label: "Mary Johnson" };
const sarah = { id: "sarah", label: "Sarah Wilson" };

// Second generation
const mike = { id: "mike", label: "Mike Smith" };
const lisa = { id: "lisa", label: "Lisa Brown" };
const david = { id: "david", label: "David Smith" };
const emma = { id: "emma", label: "Emma Davis" };

// Third generation
const alex = { id: "alex", label: "Alex Smith" };
const sophie = { id: "sophie", label: "Sophie Smith" };

// Add all nodes
[john, mary, sarah, mike, lisa, david, emma, alex, sophie].forEach((person) => {
  familyTree.addNode(person);
});

// Set up relationships
familyTree.addParent(mike.id, john, mary);
familyTree.addParent(david.id, john, sarah);
familyTree.addParent(alex.id, mike, lisa);
familyTree.addParent(sophie.id, david, emma);
```

## 📚 API Documentation

### FamilyTree Class

The core class for managing family tree data and relationships.

#### Constructor

```typescript
const familyTree = new FamilyTree();
```

#### Methods

##### `addNode(nodeData)`

Adds a new node to the family tree.

```typescript
familyTree.addNode({
  id: 'unique-id',
  label: 'Person Name',
  parent?: TreeNode,
  partners?: TreeNode[],
  children?: TreeNode[],
  coParentId?: string,
  image?: string
});
```

##### `addParent(childId, parentData, coParentData?)`

Adds a parent (and optionally a co-parent) to an existing child.

```typescript
familyTree.addParent(
  "child-id",
  {
    id: "parent-id",
    label: "Parent Name",
  },
  {
    id: "co-parent-id",
    label: "Co-Parent Name",
  }
);
```

##### `updateNode(id, updates)`

Updates an existing node's information.

```typescript
familyTree.updateNode("node-id", {
  label: "New Name",
  image: "new-image-url",
});
```

##### `removeNode(id)`

Removes a node and all its relationships from the tree.

```typescript
familyTree.removeNode("node-id");
```

##### `getNode(id)`

Retrieves a node by its ID.

```typescript
const node = familyTree.getNode("node-id");
```

##### `getNodes()`

Returns all nodes in the tree.

```typescript
const allNodes = familyTree.getNodes();
```

##### `getRootNodes()`

Returns all root nodes (nodes without parents).

```typescript
const rootNodes = familyTree.getRootNodes();
```

##### `getChildren(nodeId)`

Returns all children of a specific node.

```typescript
const children = familyTree.getChildren("parent-id");
```

##### `getPartners(nodeId)`

Returns all partners of a specific node.

```typescript
const partners = familyTree.getPartners("node-id");
```

##### `getSiblings(nodeId)`

Returns all siblings of a specific node.

```typescript
const siblings = familyTree.getSiblings("node-id");
```

##### `getDescendants(nodeId, options?)`

Returns all descendants of a specific node.

```typescript
const descendants = familyTree.getDescendants("ancestor-id", {
  maxDepth: 3,
  filterFn: (node) => node.label.startsWith("A"),
});
```

##### `getAncestors(nodeId, options?)`

Returns all ancestors of a specific node.

```typescript
const ancestors = familyTree.getAncestors("descendant-id", {
  maxDepth: 2,
});
```

## 🛠️ Development

### Prerequisites

- Node.js 16+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd family-tree

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Project Structure

```
family-tree/
├── src/
│   ├── components/
│   │   ├── Tree.vue          # Main tree component
│   │   ├── NodeHeadless.vue  # Headless node component
│   │   └── ZoomContainer.vue # Zoom and pan container
│   ├── utils/
│   │   ├── layoutUtils.ts    # Layout calculation utilities
│   │   └── treeUtility.ts    # Tree manipulation utilities
│   ├── stores/               # State management
│   ├── Demo.vue              # Demo component
│   └── index.ts              # Main export file
├── lib/
│   └── FamilyTree.ts         # Core family tree class
├── public/                   # Static assets
└── dist/                     # Build output
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions, please:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue with a detailed description
3. Include code examples and error messages when possible

## 🔗 Related Projects

- [Vue 3](https://vuejs.org/) - Progressive JavaScript framework
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [Vite](https://vitejs.dev/) - Next generation frontend tooling
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
