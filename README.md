# inquirer-tree-selector

![version](https://img.shields.io/npm/v/inquirer-tree-selector?label=latest)
![license](https://img.shields.io/npm/l/inquirer-tree-selector)
![node-current](https://img.shields.io/node/v/inquirer-tree-selector?color=darkgreen)
![unpacked-size](https://img.shields.io/npm/unpacked-size/inquirer-tree-selector)
![downloads](https://img.shields.io/npm/dt/inquirer-tree-selector)

A prompt implementation for [Inquirer.js](https://github.com/SBoudrias/Inquirer.js) that allows users to interactively select items from a tree structure in the terminal.

![banner](docs/banner.png)

## Key Features

- **Tree Navigation** – Browse and select items from a hierarchical tree structure.
- **Asynchronous Loading** – Load tree nodes asynchronously as needed.
- **Multiple Selection** – Select multiple items at once.
- **Initial Selection** – Pre-select items when the prompt starts.
- **Prefix Highlighting** - Highlight parent items if a child item, that has not yet been loaded, is selected.
- **Custom Filters** – Apply filters to show only specific item types.
- **Keyboard Navigation** – Use arrow keys for easy selection.
- **Theming** – Customize the appearance of the prompt.

## Installation

<table>
  <thead>
    <tr>
      <th>pnpm (recommended)</th>
      <th>npm</th>
    </tr>
  </thead>
  <tbody>
  <tr>
  <td>

```sh
pnpm add inquirer-tree-selector
```

  </td>
  <td>

```sh
npm install inquirer-tree-selector
```

  </td>
  </tr>
  </tbody>
</table>

## Usage

```ts
import {
  treeSelector,
  type Item
} from 'inquirer-tree-selector'

// Using a static tree
const selection: Item = await treeSelector({
  message: 'Select an item:',
  tree: [
    'Item 1',
    {
      name: 'Category 1',
      value: 'category-1',
      hasChildren: true,
      children: [
        'Subitem 1',
        'Subitem 2'
      ]
    },
    {
      name: 'Category 2',
      value: 'category-2',
      hasChildren: true,
      children: () => Promise.resolve([
        'Async Subitem 1',
        'Async Subitem 2'
      ])
    },
    {
      name: 'Category 3 (with prefix highlighting)',
      // No value, so not directly selectable
      prefix: 'category-3-item-', // Will highlight if a selected item starts with this
      hasChildren: true,
      children: [
        { name: 'Item 3.1', value: 'category-3-item-1' },
        { name: 'Item 3.2', value: 'category-3-item-2' }
      ]
    }
  ]
})

// Using an async function to load the tree
const asyncSelection: Item = await treeSelector({
  message: 'Select an item:',
  tree: async (parent) => {
    // Load items based on parent or return root items if parent is undefined
    if (!parent) {
      return [
        'Root Item 1',
        {
          name: 'Root Category',
          value: 'root-category',
          hasChildren: true
        }
      ]
    } else {
      // Return children for the given parent
      return [
        'Child Item 1',
        'Child Item 2'
      ]
    }
  }
})

// Using multiple selection
const multipleSelections: Item[] = await treeSelector({
  message: 'Select multiple items:',
  multiple: true, // Enable multiple selection
  tree: [
    'Item 1',
    'Item 2',
    {
      name: 'Category',
      value: 'category',
      hasChildren: true,
      children: [
        'Subitem 1',
        'Subitem 2'
      ]
    }
  ]
})

// Using initial selection (single mode)
const singleWithInitial: Item = await treeSelector({
  message: 'Select an item (Item 1 is pre-selected):',
  tree: ['Item 1', 'Item 2', 'Item 3'],
  initialSelection: 'Item 1' // Pre-select by name or value
})

// Using initial selection (multiple mode)
const multipleWithInitial: Item[] = await treeSelector({
  message: 'Select items (Item 1 and Item 3 are pre-selected):',
  multiple: true,
  tree: ['Item 1', 'Item 2', 'Item 3'],
  initialSelection: ['Item 1', 'Item 3'] // Pre-select multiple items
})

// Using initial selection with objects
const objectWithInitial: Item[] = await treeSelector({
  message: 'Select items:',
  multiple: true,
  tree: [
    { name: 'Document 1', value: 'doc1' },
    { name: 'Document 2', value: 'doc2' },
    { name: 'Document 3', value: 'doc3' }
  ],
  initialSelection: [
    { name: 'Document 1', value: 'doc1' }, // Pre-select by object
    'doc3' // Pre-select by value
  ]
})
```

## Documentation

See the full documentation in the [docs/](docs/) directory:

- [Getting Started](docs/getting-started.md) **(not ready)**
- [Theming](docs/theming.md) **(not ready)**
- [Examples](docs/examples.md) **(not ready)**

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

## Copyright & License

© 2024 [Brian Fernandez](https://github.com/br14n-sol) and Contributors.

This project is licensed under the MIT license. See the file [LICENSE](LICENSE) for details.
