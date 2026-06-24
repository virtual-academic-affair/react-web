/**
 * Application routes
 * Used by the Sidebar to render navigation links.
 */

import { MdContactPage, MdDescription, MdSettings } from "react-icons/md";
import { SiGmail } from "react-icons/si";

const routes: RoutesType[] = [
  {
    name: "Dashboard",
    layout: "/admin",
    path: "email/config",
    icon: <SiGmail className="h-6 w-6" />,
  },
  {
    name: "Hồ sơ SV",
    layout: "/admin",
    path: "student-records",
    icon: <MdContactPage className="h-6 w-6" />,
    children: [
      {
        name: "Thống kê đăng kí lớp",
        layout: "/admin",
        path: "class-registration/statistics",
      },
      {
        name: "Thống kê thắc mắc",
        layout: "/admin",
        path: "inquiry/statistics",
      },
      {
        name: "DS Sinh viên",
        layout: "/admin",
        path: "auth/students",
      },
    ],
  },
  {
    name: "Tài liệu",
    layout: "/admin",
    path: "documents",
    icon: <MdDescription className="h-6 w-6" />,
    children: [
      {
        name: "DS tài liệu",
        layout: "/admin",
        path: "documents/list",
      },
      {
        name: "DS biểu mẫu, KTT",
        layout: "/admin",
        path: "documents/forms",
      },
      {
        name: "Câu hỏi",
        layout: "/admin",
        path: "documents/questions",
        children: [
          {
            name: "DS câu hỏi",
            layout: "/admin",
            path: "documents/faqs",
          },
          {
            name: "Câu hỏi tổng hợp",
            layout: "/admin",
            path: "documents/candidates",
          },
        ],
      },
    ],
  },
  {
    name: "Quản trị",
    layout: "/admin",
    path: "admin-ops",
    icon: <MdSettings className="h-6 w-6" />,
    children: [
      {
        name: "DS tài khoản",
        layout: "/admin",
        path: "auth/accounts",
      },
    ],
  },
];

export default routes;
