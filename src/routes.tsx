/**
 * Application routes
 * Used by the Sidebar to render navigation links.
 */

import { MdDashboard, MdPerson, MdQuestionAnswer, MdSchool } from "react-icons/md";
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
  {
    name: "Đăng kí lớp",
    layout: "/admin",
    path: "/class-registration",
    icon: <MdSchool className="h-6 w-6" />,
    children: [
      {
        name: "Thống kê",
        layout: "/admin",
        path: "class-registration/statistics",
      },
      {
        name: "DS đăng kí lớp",
        layout: "/admin",
        path: "class-registration/registrations",
      },
      {
        name: "Tạo đăng ký lớp",
        layout: "/admin",
        path: "class-registration/create",
      },
      {
        name: "Lý do hủy",
        layout: "/admin",
        path: "",
        children: [
          {
            name: "DS lý do hủy",
            layout: "/admin",
            path: "class-registration/cancel-reasons/index",
          },
          {
            name: "Tạo lý do hủy",
            layout: "/admin",
            path: "class-registration/cancel-reasons/create",
          },
        ],
      },
    ],
  },
  {
    name: "Công việc",
    layout: "/admin",
    path: "/tasks",
    icon: <MdDashboard className="h-6 w-6" />,
    children: [
      {
        name: "Thống kê",
        layout: "/admin",
        path: "tasks/statistics",
      },
      {
        name: "DS công việc",
        layout: "/admin",
        path: "tasks/list",
      },
      {
        name: "Tạo công việc",
        layout: "/admin",
        path: "tasks/create",
      },
    ],
  },
  {
    name: "Thắc mắc",
    layout: "/admin",
    path: "/inquiry",
    icon: <MdQuestionAnswer className="h-6 w-6" />,
    children: [
      {
        name: "Thống kê",
        layout: "/admin",
        path: "inquiry/statistics",
      },
      {
        name: "DS thắc mắc",
        layout: "/admin",
        path: "inquiry/inquiries",
      },
      {
        name: "Tạo thắc mắc",
        layout: "/admin",
        path: "inquiry/create",
      },
    ],
  },
];

export default routes;
