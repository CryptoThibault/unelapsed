const paths = {
  food: '<path d="M4 3v5a2 2 0 0 0 4 0V3M6 3v18M16 3v18M16 3c4 3 5 7 0 9"/>',
  dispenser: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M10 15h4v3h-4z"/>',
  home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7"/>',
  helmet: '<path d="M4 15v-2a8 8 0 0 1 16 0v2M9 5v6M15 5v6"/><rect x="2" y="15" width="20" height="4" rx="1"/>',
  tools: '<path d="m14 6 4 4M5 19l8-8M14 6l3-3 4 4-3 3M4 15l5 5M3 21l2-2M3 4l4 1 1 3 12 12M4 3l-1 4 3 2"/>',
  outfit: '<path d="m8 3 4 3 4-3 5 5-3 3-2-2v12H8V9l-2 2-3-3zM12 6v15M9 4l3 6 3-6"/>',
  certificate: '<path d="M14 21H4V3h16v10M8 7h8M8 11h5"/><circle cx="17" cy="16" r="3"/><path d="m15 18-1 4 3-1 3 1-1-4"/>',
} as const;

export function inventoryIcon(name: keyof typeof paths): string {
  return `<svg class="inventory-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
}
