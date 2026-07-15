import * as obsidian from 'obsidian'
import * as groceryView from './grocery-view'

interface PluginData {
  groupByStore: boolean
}

const DEFAULT_DATA: PluginData = { groupByStore: false }

export default class IridescentIbisPlugin extends obsidian.Plugin {
  async onload(): Promise<void> {
    const data: PluginData = Object.assign({}, DEFAULT_DATA, await this.loadData())

    this.registerBasesView(groceryView.VIEW_TYPE, {
      name: 'Grocery Check',
      icon: 'lucide-shopping-cart',
      factory: (controller, containerEl) => new groceryView.GroceryCheckView(
        controller,
        containerEl,
        data.groupByStore,
        async (value: boolean) => {
          data.groupByStore = value
          await this.saveData(data)
        },
      ),
    })
  }
}
