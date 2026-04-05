import Tooltip from "@/components/tooltip/Tooltip";
import type { User } from "@/types/users";
import { Empty, Popover } from "antd";
import React from "react";
import { MdClose, MdPersonAdd } from "react-icons/md";

interface AssigneeManagerProps {
  /** List of currently assigned user IDs */
  selectedIds: number[];
  /** List of all available users (admins) to choose from */
  allUsers: User[];
  /** Callback when the selection changes (add or remove) */
  onChange?: (nextIds: number[]) => void;
  /** Custom callback for adding a user (e.g. for immediate API calls) */
  onAdd?: (userId: number) => void;
  /** Custom callback for removing a user (e.g. for immediate API calls) */
  onRemove?: (userId: number) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

const AssigneeManager: React.FC<AssigneeManagerProps> = ({
  selectedIds,
  allUsers,
  onChange,
  onAdd,
  onRemove,
  disabled,
}) => {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const handleToggle = (userId: number) => {
    if (disabled) {
      return;
    }

    const isAdded = selectedIds.includes(userId);
    if (isAdded) {
      if (onRemove) {
        onRemove(userId);
      } else {
        if (onChange) {
          onChange(selectedIds.filter((id) => id !== userId));
        }
      }
    } else {
      if (onAdd) {
        onAdd(userId);
      } else {
        if (onChange) {
          onChange([...selectedIds, userId]);
        }
      }
    }
  };

  return (
    <div className="flex items-center px-1 py-[2px] pl-2">
      <div className="flex -space-x-2">
        {/* Render current selection */}
        {selectedIds.map((userId) => {
          const user = allUsers.find((u) => u.id === userId);
          if (!user) {
            return null;
          }

          return (
            <Tooltip
              key={user.id}
              parentClassName="rounded-2xl!"
              label={
                <div className="flex flex-col gap-1">
                  <p className="text-navy-700 text-base font-bold dark:text-white">
                    {user.name || "—"}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <button
                    type="button"
                    onClick={() => {
                      window.open(
                        `/admin/auth/accounts?id=${user.id}`,
                        "_blank",
                      );
                    }}
                    className="dark:bg-navy-700 dark:hover:bg-navy-600 mt-2 rounded-2xl bg-gray-100 px-3 py-1.5 text-xs font-semibold hover:bg-gray-200"
                  >
                    Xem chi tiết
                  </button>
                </div>
              }
            >
              <div className="group/avatar dark:ring-navy-800 relative inline-block h-8 w-8 cursor-pointer rounded-full ring-2 ring-white transition-transform hover:z-10 hover:scale-110">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-brand-500 flex h-full w-full items-center justify-center rounded-full text-xs font-bold text-white">
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                )}

                {/* Removal 'X' at top-left - show only on hover */}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(user.id);
                    }}
                    className="absolute -top-1.5 -left-1.5 z-30 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-md transition-opacity group-hover/avatar:opacity-100 hover:bg-red-600 focus:outline-none"
                  >
                    <MdClose className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
            </Tooltip>
          );
        })}

        {/* Add button */}
        {!disabled && (
          <Tooltip label="Thêm người thực hiện">
            <Popover
              open={pickerOpen}
              onOpenChange={setPickerOpen}
              trigger="click"
              styles={{ container: { borderRadius: "1.5rem" } }}
              content={
                <div className="flex max-h-60 w-64 flex-col overflow-y-auto rounded-3xl p-1">
                  <p className="mb-3 text-xs font-bold text-gray-400 uppercase">
                    Người thực hiện
                  </p>
                  {allUsers.length === 0 && (
                    <Empty
                      description="Không có quản trị viên"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  )}
                  {allUsers.map((u) => {
                    const isAdded = selectedIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          if (isAdded) return;
                          handleToggle(u.id);
                          setPickerOpen(false);
                        }}
                        disabled={isAdded}
                        className={`dark:hover:bg-navy-700 flex items-center gap-1 rounded-lg p-2 text-left transition-colors ${
                          isAdded
                            ? "dark:bg-navy-700 cursor-not-allowed bg-gray-100 opacity-60"
                            : "bg-transparent hover:bg-gray-50"
                        }`}
                      >
                        <div className="mr-1 h-8 w-8 shrink-0 overflow-hidden rounded-full">
                          {u.picture ? (
                            <img
                              src={u.picture}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="bg-brand-500 flex h-full w-full items-center justify-center text-[10px] font-bold text-white">
                              {(u.name || u.email)[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 truncate">
                          <p className="truncate text-sm font-bold dark:text-white">
                            {u.name || "—"}
                          </p>
                          <p className="truncate text-[10px] text-gray-400">
                            {u.email}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              }
            >
              <button
                type="button"
                className="hover:border-brand-500 hover:text-brand-500 dark:bg-navy-800 dark:ring-navy-800 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-gray-300 bg-white text-gray-400 ring-2 ring-white transition-all hover:scale-110 dark:border-white/20"
              >
                <MdPersonAdd className="h-4 w-4" />
              </button>
            </Popover>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default AssigneeManager;
