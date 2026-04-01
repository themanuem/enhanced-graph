import type { GraphNode, GraphRenderer } from './types';

// Iconic named colors → hex (as numbers for PIXI)
const ICONIC_COLORS: Record<string, number> = {
  blue: 0x60a5fa,
  red: 0xf87171,
  orange: 0xfb923c,
  yellow: 0xfbbf24,
  purple: 0xc084fc,
  pink: 0xf472b6,
  gray: 0xa1a1aa,
};

const DEFAULT_COLOR = 0xa1a1aa;

/**
 * Map specific Lucide icon names to shape drawing functions.
 * Each function draws at unit size centered on (0,0).
 */
type ShapeDrawer = (g: any, color: number) => void;

const ICON_SHAPES: Record<string, ShapeDrawer> = {
  // Square-based icons
  'lucide-square-star': (g, c) => {
    drawSquare(g, c);
    // Inner star
    g.lineStyle(0);
    g.beginFill(c, 0.6);
    drawStarPath(g, 0.35, 0.17);
    g.endFill();
  },
  'lucide-square-sigma': (g, c) => {
    drawSquare(g, c);
    g.lineStyle(0.1, c, 0.9);
    const r = 0.35;
    g.moveTo(r, -r); g.lineTo(-r, -r); g.lineTo(0, 0);
    g.lineTo(-r, r); g.lineTo(r, r);
  },
  'lucide-square-check': (g, c) => {
    drawSquare(g, c);
    g.lineStyle(0.12, c, 0.9);
    g.moveTo(-0.35, 0); g.lineTo(-0.1, 0.3); g.lineTo(0.4, -0.25);
  },
  'lucide-square-plus': (g, c) => {
    drawSquare(g, c);
    g.lineStyle(0.1, c, 0.9);
    g.moveTo(0, -0.35); g.lineTo(0, 0.35);
    g.moveTo(-0.35, 0); g.lineTo(0.35, 0);
  },
  'lucide-square-user': (g, c) => {
    drawSquare(g, c);
    g.lineStyle(0);
    g.beginFill(c, 0.5);
    g.drawCircle(0, -0.2, 0.18);
    g.endFill();
    g.lineStyle(0.1, c, 0.7);
    g.moveTo(-0.3, 0.5);
    g.quadraticCurveTo(0, 0.15, 0.3, 0.5);
  },
  'lucide-square-pen': (g, c) => {
    drawSquare(g, c);
    g.lineStyle(0.1, c, 0.9);
    // Pen diagonal
    g.moveTo(-0.35, 0.35); g.lineTo(0.25, -0.25);
    g.moveTo(0.15, -0.35); g.lineTo(0.35, -0.15);
  },
  'lucide-gantt-chart-square': (g, c) => {
    drawSquare(g, c);
    g.lineStyle(0.1, c, 0.9);
    // Gantt bars
    g.moveTo(-0.4, -0.25); g.lineTo(0.1, -0.25);
    g.moveTo(-0.2, 0);     g.lineTo(0.3, 0);
    g.moveTo(-0.1, 0.25);  g.lineTo(0.4, 0.25);
  },

  // Non-square icons — distinctive shapes
  'lucide-flask-conical': (g, c) => {
    g.lineStyle(0.15, c, 1);
    g.beginFill(c, 0.25);
    // Flask shape: narrow top, wide bottom
    g.moveTo(-0.15, -0.8);
    g.lineTo(-0.15, -0.2);
    g.lineTo(-0.7, 0.7);
    g.lineTo(0.7, 0.7);
    g.lineTo(0.15, -0.2);
    g.lineTo(0.15, -0.8);
    g.closePath();
    g.endFill();
  },
  'lucide-git-branch': (g, c) => {
    g.lineStyle(0.15, c, 1);
    g.beginFill(c, 0.15);
    // Branch: vertical line with fork
    g.drawCircle(0, -0.55, 0.18);
    g.drawCircle(0, 0.55, 0.18);
    g.drawCircle(0.4, -0.2, 0.18);
    g.endFill();
    g.moveTo(0, -0.37); g.lineTo(0, 0.37);
    g.moveTo(0.4, -0.02); g.quadraticCurveTo(0.4, 0.3, 0, 0.37);
  },
  'lucide-briefcase-business': (g, c) => {
    g.lineStyle(0.15, c, 1);
    g.beginFill(c, 0.25);
    // Briefcase
    g.drawRoundedRect(-0.8, -0.4, 1.6, 1.1, 0.1);
    g.endFill();
    // Handle
    g.lineStyle(0.12, c, 0.8);
    g.moveTo(-0.25, -0.4); g.lineTo(-0.25, -0.65);
    g.lineTo(0.25, -0.65); g.lineTo(0.25, -0.4);
    // Clasp line
    g.moveTo(-0.8, 0); g.lineTo(0.8, 0);
  },
  'lucide-handshake': (g, c) => {
    g.lineStyle(0.15, c, 1);
    g.beginFill(c, 0.2);
    // Two overlapping rounded shapes
    g.drawEllipse(-0.2, 0, 0.6, 0.45);
    g.drawEllipse(0.2, 0, 0.6, 0.45);
    g.endFill();
    // Handshake detail
    g.lineStyle(0.1, c, 0.8);
    g.moveTo(-0.3, 0); g.lineTo(0.3, 0);
  },
  'lucide-box': (g, c) => {
    g.lineStyle(0.15, c, 1);
    g.beginFill(c, 0.2);
    // 3D box front
    g.moveTo(0, -0.8);
    g.lineTo(0.75, -0.35);
    g.lineTo(0.75, 0.45);
    g.lineTo(0, 0.8);
    g.lineTo(-0.75, 0.45);
    g.lineTo(-0.75, -0.35);
    g.closePath();
    g.endFill();
    // Inner edges
    g.lineStyle(0.08, c, 0.6);
    g.moveTo(0, -0.8); g.lineTo(0, 0.8);
    g.moveTo(-0.75, -0.35); g.lineTo(0, 0.1);
    g.lineTo(0.75, -0.35);
  },
  'lucide-settings': (g, c) => {
    g.lineStyle(0.15, c, 1);
    g.beginFill(c, 0.15);
    // Gear: outer with teeth
    for (let i = 0; i < 8; i++) {
      const a1 = (Math.PI / 4) * i - Math.PI / 8;
      const a2 = (Math.PI / 4) * i + Math.PI / 8;
      const outerR = 0.85;
      const innerR = 0.6;
      if (i === 0) g.moveTo(outerR * Math.cos(a1), outerR * Math.sin(a1));
      g.lineTo(outerR * Math.cos(a2), outerR * Math.sin(a2));
      const nextA1 = (Math.PI / 4) * (i + 1) - Math.PI / 8;
      g.lineTo(innerR * Math.cos(a2), innerR * Math.sin(a2));
      g.lineTo(innerR * Math.cos(nextA1), innerR * Math.sin(nextA1));
      g.lineTo(outerR * Math.cos(nextA1), outerR * Math.sin(nextA1));
    }
    g.closePath();
    g.endFill();
    // Center hole
    g.lineStyle(0.1, c, 0.8);
    g.drawCircle(0, 0, 0.25);
  },
  'lucide-info': (g, c) => {
    g.lineStyle(0.15, c, 1);
    g.beginFill(c, 0.2);
    g.drawCircle(0, 0, 0.8);
    g.endFill();
    // "i" letter
    g.lineStyle(0.12, c, 0.9);
    g.drawCircle(0, -0.35, 0.08);
    g.moveTo(0, -0.15); g.lineTo(0, 0.45);
  },
  'lucide-circuit-board': (g, c) => {
    g.lineStyle(0.15, c, 1);
    g.beginFill(c, 0.2);
    g.drawRoundedRect(-0.8, -0.8, 1.6, 1.6, 0.1);
    g.endFill();
    // Circuit traces
    g.lineStyle(0.08, c, 0.7);
    g.drawCircle(-0.3, -0.3, 0.12);
    g.drawCircle(0.3, 0.3, 0.12);
    g.moveTo(-0.3, -0.18); g.lineTo(-0.3, 0.3); g.lineTo(0.18, 0.3);
    g.moveTo(0.3, -0.3); g.lineTo(0.3, 0);
  },
  'lucide-calendar-range': (g, c) => {
    g.lineStyle(0.15, c, 1);
    g.beginFill(c, 0.2);
    g.drawRoundedRect(-0.8, -0.6, 1.6, 1.35, 0.1);
    g.endFill();
    // Top tabs
    g.lineStyle(0.12, c, 0.9);
    g.moveTo(-0.35, -0.75); g.lineTo(-0.35, -0.45);
    g.moveTo(0.35, -0.75); g.lineTo(0.35, -0.45);
    // Header line
    g.moveTo(-0.8, -0.25); g.lineTo(0.8, -0.25);
    // Date dots
    g.lineStyle(0);
    g.beginFill(c, 0.6);
    g.drawCircle(-0.35, 0.1, 0.1);
    g.drawCircle(0, 0.1, 0.1);
    g.drawCircle(0.35, 0.1, 0.1);
    g.endFill();
  },
};

function drawSquare(g: any, color: number): void {
  g.lineStyle(0.15, color, 1);
  g.beginFill(color, 0.25);
  g.drawRoundedRect(-0.8, -0.8, 1.6, 1.6, 0.15);
  g.endFill();
}

function drawStarPath(g: any, outer: number, inner: number): void {
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    i === 0
      ? g.moveTo(r * Math.cos(angle), r * Math.sin(angle))
      : g.lineTo(r * Math.cos(angle), r * Math.sin(angle));
  }
  g.closePath();
}

export class IconRenderer {
  private GraphicsClass: any = null;
  private hanger: any = null;

  init(renderer: GraphRenderer): boolean {
    const node = renderer.nodes?.[0];
    if (!node?.circle) return false;

    this.GraphicsClass = node.circle.constructor;
    this.hanger = renderer.hanger;
    console.log('[Enhanced Graph] PIXI Graphics class extracted');
    return true;
  }

  applyIconToNode(node: GraphNode, iconName: string, color?: string): void {
    if (!this.GraphicsClass || !this.hanger) return;

    this.clearNodeIcon(node);

    const colorHex: number = (color ? ICONIC_COLORS[color] : undefined) ?? DEFAULT_COLOR;
    const icon = new this.GraphicsClass();

    // Look up specific icon drawer, fallback to generic shape
    const drawer = ICON_SHAPES[iconName];
    if (drawer) {
      drawer(icon, colorHex);
    } else {
      // Generic fallback based on name patterns
      this.drawGenericIcon(icon, iconName, colorHex);
    }

    this.hanger.addChild(icon);
    node._enhancedGraphSprite = icon;
  }

  /**
   * Called every frame AFTER Obsidian's render.
   */
  onFrame(renderer: GraphRenderer): void {
    for (const node of renderer.nodes) {
      const icon = node._enhancedGraphSprite;
      if (!icon || !node.circle) continue;

      // Position icon at circle location
      icon.x = node.circle.x;
      icon.y = node.circle.y;

      // Scale to node size
      const size = typeof node.getSize === 'function'
        ? node.getSize()
        : ((node as any).weight ?? 4);
      icon.scale.set(size * 1.2);

      // Sync visibility/fade
      icon.visible = node.circle.visible;
      icon.alpha = (node as any).fadeAlpha ?? 1;

      // Hide the circle visually but keep it for hit-testing.
      // renderable=false skips WebGL draw but keeps the object
      // in the scene graph so containsPoint/interaction still works.
      node.circle.renderable = false;
    }
  }

  private drawGenericIcon(g: any, iconName: string, color: number): void {
    g.lineStyle(0.15, color, 1);
    g.beginFill(color, 0.25);

    if (iconName.includes('square')) {
      g.drawRoundedRect(-0.8, -0.8, 1.6, 1.6, 0.15);
    } else if (iconName.includes('circle')) {
      g.drawCircle(0, 0, 0.9);
    } else if (iconName.includes('diamond')) {
      g.moveTo(0, -0.85); g.lineTo(0.85, 0); g.lineTo(0, 0.85); g.lineTo(-0.85, 0);
      g.closePath();
    } else {
      // Default: hexagon (distinct from regular circle nodes)
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        i === 0
          ? g.moveTo(0.8 * Math.cos(angle), 0.8 * Math.sin(angle))
          : g.lineTo(0.8 * Math.cos(angle), 0.8 * Math.sin(angle));
      }
      g.closePath();
    }
    g.endFill();
  }

  clearNodeIcon(node: GraphNode): void {
    if (node._enhancedGraphSprite) {
      if (node._enhancedGraphSprite.parent) {
        node._enhancedGraphSprite.parent.removeChild(node._enhancedGraphSprite);
      }
      node._enhancedGraphSprite.destroy();
      node._enhancedGraphSprite = null;
      // Restore circle rendering
      if (node.circle) node.circle.renderable = true;
    }
  }

  destroy(): void {
    // Nothing to clean up with Graphics-based approach
  }
}
