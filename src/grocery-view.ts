import * as obsidian from 'obsidian'
import * as stores from './generated/stores'

export const VIEW_TYPE = 'grocery-check'

type SortColumn = 'item' | 'stores'
type SortDirection = 'asc' | 'desc'

export class GroceryCheckView extends obsidian.BasesView {
  get type(): string { return VIEW_TYPE }
  private containerEl: HTMLElement
  private sortColumn: SortColumn = 'stores'
  private sortDirection: SortDirection = 'asc'
  private groupByStore = false
  private lastEntries: obsidian.BasesEntry[] = []

  constructor(controller: obsidian.QueryController, containerEl: HTMLElement) {
    super(controller)
    this.containerEl = containerEl
  }

  public onDataUpdated(): void {
    this.lastEntries = this.data.data
    this.render()
  }

  private render(): void {
    this.containerEl.empty()

    if (this.lastEntries.length === 0) {
      this.containerEl.createEl('p', { text: 'No items found.' })
      return
    }

    this.renderToolbar()

    const table = this.containerEl.createEl('table')
    const thead = table.createEl('thead')
    const headerRow = thead.createEl('tr')
    headerRow.createEl('th', { text: '' })
    this.renderSortHeader(headerRow, 'Item', 'item')
    if (!this.groupByStore) {
      this.renderSortHeader(headerRow, 'Stores', 'stores')
    }
    const tbody = table.createEl('tbody')

    if (this.groupByStore) {
      this.renderGrouped(tbody)
    } else {
      const sorted = this.sortEntries(this.lastEntries)
      for (const entry of sorted) {
        this.renderItem(tbody, entry, false)
      }
    }
  }

  private renderToolbar(): void {
    const toolbar = this.containerEl.createDiv({ cls: 'grocery-toolbar' })

    const sweepBtn = toolbar.createEl('button', { text: 'Sweep completed' })
    sweepBtn.addEventListener('click', () => void this.sweep())

    const groupBtn = toolbar.createEl('button', {
      text: this.groupByStore ? 'Ungroup' : 'Group by store',
    })
    groupBtn.addEventListener('click', () => {
      this.groupByStore = !this.groupByStore
      this.render()
    })
  }

  private renderGrouped(tbody: HTMLElement): void {
    const grouped = new Map<string, obsidian.BasesEntry[]>()
    for (const entry of this.lastEntries) {
      let inAnyStore = false
      for (const key of stores.STORE_KEYS) {
        if (!(entry.getValue(`note.${key}`)?.isTruthy() ?? false)) continue
        inAnyStore = true
        const bucket = grouped.get(key) ?? []
        bucket.push(entry)
        grouped.set(key, bucket)
      }
      if (!inAnyStore) {
        const bucket = grouped.get('(no store)') ?? []
        bucket.push(entry)
        grouped.set('(no store)', bucket)
      }
    }

    const sortedKeys = [...grouped.keys()].sort()
    for (const storeKey of sortedKeys) {
      const label = storeKey === '(no store)'
        ? '(no store)'
        : stores.STORE_DISPLAY_NAMES[storeKey as stores.StoreKey] ?? storeKey
      const groupRow = tbody.createEl('tr')
      const groupHeader = groupRow.createEl('td')
      groupHeader.setAttribute('colspan', '2')
      groupHeader.createEl('strong', { text: label })

      const entries = this.sortEntries(grouped.get(storeKey) ?? [])
      for (const entry of entries) {
        this.renderItem(tbody, entry, true)
      }
    }
  }

  private renderSortHeader(row: HTMLElement, label: string, column: SortColumn): void {
    const th = row.createEl('th')
    th.style.cursor = 'pointer'
    const indicator = this.sortColumn === column
      ? (this.sortDirection === 'asc' ? ' ↑' : ' ↓')
      : ''
    th.setText(label + indicator)
    th.addEventListener('click', () => {
      if (this.sortColumn === column) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortColumn = column
        this.sortDirection = 'asc'
      }
      this.render()
    })
  }

  private sortEntries(entries: obsidian.BasesEntry[]): obsidian.BasesEntry[] {
    const col = this.groupByStore ? 'item' : this.sortColumn
    const dir = this.sortDirection === 'asc' ? 1 : -1
    return [...entries].sort((a, b) => {
      const aVal = col === 'stores'
        ? (a.getValue('formula.Stores')?.toString() ?? '')
        : a.file.basename
      const bVal = col === 'stores'
        ? (b.getValue('formula.Stores')?.toString() ?? '')
        : b.file.basename
      return aVal.localeCompare(bVal) * dir
    })
  }

  private renderItem(tbody: HTMLElement, entry: obsidian.BasesEntry, isGrouped: boolean): void {
    const tr = tbody.createEl('tr')
    const completed = entry.getValue('note.completed')?.isTruthy() ?? false

    const checkTd = tr.createEl('td')
    const checkbox = checkTd.createEl('input')
    checkbox.type = 'checkbox'
    checkbox.checked = completed
    checkbox.addEventListener('change', () => {
      void this.app.fileManager.processFrontMatter(entry.file, (fm) => {
        fm['completed'] = checkbox.checked
      })
    })

    const nameTd = tr.createEl('td', { text: entry.file.basename })
    if (completed) {
      nameTd.addClass('grocery-item-completed')
    }

    if (!isGrouped) {
      const storesValue = entry.getValue('formula.Stores')
      tr.createEl('td', { text: storesValue ? storesValue.toString() : '' })
    }
  }

  private async sweep(): Promise<void> {
    for (const entry of this.data.data) {
      if (!(entry.getValue('note.completed')?.isTruthy() ?? false)) continue
      await this.app.fileManager.processFrontMatter(entry.file, (fm) => {
        for (const key of stores.STORE_KEYS) {
          fm[key] = false
        }
        fm['completed'] = false
      })
    }
  }
}
