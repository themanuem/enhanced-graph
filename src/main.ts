import { Plugin } from 'obsidian';
import { GraphPatcher } from './graph-patcher';

export default class EnhancedGraphPlugin extends Plugin {
  private graphPatcher!: GraphPatcher;

  async onload(): Promise<void> {
    this.graphPatcher = new GraphPatcher(this.app, this);

    // Detect graph open/close
    this.registerEvent(
      this.app.workspace.on('layout-change', () => {
        this.graphPatcher.handleLayoutChange();
      })
    );

    // Also check on load (graph may already be open)
    this.app.workspace.onLayoutReady(() => {
      this.graphPatcher.handleLayoutChange();
    });

    console.log('[Enhanced Graph] Plugin loaded');
  }

  onunload(): void {
    this.graphPatcher.destroy();
    console.log('[Enhanced Graph] Plugin unloaded');
  }
}
