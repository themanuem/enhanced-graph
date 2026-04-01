import { App, TFile } from 'obsidian';

interface IconicRule {
  name: string;
  conditions: Array<{
    source: string;
    operator: string;
    value: string;
  }>;
  enabled: boolean;
  icon: string;
  color?: string;
}

interface IconicData {
  fileRules: IconicRule[];
  fileIcons: Record<string, { icon: string; color?: string }>;
}

export interface ResolvedIcon {
  icon: string; // e.g., "lucide-square-star"
  color?: string; // e.g., "blue"
}

export class IconicResolver {
  private app: App;
  private data: IconicData | null = null;

  constructor(app: App) {
    this.app = app;
  }

  async loadIconicData(): Promise<void> {
    try {
      const path = '.obsidian/plugins/iconic/data.json';
      const adapter = this.app.vault.adapter;
      if (await adapter.exists(path)) {
        const content = await adapter.read(path);
        this.data = JSON.parse(content);
        console.log(
          `[Enhanced Graph] Loaded Iconic data: ${this.data?.fileRules?.length ?? 0} rules`
        );
      } else {
        console.warn('[Enhanced Graph] Iconic data.json not found');
      }
    } catch (e) {
      console.error('[Enhanced Graph] Failed to load Iconic data:', e);
    }
  }

  resolveIcon(nodeId: string): ResolvedIcon | null {
    if (!this.data) return null;

    // Check direct file overrides first
    if (this.data.fileIcons) {
      for (const [path, iconData] of Object.entries(this.data.fileIcons)) {
        if (this.matchesNodeId(path, nodeId)) {
          return iconData;
        }
      }
    }

    // Get file tags from metadata cache
    const file = this.findFileByNodeId(nodeId);
    if (!file) return null;

    const cache = this.app.metadataCache.getFileCache(file);
    const tags = this.extractTags(cache);

    // Evaluate rules in order (first match wins)
    for (const rule of this.data.fileRules) {
      if (!rule.enabled) continue;
      if (this.matchesRule(rule, tags, file)) {
        return { icon: rule.icon, color: rule.color };
      }
    }

    return null;
  }

  private matchesRule(
    rule: IconicRule,
    tags: string[],
    file: TFile
  ): boolean {
    return rule.conditions.every((cond) => {
      if (cond.source === 'tags') {
        if (cond.operator === 'anyContain') {
          return tags.some((t) => t.includes(cond.value));
        }
        if (cond.operator === 'includes') {
          return tags.includes(cond.value);
        }
      }
      if (cond.source === 'extension' && cond.operator === 'is') {
        return file.extension === cond.value;
      }
      return false;
    });
  }

  private findFileByNodeId(nodeId: string): TFile | null {
    // node.id in graph is the full vault path (e.g., "02_Notes/Celonis.md")
    const file = this.app.vault.getAbstractFileByPath(nodeId);
    if (file instanceof TFile) return file;
    // Fallback: try with .md extension
    const withMd = this.app.vault.getAbstractFileByPath(nodeId + '.md');
    if (withMd instanceof TFile) return withMd;
    return null;
  }

  private matchesNodeId(path: string, nodeId: string): boolean {
    // Compare full paths, or basename if nodeId has no path separator
    if (path === nodeId) return true;
    if (nodeId.includes('/')) return false;
    const basename = path.replace(/\.md$/, '').split('/').pop();
    return basename === nodeId;
  }

  private extractTags(cache: any): string[] {
    if (!cache) return [];
    const tags: string[] = [];
    // Frontmatter tags
    if (cache.frontmatter?.tags) {
      const fmTags = Array.isArray(cache.frontmatter.tags)
        ? cache.frontmatter.tags
        : [cache.frontmatter.tags];
      tags.push(...fmTags.map((t: string) => t.replace(/^#/, '')));
    }
    // Inline tags
    if (cache.tags) {
      tags.push(...cache.tags.map((t: any) => t.tag.replace(/^#/, '')));
    }
    return tags;
  }
}
