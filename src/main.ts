import * as obsidian from 'obsidian'
import * as groceryView from './grocery-view'

export default class IridescentIbisPlugin extends obsidian.Plugin {
  async onload(): Promise<void> {
    this.registerBasesView(groceryView.VIEW_TYPE, {
      name: 'Grocery Check',
      icon: 'lucide-shopping-cart',
      factory: (controller, containerEl) => new groceryView.GroceryCheckView(controller, containerEl),
    })
  }
}
