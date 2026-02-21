import type { JSX } from "react";

/**
 * Route type definition used by Sidebar Links and layout components
 */
export interface RoutesType {
  name: string;
  layout: string;
  path: string;
  icon?: JSX.Element | string;
  secondary?: boolean;
}
