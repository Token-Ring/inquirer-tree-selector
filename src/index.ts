import {
  type Status,
  createPrompt,
  makeTheme,
  useEffect,
  useKeypress,
  usePagination,
  usePrefix,
  useState
} from '@inquirer/core'
import { ANSI_HIDE_CURSOR, Status as LocalStatus } from '#consts'
import { baseTheme } from '#theme'
import type { PromptConfig } from '#types/config'
import type { Item } from '#types/item'
import type { StatusType } from '#types/status'
import type { PromptTheme, RenderContext } from '#types/theme'
import {
  isDownKey,
  isEnterKey,
  isEscapeKey,
  isLeftKey,
  isPageDown,
  isPageUp,
  isRightKey,
  isSpaceKey,
  isUpKey
} from '#utils/key'

// Multiple selection enabled, cancellation disabled
export function treeSelector(
  config: PromptConfig & { multiple: true; allowCancel?: false }
): Promise<string[]>

// Multiple selection enabled, cancellation enabled
export function treeSelector(
  config: PromptConfig & { multiple: true; allowCancel: true }
): Promise<string[] | null>

// Single selection, cancellation disabled (existing)
export function treeSelector(
  config: PromptConfig & { multiple?: false; allowCancel?: false }
): Promise<string>

// Single selection, cancellation enabled (existing)
export function treeSelector(
  config: PromptConfig & { multiple?: false; allowCancel: true }
): Promise<string | null>

// Main implementation signature
export function treeSelector(
  config: PromptConfig
): Promise<string | string[] | null> {
  return createPrompt<string | string[] | null, PromptConfig>(
    (config, done) => {
      const {
        pageSize = 10,
        loop = false,
        allowCancel = false,
        cancelText = 'Canceled.',
        emptyText = 'No items available.',
        multiple = false,
        initialSelection,
        tree
      } = config

      const [status, setStatus] = useState<Status>(LocalStatus.Idle as Status)
      const theme = makeTheme<PromptTheme>(baseTheme, config.theme)
      const prefix = usePrefix({ status, theme })
      const [selectedItems, setSelectedItems] = useState<string[]>(
        Array.isArray(initialSelection)
          ? initialSelection
          : [initialSelection as string]
      )

      const [itemStack, setItemStack] = useState<Item[]>([tree])

      const currentItem = itemStack[itemStack.length - 1]

      const [children, setChildren] = useState<Item[] | undefined>()

      useEffect(() => {
        if (currentItem.children instanceof Function) {
          setChildren(undefined)
          Promise.resolve(currentItem.children()).then(children =>
            setChildren(children ?? [])
          )
        } else {
          process.nextTick(() =>
            setChildren((currentItem.children as Item[]) ?? [])
          )
        }
      }, [currentItem, currentItem?.children])

      const [active, setActive] = useState(0)

      const activeItem = children != null ? children[active] : undefined

      useKeypress((key, rl) => {
        if (isEnterKey(key)) {
          if (multiple) {
            // In multiple mode, Enter completes the selection with all selected items
            setStatus(LocalStatus.Done as Status)
            done(selectedItems)
          } else {
            if (activeItem?.value == null) {
              return
            }

            // In single mode, Enter selects the current item
            setStatus(LocalStatus.Done as Status)
            done(activeItem.value)
          }
        } else if (isSpaceKey(key)) {
          // Space now handles selection (toggle in multiple mode, select in single mode)
          if (activeItem?.value == null) {
            return
          }

          if (multiple) {
            const idx = selectedItems.indexOf(activeItem.value)
            if (idx !== -1) {
              setSelectedItems([
                ...selectedItems.slice(0, idx),
                ...selectedItems.slice(idx + 1)
              ])
            } else {
              setSelectedItems([...selectedItems, activeItem.value])
            }
          } else {
            // In single mode, space selects the item (same as Enter)
            setStatus(LocalStatus.Done as Status)
            done(activeItem.value)
          }
        } else if (isRightKey(key)) {
          // Right arrow navigates into children - only if the item has children
          if (activeItem?.children) {
            setItemStack([...itemStack, activeItem])
          }
        } else if (isLeftKey(key) && itemStack.length > 1) {
          setItemStack(itemStack.slice(0, -1))
        } else if (isEscapeKey(key) && allowCancel) {
          setStatus(LocalStatus.Canceled as Status)
          done(null)
        } else if (
          isUpKey(key) ||
          isDownKey(key) ||
          isPageUp(key) ||
          isPageDown(key)
        ) {
          rl.clearLine(0)

          let newOffset = isUpKey(key)
            ? active - 1
            : isDownKey(key)
              ? active + 1
              : isPageUp(key)
                ? active - pageSize
                : active + pageSize

          if (loop) {
            newOffset = children?.length ?? 0 % newOffset
          } else {
            newOffset = Math.min(
              Math.max(newOffset, 0),
              (children?.length ?? 0) - 1
            )
          }

          setActive(newOffset)
        } else if (isEscapeKey(key) && allowCancel) {
          setStatus(LocalStatus.Canceled as Status)
          done(null)
        }
      })

      const page = usePagination({
        items: children ?? [],
        active,
        renderItem: ({ item, index, isActive }) => {
          // Check if the item should be highlighted based on prefix
          const isHighlightedByPrefix =
            item.prefix != null &&
            selectedItems.some(selectedItem =>
              selectedItem.startsWith(item.prefix!)
            )

          return theme.renderItem(item, {
            items: children ?? [],
            loop,
            index,
            isActive,
            isSelected:
              (item.value != null && selectedItems.includes(item.value)) ||
              isHighlightedByPrefix,
            multiple
          })
        },
        pageSize,
        loop
      })

      const message = theme.style.message(config.message, status)

      if (status === (LocalStatus.Canceled as Status)) {
        return `${prefix} ${message} ${theme.style.cancelText(cancelText)}`
      }

      if (activeItem && status === (LocalStatus.Done as Status)) {
        if (multiple) {
          // In multiple mode, show the count of selected items
          const count = selectedItems.length
          const itemText = count === 1 ? 'item' : 'items'
          return `${prefix} ${message} ${theme.style.answer(`${count} ${itemText} selected`)}`
        }
        // In single mode, show the selected item name
        return `${prefix} ${message} ${theme.style.answer(activeItem.name)}`
      }

      const helpTop = theme.style.help(theme.help.top(allowCancel, multiple))
      const content =
        children == null
          ? 'Loading...'
          : !page.length
            ? theme.style.emptyText(emptyText)
            : page

      return `${prefix} ${message} ${helpTop}\n${content}${ANSI_HIDE_CURSOR}`
    }
  )(config)
}

export { LocalStatus as Status }

export type { StatusType, PromptConfig, Item, PromptTheme, RenderContext }
