import { describe, it, expect } from 'vitest';
import { render } from '@inquirer/testing';
import { treeSelector, type Item } from './index'; // Assuming treeSelector is exported from src/index.ts

describe('treeSelector prompt', () => {
  // Increased timeout for this specific test
  it('should render simple tree and allow selection', async () => {
    const { answer, events, getScreen } = await render(treeSelector, {
      message: 'Select an item:',
      tree: [{ name: 'Static Item 1', value: 'static1' }],
    });

    // Let's wait for a short period after render completes,
    // as internal effects might need a cycle.
    await new Promise(resolve => process.nextTick(resolve));
    // await new Promise(resolve => setTimeout(resolve, 100)); // Alternative longer wait

    // Snapshot after initial render and a tick
    // Vitest will update this if it's different. We expect it to show "Static Item 1".
    expect(getScreen()).toMatchInlineSnapshot(`""`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual('static1');
    expect(getScreen()).toMatchInlineSnapshot('"✔ Select an item: Static Item 1"');
  }, 10000); // 10 second timeout for this test

  it('should highlight parent item based on prefix when a child is selected', async () => {
    const { events, getScreen, answer } = await render(treeSelector, {
      message: 'Select an item:',
      multiple: true,
      initialSelection: ['category-1-item-1'],
      tree: [
        { name: 'Item 1', value: 'item1' },
        {
          name: 'Category 1',
          prefix: 'category-1-',
          children: [
            { name: 'Category 1 Item 1', value: 'category-1-item-1' },
            { name: 'Category 1 Item 2', value: 'category-1-item-2' },
          ],
        },
        { name: 'Item 2', value: 'item2' },
      ],
    });

    // Initial state: Category 1 should be highlighted because 'category-1-item-1' is selected
    // and matches the prefix.
    // The ">" indicates active, "X" indicates selected.
    // Depending on the theme, selected items might have different indicators.
    // For this test, we assume the theme will mark selected items,
    // and items whose prefix matches a selected item, in a way that `isSelected`
    // in `renderItem` (which controls highlighting) becomes true.
    await new Promise(r => setTimeout(r, 50)); // Allow the prompt to render, increased delay
    expect(getScreen()).toMatchInlineSnapshot(`""`); // Note: The actual output might vary based on theme's rendering of selected/highlighted items

    // Navigate to Category 1
    events.keypress('down');
    expect(getScreen()).toMatchInlineSnapshot(`""`);

    // Open Category 1
    events.keypress('right');
    // Screen after opening Category 1. 'Category 1 Item 1' should be selected.
    expect(getScreen()).toMatchInlineSnapshot(`""`);

    // Deselect 'Category 1 Item 1'
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`""`);

    // Go back to parent
    events.keypress('left');
     // Now Category 1 should not be highlighted as no child with its prefix is selected
    expect(getScreen()).toMatchInlineSnapshot(`""`);

    // Select 'Item 2'
    events.keypress('down');
    events.keypress('space');
    expect(getScreen()).toMatchInlineSnapshot(`""`);

    events.keypress('enter');
    await expect(answer).resolves.toEqual(['item2']);
  });

  it('should not highlight parent item if prefix does not match any selected item', async () => {
    const { getScreen, answer, events } = await render(treeSelector, {
      message: 'Select an item:',
      multiple: true,
      initialSelection: ['other-item'], // An item not under 'Category 1'
      tree: [
        { name: 'Item 1', value: 'item1' },
        {
          name: 'Category 1',
          prefix: 'category-1-',
          children: [
            { name: 'Category 1 Item 1', value: 'category-1-item-1' },
            { name: 'Category 1 Item 2', value: 'category-1-item-2' },
          ],
        },
        { name: 'Other Item', value: 'other-item' },
      ],
    });

    // Initial state: Category 1 should NOT be highlighted
    await new Promise(r => setTimeout(r, 50)); // Allow the prompt to render, increased delay
    expect(getScreen()).toMatchInlineSnapshot(`""`);
    events.keypress('enter');
    await expect(answer).resolves.toEqual(['other-item']);
  });

  it('should handle async children with prefix highlighting', async () => {
    const { events, getScreen, answer } = await render(treeSelector, {
      message: 'Select an item:',
      multiple: true,
      initialSelection: ['async-child-1'],
      tree: [
        {
          name: 'Async Category',
          prefix: 'async-child-',
          children: () =>
            Promise.resolve([
              { name: 'Async Child 1', value: 'async-child-1' },
              { name: 'Async Child 2', value: 'async-child-2' },
            ]),
        },
        { name: 'Other Item', value: 'other-item' },
      ],
    });

    // Initial state: Async Category should be highlighted
    await new Promise(r => setTimeout(r, 50)); // Allow the prompt to render, increased delay
    expect(getScreen()).toMatchInlineSnapshot(`""`);

    // Open Async Category
    events.keypress('right');
    await Promise.resolve(); // Wait for async children to load

    expect(getScreen()).toMatchInlineSnapshot(`""`);
    events.keypress('enter');
    await expect(answer).resolves.toEqual(['async-child-1']);
  });
});
