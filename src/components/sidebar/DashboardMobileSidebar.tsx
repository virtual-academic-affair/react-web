import { AppSidebarLayout } from "@/components/sidebar/components/AppSidebarLayout";
import { SidebarLinks } from "@/components/sidebar/components/Links";

type DashboardMobileSidebarProps = {
  routes: RoutesType[];
  onClose?: () => void;
  onNavigateStart?: () => void;
};

export function DashboardMobileSidebar({
  routes,
  onClose,
  onNavigateStart,
}: DashboardMobileSidebarProps) {
  return (
    <div className="flex h-dvh min-h-0 w-full shrink-0 self-stretch bg-transparent">
      <AppSidebarLayout onClose={onClose}>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <SidebarLinks
            routes={routes}
            onNavigateStart={onNavigateStart}
            onNavigate={onClose}
          />
        </div>
      </AppSidebarLayout>
    </div>
  );
}
