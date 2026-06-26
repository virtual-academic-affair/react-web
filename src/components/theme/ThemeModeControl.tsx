import type { ReactNode } from "react";
import { RiComputerLine, RiMoonFill, RiSunFill } from "react-icons/ri";

import { SegmentedControl } from "@/components/segmented-control/SegmentedControl";
import { useTheme } from "@/hooks/useTheme";
import type { ThemeMode } from "@/utils/theme";

const THEME_OPTIONS: {
  value: ThemeMode;
  label: ReactNode;
  title: string;
}[] = [
  { value: "light", label: <RiSunFill className="block h-4 w-4" />, title: "Sáng" },
  { value: "dark", label: <RiMoonFill className="block h-4 w-4" />, title: "Tối" },
  {
    value: "system",
    label: <RiComputerLine className="block h-4 w-4" />,
    title: "Hệ thống",
  },
];

type ThemeModeControlProps = {
  className?: string;
  fullWidth?: boolean;
};

export function ThemeModeControl({
  className = "",
  fullWidth = true,
}: ThemeModeControlProps) {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <div className={className}>
      <SegmentedControl
        value={themeMode}
        onChange={setThemeMode}
        fullWidth={fullWidth}
        aria-label="Giao diện"
        options={THEME_OPTIONS}
      />
    </div>
  );
}
