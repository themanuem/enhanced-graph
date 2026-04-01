import { App, Plugin } from 'obsidian';
import { around } from 'monkey-around';
import type { GraphRenderer, GraphEngine } from './types';
import { IconicResolver } from './iconic-resolver';
import { IconRenderer } from './icon-renderer';

export class GraphPatcher {
  private app: App;
  private plugin: Plugin;
  private uninstallers: Array<() => void> = [];
  private patched = false;
  private renderer: GraphRenderer | null = null;
  private iconicResolver: IconicResolver;
  private iconRenderer: IconRenderer;
  private iconsReady = false;

  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.iconicResolver = new IconicResolver(app);
    this.iconRenderer = new IconRenderer();
  }

  handleLayoutChange(): void {
    const renderer = this.findRenderer();
    if (renderer && !this.patched) {
      this.patchRenderer(renderer);
    } else if (!renderer && this.patched) {
      this.unpatch();
    }
  }

  private findRenderer(): GraphRenderer | null {
    for (const type of ['graph', 'localgraph']) {
      const leaves = this.app.workspace.getLeavesOfType(type);
      for (const leaf of leaves) {
        const view = leaf.view as any;
        const renderer = view?.renderer;
        if (
          renderer?.px?.stage &&
          renderer?.panX !== undefined &&
          Array.isArray(renderer.nodes)
        ) {
          return renderer as GraphRenderer;
        }
      }
    }
    return null;
  }

  getEngine(): GraphEngine | null {
    for (const type of ['graph', 'localgraph']) {
      const leaves = this.app.workspace.getLeavesOfType(type);
      for (const leaf of leaves) {
        const view = leaf.view as any;
        if (view?.dataEngine?.controlsEl) {
          return view.dataEngine as GraphEngine;
        }
      }
    }
    return null;
  }

  getRenderer(): GraphRenderer | null {
    return this.renderer;
  }

  private patchRenderer(renderer: GraphRenderer): void {
    this.renderer = renderer;

    // Patch renderCallback — this is called every frame while graph is active
    const self = this;
    const uninstall = around(renderer, {
      renderCallback: (next: Function) =>
        function (this: any, ...args: any[]) {
          const result = next.call(this, ...args);
          // After Obsidian's render: suppress circles, scale icons
          if (self.iconsReady && self.renderer) {
            self.iconRenderer.onFrame(self.renderer);
          }
          return result;
        },
    });
    this.uninstallers.push(uninstall);
    this.patched = true;
    console.log('[Enhanced Graph] Renderer patched');

    // Load icons asynchronously
    this.patchWithIcons(renderer);
  }

  private async patchWithIcons(renderer: GraphRenderer): Promise<void> {
    await this.iconicResolver.loadIconicData();

    // Wait for nodes to have their PIXI graphics
    await new Promise<void>((resolve) => {
      const check = () => {
        if (renderer.nodes.length > 0 && renderer.nodes[0].circle) {
          resolve();
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    });

    // Init icon renderer (extracts Graphics constructor)
    if (!this.iconRenderer.init(renderer)) {
      console.error('[Enhanced Graph] Failed to init icon renderer');
      return;
    }

    // Apply icons to existing nodes
    this.applyIconsToAllNodes(renderer);
    this.iconsReady = true;

    // Patch setData to re-apply icons when graph data refreshes
    const self = this;
    const uninstall = around(renderer as any, {
      setData: (next: Function) =>
        function (this: any, data: any) {
          const result = next.call(this, data);
          // Wait for new nodes to get graphics, then re-apply
          requestAnimationFrame(() => {
            self.applyIconsToAllNodes(self.renderer!);
          });
          return result;
        },
    });
    this.uninstallers.push(uninstall);
  }

  private applyIconsToAllNodes(renderer: GraphRenderer): void {
    let matched = 0;
    const total = renderer.nodes.length;
    for (const node of renderer.nodes) {
      // Skip if node doesn't have graphics yet
      if (!node.circle) continue;

      this.iconRenderer.clearNodeIcon(node);
      const resolved = this.iconicResolver.resolveIcon(node.id);
      if (resolved) {
        matched++;
        this.iconRenderer.applyIconToNode(node, resolved.icon, resolved.color);
      }
    }
    console.log(
      `[Enhanced Graph] Icons: ${matched}/${total} nodes matched.`,
      total > 0 ? `Sample node.id: "${renderer.nodes[0].id}"` : ''
    );
  }

  private unpatch(): void {
    this.iconsReady = false;
    if (this.renderer) {
      for (const node of this.renderer.nodes) {
        this.iconRenderer.clearNodeIcon(node);
      }
    }
    this.uninstallers.forEach((fn) => fn());
    this.uninstallers = [];
    this.renderer = null;
    this.patched = false;
    console.log('[Enhanced Graph] Renderer unpatched');
  }

  destroy(): void {
    this.unpatch();
    this.iconRenderer.destroy();
  }
}
