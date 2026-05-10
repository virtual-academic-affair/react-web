/**
 * User-facing routes.
 * Used by the UserSidebar to render navigation links.
 */

import { MdArticle, MdDescription, MdSmartToy } from "react-icons/md";

const userRoutes: RoutesType[] = [
  {
    name: "Tài liệu",
    layout: "/user",
    path: "documents",
    icon: <MdDescription className="h-6 w-6" />,
  },
  {
    name: "Biểu mẫu",
    layout: "/user",
    path: "forms",
    icon: <MdArticle className="h-6 w-6" />,
  },
  {
    name: "Chatbot",
    layout: "/user",
    path: "chatbot",
    icon: <MdSmartToy className="h-6 w-6" />,
  },
];

export default userRoutes;
