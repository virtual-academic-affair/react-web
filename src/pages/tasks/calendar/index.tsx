import React, { useEffect, useState } from "react";
import { Calendar, Spin } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");
import { tasksService } from "@/services/tasks.service";
import type { Task } from "@/types/task";
import { TaskStatus } from "@/types/task";
import { useNavigate, useSearchParams } from "react-router-dom";
import TaskDetailDrawer from "../list/components/TaskDetailDrawer";
import { MdChevronLeft, MdChevronRight, MdAdd, MdToday } from "react-icons/md";

const TasksCalendarPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarDate, setCalendarDate] = useState<Dayjs>(dayjs());
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Load tasks for the current view
  const fetchTasks = async (currentDate: Dayjs) => {
    setLoading(true);
    try {
      const startOfMonth = currentDate.startOf("month").format("YYYY-MM-DD");
      const endOfMonth = currentDate.endOf("month").format("YYYY-MM-DD");

      const res = await tasksService.getList({
        dueDateFrom: startOfMonth,
        dueDateTo: endOfMonth,
        limit: 500, // a reasonable large number to show on calendar
      });
      setTasks(res.items);
    } catch (error) {
      console.error("Failed to fetch tasks for calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(calendarDate);
  }, [calendarDate]);

  const onPanelChange = (value: Dayjs, mode: string) => {
    if (mode === "month") {
      setCalendarDate(value);
    }
  };

  const getListData = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    return tasks.filter((task) => {
      if (!task.due) {
        return false;
      }
      return dayjs(task.due).format("YYYY-MM-DD") === dateStr;
    });
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    const dateStr = value.format("YYYY-MM-DD");

    return (
      <div className="h-full w-full pb-1">
        {/* Nút cộng tạo nhanh công việc */}
        <div
          className="add-task-btn bg-brand-500 hover:bg-brand-600 pointer-events-none absolute right-1 bottom-1 z-50 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-white opacity-0 shadow-md transition-all outline-none"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/tasks/create?due=${dateStr}`);
          }}
          title="Thêm công việc"
        >
          <MdAdd className="h-4 w-4" />
        </div>

        <ul className="m-0 mt-1 list-none space-y-2 p-0">
          {listData.map((item) => {
            const isDone = item.status === TaskStatus.Done;

            const defaultTaskClasses =
              "bg-lightPrimary text-navy-700 dark:bg-navy-700 dark:text-white";

            return (
              <li
                key={item.id}
                onClick={(e) => {
                  e.stopPropagation();
                  const next = new URLSearchParams(searchParams);
                  next.set("id", String(item.id));
                  setSearchParams(next, { replace: true });
                }}
                className={`flex cursor-pointer flex-col gap-1 rounded-xl px-2.5 py-2 text-xs font-medium wrap-break-word shadow-sm transition-opacity hover:opacity-80 ${
                  isDone
                    ? "dark:bg-navy-800 bg-gray-100 text-gray-500 line-through opacity-60 dark:text-gray-400"
                    : defaultTaskClasses
                }`}
                title={item.name}
              >
                <div className="line-clamp-2 leading-tight font-bold">
                  {item.name}
                </div>
                {item.assignees && item.assignees.length > 0 && (
                  <div
                    className={`mt-1 flex flex-wrap gap-1 leading-none ${isDone ? "opacity-70" : ""}`}
                  >
                    <div className="flex -space-x-1.5">
                      {item.assignees.slice(0, 3).map((a) => {
                        const user = a.assignee;
                        if (!user) {
                          return null;
                        }
                        return (
                          <div
                            key={user.id}
                            className="relative inline-block h-5 w-5 overflow-hidden rounded-full ring-1 ring-white/40"
                            title={user.name || user.email}
                          >
                            {user.picture ? (
                              <img
                                src={user.picture}
                                alt={user.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="bg-brand-500 flex h-full w-full items-center justify-center text-[8px] font-bold text-white uppercase shadow-inner">
                                {(user.name || user.email || "?")[0]}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {item.assignees.length > 3 && (
                        <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[8px] font-bold text-white ring-1 ring-white/40 backdrop-blur-sm">
                          +{item.assignees.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const cellRender = (
    current: Dayjs,
    info: { type: string; originNode: React.ReactNode },
  ) => {
    if (info.type === "date") {
      return dateCellRender(current);
    }
    return info.originNode;
  };

  // Drawer ID management
  const selectedId = searchParams.get("id")
    ? Number(searchParams.get("id"))
    : null;

  return (
    <div className="relative flex w-full flex-col gap-5 font-sans">
      <div className="shadow-500 dark:bg-navy-800 relative min-h-175 rounded-4xl bg-white p-6 dark:shadow-none">
        <Calendar
          value={calendarDate}
          onPanelChange={onPanelChange}
          onChange={(val) => setCalendarDate(val)}
          cellRender={cellRender}
          className="custom-calendar-wrapper dark:text-white"
          headerRender={({ value, onChange }) => {
            const currentMonth = value.month() + 1;
            const currentYear = value.year();

            const isDifferentMonth =
              value.month() !== dayjs().month() ||
              value.year() !== dayjs().year();

            return (
              <div className="dark:border-navy-700 relative mb-4 flex items-center justify-between pb-4">
                <div className="z-10 flex items-center gap-4">
                  <div className="flex gap-2">
                    <button
                      className="dark:border-navy-600 dark:hover:bg-navy-700 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 transition hover:bg-gray-50 dark:text-white"
                      onClick={() => {
                        const nextDate = value.subtract(1, "month");
                        onChange(nextDate);
                        setCalendarDate(nextDate);
                      }}
                    >
                      <MdChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      className="dark:border-navy-600 dark:hover:bg-navy-700 flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 transition hover:bg-gray-50 dark:text-white"
                      onClick={() => {
                        const nextDate = value.add(1, "month");
                        onChange(nextDate);
                        setCalendarDate(nextDate);
                      }}
                    >
                      <MdChevronRight className="h-6 w-6" />
                    </button>
                  </div>

                  {isDifferentMonth && (
                    <button
                      onClick={() => {
                        onChange(dayjs());
                        setCalendarDate(dayjs());
                      }}
                      className="dark:border-navy-600 dark:hover:bg-navy-700 flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-1.5 text-sm font-medium transition hover:bg-gray-50 dark:text-gray-200"
                    >
                      <MdToday className="h-4 w-4" />
                      Hôm nay
                    </button>
                  )}
                </div>

                {/* Title perfectly centered */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <h2 className="text-navy-700 pointer-events-auto text-xl font-bold dark:text-white">
                    Tháng {currentMonth} / {currentYear}
                  </h2>
                </div>

                {/* Space reserved for any future right-side tools */}
                <div className="z-10 flex w-24 justify-end"></div>
              </div>
            );
          }}
        />
      </div>

      <TaskDetailDrawer
        taskId={selectedId}
        onClose={() => {
          const next = new URLSearchParams(searchParams);
          next.delete("id");
          setSearchParams(next, { replace: true });
        }}
        onTaskChanged={(updated) =>
          setTasks((prev) =>
            prev.map((x) => (x.id === updated.id ? updated : x)),
          )
        }
        onTaskDeleted={(id) => {
          setTasks((prev) => prev.filter((x) => x.id !== id));
        }}
      />

      <style>{`
        .custom-calendar-wrapper {
          font-family: inherit !important;
        }
        .custom-calendar-wrapper *:not(svg):not(path) {
          font-family: inherit !important;
        }
        .custom-calendar-wrapper .ant-picker-calendar-date {
          height: 100px !important;
          position: relative;
          overflow: hidden;
          overflow-y: auto;
        }
        /* Custom scrollbar for busy days */
        .custom-calendar-wrapper .ant-picker-calendar-date::-webkit-scrollbar {
          width: 2px;
        }
        .custom-calendar-wrapper .ant-picker-calendar-date::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .dark .custom-calendar-wrapper .ant-picker-calendar-date::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .ant-picker-calendar-date {
          position: relative !important;
        }
        .ant-picker-cell:hover .add-task-btn {
          opacity: 1;
          pointer-events: auto;
        }
        .ant-picker-calendar-date-today {
           border-color: #4318ff !important;
        }
        .dark .ant-picker-calendar-date-today {
           border-color: #7551ff !important;
        }
      `}</style>
    </div>
  );
};

export default TasksCalendarPage;
