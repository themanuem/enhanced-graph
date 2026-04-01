// Minimal type declarations for Obsidian graph internals
// Based on obsidian-typings (unofficial)

export interface GraphRenderer {
  px: any; // PIXI.Application
  hanger: any; // PIXI.Container
  nodes: GraphNode[];
  links: GraphLink[];
  nodeLookup: Record<string, GraphNode>;
  panX: number;
  panY: number;
  scale: number;
  nodeScale: number;
  iframeEl: HTMLIFrameElement;
  interactiveEl: HTMLCanvasElement;
  containerEl: HTMLDivElement;
  idleFrames: number;
  highlightNode: GraphNode | null;
  renderCallback(): void;
  changed(): void;
}

export interface GraphNode {
  id: string;
  type: string;
  x: number;
  y: number;
  circle: any | null; // PIXI.Graphics
  text: any | null; // PIXI.Text
  highlight: any | null; // PIXI.Graphics
  color: { a: number; rgb: number };
  renderer: GraphRenderer;
  initGraphics(): void;
  clearGraphics(): void;
  render(): void;
  getSize(): number;
  getDisplayText(): string;
  // Enhanced Graph additions
  _enhancedGraphSprite?: any;
  _enhancedGraphSelectionRing?: any;
}

export interface GraphLink {
  source: GraphNode;
  target: GraphNode;
  line: any | null; // PIXI.Sprite
  arrow: any | null; // PIXI.Graphics
  px: any | null; // PIXI.Container
  rendered: boolean;
  renderer: GraphRenderer;
  initGraphics(): void;
  clearGraphics(): void;
  render(): void;
}

export interface GraphEngine {
  app: any;
  renderer: GraphRenderer;
  controlsEl: HTMLDivElement;
  options: any;
}
