export type FloatingPosition = {
  top?: number;
  bottom?: number;
  left: number;
  width?: number;
};

type FloatingPositionOptions = {
  gap?: number;
  viewportPadding?: number;
  width?: number;
  minWidth?: number;
  maxHeight?: number;
};

export function getFloatingDropdownPosition(
  anchorRect: DOMRect,
  {
    gap = 4,
    viewportPadding = 12,
    width,
    minWidth,
    maxHeight = 280,
  }: FloatingPositionOptions = {},
): FloatingPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const availableWidth = Math.max(0, viewportWidth - viewportPadding * 2);
  const panelWidth = Math.min(
    width ?? Math.max(minWidth ?? 0, anchorRect.width),
    availableWidth,
  );
  const maxLeft = viewportWidth - viewportPadding - panelWidth;
  const left = Math.min(
    Math.max(viewportPadding, anchorRect.left),
    Math.max(viewportPadding, maxLeft),
  );

  const spaceBelow = viewportHeight - anchorRect.bottom;
  const spaceAbove = anchorRect.top;

  if (spaceBelow < maxHeight && spaceAbove > spaceBelow) {
    return {
      bottom: viewportHeight - anchorRect.top + gap,
      left,
      width,
    };
  }

  return {
    top: anchorRect.bottom + gap,
    left,
    width,
  };
}
