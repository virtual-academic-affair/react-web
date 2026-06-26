/** Shared mobile drawer width (sidebar, nav drawer). */
export const MOBILE_DRAWER_WIDTH_CLASS = "w-[min(320px,85vw)]";

export const MOBILE_DRAWER_BACKDROP_CLASS =
  "fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm transition-opacity duration-200 lg:hidden";

/** Drawer surface — white panel on mobile; transparent on desktop (content provides its own chrome). */
export const MOBILE_DRAWER_SURFACE_CLASS =
  "flex flex-col border-r border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-navy-900 lg:border-0 lg:bg-transparent lg:shadow-none lg:dark:bg-transparent";

export const MOBILE_DRAWER_PANEL_CLASS = `${MOBILE_DRAWER_WIDTH_CLASS} ${MOBILE_DRAWER_SURFACE_CLASS}`;

/** Chatbot mobile drawer — transparent shell; rounded cards float over the backdrop. */
export const CHATBOT_MOBILE_DRAWER_PANEL_CLASS = `${MOBILE_DRAWER_WIDTH_CLASS} flex shrink-0 flex-col border-0 bg-transparent p-3 shadow-none lg:w-auto lg:bg-transparent lg:p-0`;

/** Rounded hamburger / menu trigger (mobile only). */
export const MOBILE_MENU_BUTTON_CLASS =
  "hover:text-brand-500 dark:bg-navy-900/80 dark:hover:bg-navy-800 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/80 text-gray-600 shadow-md backdrop-blur-xl transition-colors hover:bg-white lg:hidden dark:border-white/10 dark:text-gray-300 dark:hover:text-white";

/** Shared fixed position — chatbot + dashboard mobile menu trigger. */
export const MOBILE_MENU_BUTTON_POSITION_CLASS =
  "pointer-events-auto fixed top-3 left-3 z-[60]";

/** Same as above, visible at all breakpoints (e.g. inside drawer header). */
export const MOBILE_ICON_BUTTON_CLASS =
  "hover:text-brand-500 dark:bg-navy-900/80 dark:hover:bg-navy-800 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-white/80 text-gray-600 shadow-md backdrop-blur-xl transition-colors hover:bg-white dark:border-white/10 dark:text-gray-300 dark:hover:text-white";
