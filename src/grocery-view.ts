import * as obsidian from 'obsidian'
import * as stores from './generated/stores'

export const VIEW_TYPE = 'grocery-check'

export class GroceryCheckView extends obsidian.BasesView {
  get type(): string { return VIEW_TYPE }
  private containerEl: HTMLElement

  constructor(controller: obsidian.QueryController, containerEl: HTMLElement) {
    super(controller)
    this.containerEl = containerEl
  }

  public onDataUpdated(): void {
    this.containerEl.empty()

    const entries = this.data.data

    if (!entries || entries.length === 0) {
      this.containerEl.createEl('p', { text: 'No items found.' })
      return
    }

    this.renderSweepButton()
    this.renderItems(entries)
  }

  private renderSweepButton(): void {
    const btn = this.containerEl.createEl('button', { text: 'Sweep completed' })
    btn.addEventListener('click', () => void this.sweep())
  }

  private renderItems(entries: obsidian.BasesEntry[]): void {
    const list = this.containerEl.createEl('ul')
    for (const entry of entries) {
      this.renderItem(list, entry)
    }
  }

  private renderItem(list: HTMLElement, entry: obsidian.BasesEntry): void {
    const li = list.createEl('li')
    const completed = entry.getValue('note.completed')?.isTruthy() ?? false

    const checkbox = li.createEl('input')
    checkbox.type = 'checkbox'
    checkbox.checked = completed
    checkbox.addEventListener('change', () => {
      void this.app.fileManager.processFrontMatter(entry.file, (fm) => {
        fm['completed'] = checkbox.checked
      })
    })

    const label = li.createSpan({ text: entry.file.basename })
    if (completed) {
      label.addClass('grocery-item-completed')
    }

    const storesValue = entry.getValue('formula.Stores')
    if (storesValue) {
      li.createSpan({ text: ' — ' })
      li.createSpan({ text: storesValue.toString(), cls: 'grocery-item-stores' })
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
