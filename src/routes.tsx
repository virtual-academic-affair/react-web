/**
 * Application routes
 * Used by the Sidebar to render navigation links.
 */

import { MdPerson } from "react-icons/md";
import { SiGmail } from "react-icons/si";

const routes: RoutesType[] = [
  {
    name: "Mailbox",
    layout: "/admin",
    path: "email",
    icon: <SiGmail className="h-6 w-6" />,
    children: [
      {
        name: "Cấu hình gmail",
        layout: "/admin",
        path: "email/config",
      },
      {
        name: "DS tin nhắn",
        layout: "/admin",
        path: "email/messages",
      },
    ],
  },
  {
    name: "Tài khoản",
    layout: "/admin",
    path: "/auth",
    icon: <MdPerson className="h-6 w-6" />,
    children: [
      {
        name: "DS tài khoản",
        layout: "/admin",
        path: "auth/accounts",
      },
      {
        name: "Phân quyền mới ",
        layout: "/admin",
        path: "auth/assign-role",
      },
    ],
  },
];

export default routes;
