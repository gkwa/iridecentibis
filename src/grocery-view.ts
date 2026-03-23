import * as obsidian from 'obsidian'
import * as stores from './generated/stores'

export const VIEW_TYPE = 'grocery-check'

export class GroceryCheckView extends obsidian.BasesView {
  readonly type = VIEW_TYPE
  private containerEl: HTMLElement

  constructor(controller: obsidian.QueryController, containerEl: HTMLElement) {
    super(controller)
    this.containerEl = containerEl
  }

  public onDataUpdated(): void {
    this.containerEl.empty()
    this.renderSweepButton()
    this.renderItems()
  }

  private renderSweepButton(): void {
    const btn = this.containerEl.createEl('button', { text: 'Sweep completed' })
    btn.addEventListener('click', () => void this.sweep())
  }

  private renderItems(): void {
    const list = this.containerEl.createEl('ul')
    for (const group of this.data.groupedData) {
      for (const entry of group.entries) {
        this.renderItem(list, entry)
      }
    }
  }

  private renderItem(list: HTMLElement, entry: obsidian.BasesEntry): void {
    const li = list.createEl('li')
    const completed = entry.getValue('completed') === true

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
  }

  private async sweep(): Promise<void> {
    for (const group of this.data.groupedData) {
      for (const entry of group.entries) {
        if (entry.getValue('completed') !== true) continue
        await this.app.fileManager.processFrontMatter(entry.file, (fm) => {
          for (const key of stores.STORE_KEYS) {
            fm[key] = false
          }
          fm['completed'] = false
        })
      }
    }
  }
}
