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
  private lastGroups: obsidian.BasesEntryGroup[] = []

  constructor(controller: obsidian.QueryController, containerEl: HTMLElement) {
    super(controller)
    this.containerEl = containerEl
  }

  public onDataUpdated(): void {
    this.lastGroups = this.data.groupedData
    this.render()
  }

  private render(): void {
    this.containerEl.empty()

    const groups = this.lastGroups
    const totalEntries = groups.reduce((sum, g) => sum + g.entries.length, 0)

    if (!entries || entries.length === 0) {
      this.containerEl.createEl('p', { text: 'No items found.' })
      return
    }

    this.renderSweepButton()

    const isGrouped = groups.length > 1 || groups[0]?.hasKey()
    const table = this.containerEl.createEl('table')
    const thead = table.createEl('thead')
    const headerRow = thead.createEl('tr')
    headerRow.createEl('th', { text: '' })
    this.renderSortHeader(headerRow, 'Item', 'item')
    if (!isGrouped) {
      this.renderSortHeader(headerRow, 'Stores', 'stores')
    }

    const tbody = table.createEl('tbody')
    for (const group of groups) {
      if (isGrouped && group.hasKey()) {
        const groupRow = tbody.createEl('tr')
        const groupHeader = groupRow.createEl('td')
        groupHeader.setAttribute('colspan', '2')
        groupHeader.createEl('strong', { text: group.key?.toString() ?? '' })
      }
      const sorted = this.sortEntries(group.entries, isGrouped)
      for (const entry of sorted) {
        this.renderItem(tbody, entry, isGrouped)
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

  private sortEntries(entries: obsidian.BasesEntry[], isGrouped: boolean): obsidian.BasesEntry[] {
    const col = isGrouped ? 'item' : this.sortColumn
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

  private renderSweepButton(): void {
    const btn = this.containerEl.createEl('button', { text: 'Sweep completed' })
    btn.addEventListener('click', () => void this.sweep())
  }

  private renderItems(entries: obsidian.BasesEntry[]): void {
    const table = this.containerEl.createEl('table')
    const thead = table.createEl('thead')
    const headerRow = thead.createEl('tr')
    headerRow.createEl('th', { text: '' })
    headerRow.createEl('th', { text: 'Item' })
    headerRow.createEl('th', { text: 'Stores' })
    const tbody = table.createEl('tbody')
    for (const entry of entries) {
      this.renderItem(tbody, entry)
    }
  }

  private renderItem(tbody: HTMLElement, entry: obsidian.BasesEntry): void {
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

    const storesValue = entry.getValue('formula.Stores')
    tr.createEl('td', { text: storesValue ? storesValue.toString() : '' })
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
