/**
 * Application routes
 * Used by the Sidebar to render navigation links.
 */

import { MdAdminPanelSettings } from "react-icons/md";

const routes: RoutesType[] = [
  {
    name: "Admin",
    layout: "/admin",
    path: "dashboard",
    icon: <MdAdminPanelSettings className="h-6 w-6" />,
  },
];

export default routes;
