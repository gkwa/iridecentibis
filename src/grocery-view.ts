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

    const groups = this.data.groupedData
    const totalEntries = groups.reduce((sum, g) => sum + g.entries.length, 0)

    if (totalEntries === 0) {
      this.containerEl.createEl('p', { text: 'No items found.' })
      return
    }

    this.renderSweepButton()

    const isGrouped = groups.length > 1 || groups[0]?.hasKey()

    const table = this.containerEl.createEl('table')
    const thead = table.createEl('thead')
    const headerRow = thead.createEl('tr')
    headerRow.createEl('th', { text: '' })
    headerRow.createEl('th', { text: 'Item' })
    if (!isGrouped) {
      headerRow.createEl('th', { text: 'Stores' })
    }
    const tbody = table.createEl('tbody')

    for (const group of groups) {
      if (isGrouped && group.hasKey()) {
        const groupRow = tbody.createEl('tr')
        const groupHeader = groupRow.createEl('td')
        groupHeader.setAttribute('colspan', '2')
        groupHeader.createEl('strong', { text: group.key?.toString() ?? '' })
      }
      for (const entry of group.entries) {
        this.renderItem(tbody, entry, isGrouped)
      }
    }
  }

  private renderSweepButton(): void {
    const btn = this.containerEl.createEl('button', { text: 'Sweep completed' })
    btn.addEventListener('click', () => void this.sweep())
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
