/**
 * Application routes
 * Used by the Sidebar to render navigation links.
 */

import { MdAdminPanelSettings, MdEmail, MdPeople } from "react-icons/md";

const routes: RoutesType[] = [
  {
    name: "Admin",
    layout: "/admin",
    path: "dashboard",
    icon: <MdAdminPanelSettings className="h-6 w-6" />,
  },
  {
    name: "Người dùng",
    layout: "/admin",
    path: "users",
    icon: <MdPeople className="h-6 w-6" />,
  },
  {
    name: "Email",
    layout: "/admin",
    path: "emails",
    icon: <MdEmail className="h-6 w-6" />,
  },
];

export default routes;
