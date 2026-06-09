import { FiAlignJustify } from "react-icons/fi";

const Navbar = (props: { onOpenSidenav: () => void }) => {
  const { onOpenSidenav } = props;

  return (
    <button
      type="button"
      aria-label="Mở menu"
      onClick={onOpenSidenav}
      className="dark:bg-navy-800! fixed top-4 right-4 z-40 mt-2 flex h-11 w-11 items-center justify-center rounded-full border-2 border-gray-300 bg-white text-gray-600 shadow-lg transition-colors hover:bg-gray-50 lg:hidden dark:text-white dark:hover:bg-white/10"
    >
      <FiAlignJustify className="h-5 w-5" />
    </button>
  );
};

export default Navbar;
