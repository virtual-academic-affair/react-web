import { useState, type JSX } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { UserMenu } from "@/components/navbar/UserMenu";

type TopNavLinksProps = {
  routes: RoutesType[];
  onNavigateStart?: () => void;
  onNavigate?: () => void;
  variant?: "horizontal" | "vertical";
  embedded?: boolean;
  includeChatbotLink?: boolean;
};

const routeHref = (route: RoutesType) =>
  `${route.layout}/${route.path}`.replace(/\/+/g, "/");

const firstChildHref = (route: RoutesType): string | null => {
  if (!route.children?.length) return null;
  for (const child of route.children) {
    if (child.children?.length) {
      const deep = firstChildHref(child);
      if (deep) return deep;
    } else if (child.path) {
      return routeHref(child);
    }
  }
  return null;
};

const getLeafRoutes = (route: RoutesType): RoutesType[] => {
  if (!route.children?.length) return [];

  const leaves: RoutesType[] = [];
  for (const child of route.children) {
    if (child.children?.length) {
      for (const grandchild of child.children) {
        if (grandchild.path) leaves.push(grandchild);
      }
    } else if (child.path) {
      leaves.push(child);
    }
  }
  return leaves;
};

const shouldShowDropdown = (route: RoutesType) =>
  getLeafRoutes(route).length > 1;

function DropdownPanel({
  route,
  groupKey,
  isRouteActive,
  onItemClick,
}: {
  route: RoutesType;
  groupKey: string;
  isRouteActive: (route: RoutesType) => boolean;
  onItemClick: (active: boolean) => void;
}) {
  const itemClass = (active: boolean) =>
    `block px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "text-brand-500 dark:text-white"
        : "text-gray-600 hover:text-brand-500 dark:text-gray-300 dark:hover:text-white"
    }`;

  const groupLabelClass = (active: boolean) =>
    `block cursor-default px-3 py-2 text-sm font-medium transition-colors ${
      active
        ? "text-brand-500 dark:text-white"
        : "text-gray-600 dark:text-gray-300"
    }`;

  const nestedItemClass = (active: boolean) =>
    `flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
      active
        ? "text-brand-500 dark:text-white"
        : "text-gray-600 hover:text-brand-500 dark:text-gray-300 dark:hover:text-white"
    }`;

  return (
    <div className="dark:bg-navy-800 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg dark:border-white/10">
      {route.children!.map((child, childIndex) => {
        if (child.children?.length) {
          const isChildParentActive = child.children.some((grandchild) =>
            isRouteActive(grandchild),
          );

          return (
            <div key={`${groupKey}-${childIndex}`}>
              <p className={groupLabelClass(isChildParentActive)}>{child.name}</p>
              <div className="ml-3 flex flex-col gap-0.5 pb-1">
                {child.children.map((grandchild, grandchildIndex) => {
                  const grandchildActive = isRouteActive(grandchild);
                  return (
                    <Link
                      key={`${groupKey}-${childIndex}-${grandchildIndex}`}
                      to={routeHref(grandchild)}
                      onClick={() => onItemClick(grandchildActive)}
                      className={nestedItemClass(grandchildActive)}
                    >
                      <span className="bg-brand-500 dark:bg-brand-400 h-1.5 w-1.5 shrink-0 rounded-full" />
                      <span className="font-normal">{grandchild.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        }

        const childActive = isRouteActive(child);
        return (
          <Link
            key={`${groupKey}-${childIndex}`}
            to={routeHref(child)}
            onClick={() => onItemClick(childActive)}
            className={itemClass(childActive)}
          >
            {child.name}
          </Link>
        );
      })}
    </div>
  );
}

export function TopNavLinks({
  routes,
  onNavigateStart,
  onNavigate,
  variant = "horizontal",
  embedded = false,
  includeChatbotLink = false,
}: TopNavLinksProps): JSX.Element {
  const location = useLocation();
  const navigate = useNavigate();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

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

  const handleNavigate = (active: boolean) => {
    if (!active) onNavigateStart?.();
    onNavigate?.();
  };

  const navigateToFirstChild = (route: RoutesType) => {
    const href = firstChildHref(route);
    if (!href) return;
    const active = isParentActive(route);
    handleNavigate(active);
    navigate(href);
  };

  const isHorizontal = variant === "horizontal";
  const containerClass = isHorizontal
    ? embedded
      ? "flex items-center gap-2 px-1"
      : "flex items-center gap-1"
    : "flex flex-col gap-1";

  const linkBaseClass = isHorizontal
    ? embedded
      ? "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors"
      : "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors"
    : "flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors";

  const activeClass = "font-medium text-brand-500 dark:text-brand-400";
  const inactiveClass =
    "font-medium text-navy-700 hover:text-brand-500 dark:text-gray-200 dark:hover:text-white";

  return (
    <div className={containerClass}>
      {routes.map((route, index) => {
        if (
          route.layout !== "/admin" &&
          route.layout !== "/auth" &&
          route.layout !== "/rtl" &&
          route.layout !== "/user"
        ) {
          return null;
        }

        const groupKey = `${route.path || route.name}-${index}`;
        const parentActive = isParentActive(route);

        if (route.children?.length) {
          const singleTarget = firstChildHref(route);
          const showDropdown = shouldShowDropdown(route);

          if (!showDropdown && singleTarget) {
            return (
              <Link
                key={groupKey}
                to={singleTarget}
                onClick={() => handleNavigate(parentActive)}
                className={`${linkBaseClass} ${
                  parentActive ? activeClass : inactiveClass
                }`}
              >
                {route.icon ? (
                  <span className="inline-flex shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                    {route.icon}
                  </span>
                ) : null}
                <span>{route.name}</span>
              </Link>
            );
          }

          if (isHorizontal) {
            const isOpen = hoveredKey === groupKey;
            return (
              <div
                key={groupKey}
                className="relative"
                onMouseEnter={() => setHoveredKey(groupKey)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <button
                  type="button"
                  onClick={() => navigateToFirstChild(route)}
                  className={`${linkBaseClass} ${
                    parentActive ? activeClass : inactiveClass
                  }`}
                >
                  {route.icon ? (
                    <span className="inline-flex shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                      {route.icon}
                    </span>
                  ) : null}
                  <span>{route.name}</span>
                </button>

                <div
                  className={`absolute top-full left-0 z-60 min-w-52 pt-3 transition-opacity duration-150 ${
                    isOpen
                      ? "pointer-events-auto visible opacity-100"
                      : "pointer-events-none invisible opacity-0"
                  }`}
                >
                  <DropdownPanel
                    route={route}
                    groupKey={groupKey}
                    isRouteActive={isRouteActive}
                    onItemClick={handleNavigate}
                  />
                </div>
              </div>
            );
          }

          return (
            <div key={groupKey} className="w-full">
              <button
                type="button"
                onClick={() => navigateToFirstChild(route)}
                className={`${linkBaseClass} w-full ${
                  parentActive ? activeClass : inactiveClass
                }`}
              >
                {route.icon ? (
                  <span className="inline-flex shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                    {route.icon}
                  </span>
                ) : null}
                <span className="flex-1 text-left">{route.name}</span>
              </button>

              <div className="mt-1 ml-3">
                <DropdownPanel
                  route={route}
                  groupKey={groupKey}
                  isRouteActive={isRouteActive}
                  onItemClick={handleNavigate}
                />
              </div>
            </div>
          );
        }

        const active = isRouteActive(route);
        return (
          <Link
            key={groupKey}
            to={routeHref(route)}
            onClick={() => handleNavigate(active)}
            className={`${linkBaseClass} ${active ? activeClass : inactiveClass}`}
          >
            {route.icon ? (
              <span className="inline-flex shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                {route.icon}
              </span>
            ) : null}
            <span>{route.name}</span>
          </Link>
        );
      })}

      {includeChatbotLink ? (
        <UserMenu
          embedded
          trigger="label"
          label="Tài khoản"
          menuAlign="left"
          triggerClassName={`${linkBaseClass} ${
            isHorizontal ? "" : "w-full"
          } ${inactiveClass}`}
        />
      ) : null}
    </div>
  );
}

export default TopNavLinks;
