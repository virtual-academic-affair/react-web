/**
 * Application routes
 * Used by the Sidebar to render navigation links.
 */

import {
  MdDescription,
  MdQuestionAnswer,
  MdSchool,
  MdSettings,
  MdSmartToy,
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
    name: "Đăng ký lớp",
    layout: "/admin",
    path: "/class-registration",
    icon: <MdSchool className="h-6 w-6" />,
    children: [
      {
        name: "Thống kê",
        layout: "/admin",
        path: "class-registration/statistics",
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
        name: "DS biểu mẫu",
        layout: "/admin",
        path: "documents/forms",
      },
      {
        name: "DS câu hỏi thường gặp",
        layout: "/admin",
        path: "documents/faqs",
      },
      {
        name: "DS câu hỏi đề xuất",
        layout: "/admin",
        path: "documents/candidates",
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
    name: "Chatbot",
    layout: "/admin",
    path: "chatbot",
    icon: <MdSmartToy className="h-6 w-6" />,
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
      {
        name: "DS sinh viên",
        layout: "/admin",
        path: "auth/students",
      },
    ],
  },
];

export default routes;
