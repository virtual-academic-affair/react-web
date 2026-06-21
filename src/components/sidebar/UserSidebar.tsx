import Tooltip from "@/components/tooltip/Tooltip";
import userRoutes from "@/userRoutes";
import { Link, useLocation } from "react-router-dom";
import SidebarShell from "./components/SidebarShell";

interface UserSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onShowChatbotPanel?: () => void;
  onNavigateStart?: () => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
  onShowChatbotPanel,
  onNavigateStart,
}) => {
  const location = useLocation();

  const routeHref = (route: RoutesType) =>
    `${route.layout}/${route.path}`.replace(/\/+/g, "/");

  const isActive = (route: RoutesType) => {
    const href = routeHref(route);
    return (
      location.pathname === href || location.pathname.startsWith(`${href}/`)
    );
  };

  return (
    <SidebarShell
      open={open}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
    >
      {userRoutes.map((route, index) => {
        const active = isActive(route);
        const isChatbotRoute = route.path === "chatbot";
        const navItem = (
          <div className="mb-4 flex hover:cursor-pointer">
            <li
              className={`my-0.75 flex cursor-pointer items-center py-0.5 ${
                collapsed ? "w-full justify-center px-0" : "px-4"
              }`}
            >
              <span
                className={`inline-flex shrink-0 [&>svg]:h-5 [&>svg]:w-5 ${
                  active
                    ? "text-brand-500 dark:text-white"
                    : "font-medium text-gray-600"
                }`}
              >
                {route.icon}
              </span>
              {!collapsed && (
                <p
                  className={`ml-4 flex text-base leading-1 font-medium ${
                    active ? "text-navy-700 dark:text-white" : "text-gray-600"
                  }`}
                >
                  {route.name}
                </p>
              )}
            </li>
          </div>
        );

        return (
          <Link
            key={index}
            to={routeHref(route)}
            onClick={(event) => {
              if (!active || !isChatbotRoute || !onShowChatbotPanel) {
                if (!active) onNavigateStart?.();
                onClose();
                return;
              }
              event.preventDefault();
              onShowChatbotPanel();
            }}
          >
            {collapsed ? (
              <Tooltip label={route.name} className="block w-full">
                {navItem}
              </Tooltip>
            ) : (
              navItem
            )}
          </Link>
        );
      })}
    </SidebarShell>
  );
};

export default UserSidebar;
