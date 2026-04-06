/**
 * Application routes
 * Used by the Sidebar to render navigation links.
 */

import {
  MdDashboard,
  MdDescription,
  MdQuestionAnswer,
  MdSchool,
  MdSettings,
} from "react-icons/md";
import { SiGmail } from "react-icons/si";

const routes: RoutesType[] = [
  {
    name: "Dashboard",
    layout: "/admin",
    path: "email/config",
    icon: <SiGmail className="h-6 w-6" />,
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
        name: "Ghi chú nhanh",
        layout: "/admin",
        path: "",
        children: [
          {
            name: "DS ghi chú nhanh",
            layout: "/admin",
            path: "class-registration/cancel-reasons/index",
          },
          {
            name: "Tạo ghi chú nhanh",
            layout: "/admin",
            path: "class-registration/cancel-reasons/create",
          },
        ],
      },
    ],
  },
  {
    name: "Công tác",
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
        name: "DS công tác",
        layout: "/admin",
        path: "tasks/list",
      },
      {
        name: "Tạo công tác",
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
        name: "Tải lên tài liệu",
        layout: "/admin",
        path: "documents/create",
      },
      {
        name: "Quản lý nhãn tài liệu",
        layout: "/admin",
        path: "",
        children: [
          {
            name: "DS nhãn tài liệu",
            layout: "/admin",
            path: "documents/metadata/index",
          },
          {
            name: "Tạo nhãn tài liệu",
            layout: "/admin",
            path: "documents/metadata/create",
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
        name: "DS tin nhắn",
        layout: "/admin",
        path: "email/messages",
      },
      {
        name: "DS tài khoản",
        layout: "/admin",
        path: "auth/accounts",
      },
      {
        name: "Phân quyền mới",
        layout: "/admin",
        path: "auth/assign-role",
      },
    ],
  },
];

export default routes;
