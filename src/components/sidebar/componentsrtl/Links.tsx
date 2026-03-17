/* eslint-disable */
import DashIcon from "@/components/icons/DashIcon";
import { useEffect, useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
// chakra imports

export function SidebarLinks(props: { routes: RoutesType[] }) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const { routes } = props;

  const routeHref = (route: RoutesType) =>
    `${route.layout}/${route.path}`.replace(/\/+/g, "/");

  const isRouteActive = (route: RoutesType) => {
    const href = routeHref(route);
    if (!route.path) {
      return location.pathname.startsWith(route.layout);
    }
    return location.pathname === href || location.pathname.startsWith(`${href}/`);
  };

  const isParentActive = (route: RoutesType) => {
    if (route.children?.length) {
      return route.children.some((child) => isRouteActive(child));
    }
    return isRouteActive(route);
  };

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      routes.forEach((route, index) => {
        if (!route.children?.length) return;
        const key = `${route.path || route.name}-${index}`;
        if (!(key in next)) {
          next[key] = isParentActive(route);
        }
      });
      return next;
    });
  }, [location.pathname, routes]);

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
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((prev) => ({ ...prev, [groupKey]: !isOpen }))
                }
                className="my-[3px] flex w-full items-center px-8 py-0.5 text-left"
              >
                <span
                  className={`inline-flex shrink-0 [&>svg]:h-4 [&>svg]:w-4 ${
                    parentActive
                      ? "text-brand-500 font-semibold dark:text-white"
                      : "font-medium text-gray-600"
                  }`}
                >
                  {route.icon ? route.icon : <DashIcon />}
                </span>
                <p
                  className={`ms-4 flex text-base leading-1 ${
                    parentActive
                      ? "text-navy-700 font-semibold dark:text-white"
                      : "font-medium text-gray-600"
                  }`}
                >
                  {route.name}
                </p>
                <span
                  className={`me-auto text-gray-500 transition-transform duration-200 ease-in-out dark:text-gray-300 ${
                    isOpen ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <MdKeyboardArrowDown className="h-5 w-5" />
                </span>
              </button>
              <ul
                className={`me-16 flex flex-col overflow-hidden transition-all duration-200 ease-in-out ${
                  isOpen
                    ? "mt-1 max-h-80 gap-1 opacity-100"
                    : "mt-0 max-h-0 gap-0 opacity-0"
                }`}
              >
                {route.children.map((child, childIndex) => {
                  const childActive = isRouteActive(child);
                  return (
                    <li key={`${index}-${childIndex}`}>
                      <Link
                        to={routeHref(child)}
                        className={`block rounded-lg px-2.5 py-1 text-sm transition-colors ${
                          childActive
                            ? "text-navy-700 font-semibold dark:text-white"
                            : "font-normal text-gray-600 dark:text-gray-300"
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
        return (
          <Link key={index} to={routeHref(route)}>
            <div className="relative mb-3 flex hover:cursor-pointer">
              <li className="my-[3px] flex cursor-pointer items-center px-8">
                <span
                  className={`inline-flex shrink-0 [&>svg]:h-4 [&>svg]:w-4 ${
                    active
                      ? "text-brand-500 font-semibold dark:text-white"
                      : "font-medium text-gray-600"
                  }`}
                >
                  {route.icon ? route.icon : <DashIcon />}{" "}
                </span>
                <p
                  className={`ms-4 flex text-base leading-1 ${
                    active
                      ? "text-navy-700 font-semibold dark:text-white"
                      : "font-medium text-gray-600"
                  }`}
                >
                  {route.name}
                </p>
              </li>
              {active ? (
                <div className="bg-brand-500 dark:bg-brand-400 absolute inset-e-0 top-px h-9 w-1 rounded-lg" />
              ) : null}
            </div>
          </Link>
        );
      }
    });
  };
  // BRAND
  return <>{createLinks(routes)}</>;
}

export default SidebarLinks;
