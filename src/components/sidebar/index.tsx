import routes from "routes";
import { SidebarLinks as Links } from "./components/Links";
import { SidebarChatbotPanel } from "./components/SidebarChatbotPanel";
import SidebarShell from "./components/SidebarShell";

const Sidebar = (props: {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onShowChatbotPanel?: () => void;
  onNavigateStart?: () => void;
}) => {
  const {
    open,
    onClose,
    collapsed = false,
    onToggleCollapse,
    onShowChatbotPanel,
    onNavigateStart,
  } = props;

  return (
    <SidebarShell
      open={open}
      collapsed={collapsed}
      onToggleCollapse={onToggleCollapse}
    >
      <Links
        routes={routes}
        collapsed={collapsed}
        onNavigate={onClose}
        onNavigateStart={onNavigateStart}
      />
      <SidebarChatbotPanel
        collapsed={collapsed}
        onShowChatbotPanel={onShowChatbotPanel}
        onNavigate={onClose}
        onNavigateStart={onNavigateStart}
      />
    </SidebarShell>
  );
};

export default Sidebar;
