/* eslint-disable */
import DashIcon from "@/components/icons/DashIcon";
import Tooltip from "@/components/tooltip/Tooltip.tsx";
import { useEffect, useState, type JSX } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
// chakra imports

export const SidebarLinks = (props: {
  routes: RoutesType[];
  collapsed?: boolean;
}): JSX.Element => {
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const { routes, collapsed = false } = props;

  /** Recursively finds the href of the first child with a non-empty path. */
  const firstChildHref = (route: RoutesType): string | null => {
    if (!route.children?.length) return null;
    for (const child of route.children) {
      if (child.children?.length) {
        const deep = firstChildHref(child);
        if (deep) return deep;
      } else if (child.path) {
        return `${child.layout}/${child.path}`.replace(/\/+/g, "/");
      }
    }
    return null;
  };

  const routeHref = (route: RoutesType) =>
    `${route.layout}/${route.path}`.replace(/\/+/g, "/");

  const isRouteActive = (route: RoutesType) => {
    const href = routeHref(route);
    if (!route.path) {
      return location.pathname.startsWith(route.layout);
    }
    return (
      location.pathname === href || location.pathname.startsWith(`${href}/`)
    );
  };

  const isParentActive = (route: RoutesType) => {
    if (route.children?.length) {
      return route.children.some((child) => {
        if (child.children?.length) {
          return child.children.some((grandchild) => isRouteActive(grandchild));
        }
        return isRouteActive(child);
      });
    }
    return isRouteActive(route);
  };

  // When collapsed→expanded, re-open the group that contains the active route.
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      routes.forEach((route, index) => {
        if (!route.children?.length) {
          return;
        }
        const key = `${route.path || route.name}-${index}`;
        const active = isParentActive(route);
        if (active) {
          next[key] = true;
        } else if (!(key in next)) {
          next[key] = false;
        }

        // Check children for level 3
        route.children.forEach((child, childIndex) => {
          if (child.children?.length) {
            const childKey = `${child.path || child.name}-${index}-${childIndex}`;
            const childActive = child.children.some((grandchild) =>
              isRouteActive(grandchild),
            );
            if (childActive) {
              next[childKey] = true;
            } else if (!(childKey in next)) {
              next[childKey] = false;
            }
          }
        });
      });
      return next;
    });
  }, [location.pathname, routes, collapsed]);

  const createLinks = (routes: RoutesType[]) => {
    return routes.map((route, index) => {
      if (
        route.layout === "/admin" ||
        route.layout === "/auth" ||
        route.layout === "/rtl"
      ) {
        const parentActive = isParentActive(route);

        if (route.children?.length) {
          const groupKey = `${route.path || route.name}-${index}`;
          const isOpen = openGroups[groupKey] ?? parentActive;
          return (
            <li key={index} className="mb-4">
              {collapsed ? (
                <Tooltip label={route.name} className="block w-full">
                  <button
                    type="button"
                    onClick={() => {
                      const href = firstChildHref(route);
                      if (href) navigate(href);
                    }}
                    className="my-0.75 flex w-full items-center justify-center py-0.5"
                  >
                    <span
                      className={`inline-flex shrink-0 [&>svg]:h-5 [&>svg]:w-5 ${
                        parentActive
                          ? "text-brand-500 dark:text-white"
                          : "font-medium text-gray-600"
                      }`}
                    >
                      {route.icon ? route.icon : <DashIcon />}
                    </span>
                  </button>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (parentActive && isOpen) return;
                    setOpenGroups((prev) => ({ ...prev, [groupKey]: !isOpen }));
                  }}
                  className="my-0.75 flex w-full items-center px-4 py-0.5 text-left"
                >
                  <span
                    className={`inline-flex shrink-0 [&>svg]:h-5 [&>svg]:w-5 ${
                      parentActive
                        ? "text-brand-500 dark:text-white"
                        : "font-medium text-gray-600"
                    }`}
                  >
                    {route.icon ? route.icon : <DashIcon />}
                  </span>
                  <p
                    className={`ml-4 flex text-base leading-1 font-medium ${
                      parentActive
                        ? "text-navy-700 dark:text-white"
                        : "font-medium text-gray-600"
                    }`}
                  >
                    {route.name}
                  </p>
                  <span
                    className={`ml-auto text-gray-500 transition-transform duration-200 ease-in-out dark:text-gray-300 ${
                      isOpen ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <MdKeyboardArrowDown className="h-5 w-5" />
                  </span>
                </button>
              )}

              <ul
                className={`mt-1.5 ml-12 flex flex-col overflow-hidden transition-all duration-200 ease-in-out ${
                  !collapsed && isOpen
                    ? "mt-1 max-h-80 gap-1 opacity-100"
                    : "mt-0 max-h-0 gap-0 opacity-0"
                }`}
              >
                {route.children.map((child, childIndex) => {
                  const childActive = isRouteActive(child);
                  const hasChildren =
                    child.children && child.children.length > 0;
                  const childGroupKey = `${child.path || child.name}-${index}-${childIndex}`;
                  const isChildOpen = openGroups[childGroupKey] ?? childActive;

                  if (hasChildren) {
                    const isChildParentActive = child.children!.some(
                      (grandchild) => isRouteActive(grandchild),
                    );
                    return (
                      <li key={`${index}-${childIndex}`} className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            if (isChildParentActive && isChildOpen) return;
                            setOpenGroups((prev) => ({
                              ...prev,
                              [childGroupKey]: !isChildOpen,
                            }));
                          }}
                          className="my-0.75 flex w-full items-center px-1 py-0.5 pr-5 text-left"
                        >
                          <p
                            className={`flex text-sm font-medium transition-colors ${
                              isChildParentActive
                                ? "text-navy-700 dark:text-white"
                                : "text-gray-600 dark:text-gray-300"
                            }`}
                          >
                            {child.name}
                          </p>
                          <span
                            className={`ml-auto text-gray-500 transition-transform duration-200 ease-in-out dark:text-gray-300 ${
                              isChildOpen ? "rotate-180" : "rotate-0"
                            }`}
                          >
                            <MdKeyboardArrowDown className="h-5 w-5" />
                          </span>
                        </button>

                        <ul
                          className={`ml-1 flex flex-col overflow-hidden transition-all duration-200 ease-in-out ${
                            isChildOpen
                              ? "mt-1 max-h-80 gap-1 opacity-100"
                              : "mt-0 max-h-0 gap-0 opacity-0"
                          }`}
                        >
                          {child.children!.map(
                            (grandchild, grandchildIndex) => {
                              const grandchildActive =
                                isRouteActive(grandchild);
                              return (
                                <li
                                  key={`${index}-${childIndex}-${grandchildIndex}`}
                                  className="relative"
                                >
                                  <Link
                                    to={routeHref(grandchild)}
                                    className={`mt-1 flex items-center gap-2 rounded-lg py-0.5 text-sm transition-colors ${
                                      grandchildActive
                                        ? "text-navy-700 dark:text-white"
                                        : "text-gray-600 dark:text-gray-300"
                                    }`}
                                  >
                                    <span
                                      className={`bg-brand-500 dark:bg-brand-400 h-1.5 w-1.5 shrink-0 rounded-full`}
                                    />
                                    <span className="font-normal">
                                      {grandchild.name}
                                    </span>
                                  </Link>
                                </li>
                              );
                            },
                          )}
                        </ul>
                      </li>
                    );
                  }

                  return (
                    <li key={`${index}-${childIndex}`} className="relative">
                      <Link
                        to={routeHref(child)}
                        className={`mt-1 ml-1 block rounded-lg py-0.5 text-sm font-medium transition-colors ${
                          childActive
                            ? "text-navy-700 dark:text-white"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {child.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        }

        const active = isRouteActive(route);
        const iconNode = (
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
                {route.icon ? route.icon : <DashIcon />}
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
          <Link key={index} to={routeHref(route)}>
            {collapsed ? (
              <Tooltip label={route.name} className="block w-full">
                {iconNode}
              </Tooltip>
            ) : (
              iconNode
            )}
          </Link>
        );
      }
    });
  };
  // BRAND
  return <>{createLinks(routes)}</>;
};

export default SidebarLinks;
