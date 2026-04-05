import { tasksService } from "@/services/tasks";
import type { Task } from "@/types/task";
import { TaskStatus } from "@/types/task";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, message as toast } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import React, { useEffect, useRef, useState } from "react";
import {
  MdAccessTime,
  MdAdd,
  MdArrowForward,
  MdChevronLeft,
  MdChevronRight,
  MdToday,
} from "react-icons/md";
import { useNavigate, useSearchParams } from "react-router-dom";
import TaskDetailDrawer from "../list/components/TaskDetailDrawer";

dayjs.locale("vi");

// Droppable wrapper for a calendar date cell
const DroppableCell = ({
  dateStr,
  children,
}: {
  dateStr: string;
  children: React.ReactNode;
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: dateStr,
  });

  return (
    <div
      ref={setNodeRef}
      className={`Transition-all h-full w-full overflow-y-auto duration-200 ${
        isOver ? "bg-brand-50/50 dark:bg-navy-700/50" : ""
      }`}
    >
      {children}
    </div>
  );
};

// Draggable wrapper for individual task items
const DraggableTask = ({
  task,
  searchParams,
  setSearchParams,
  defaultTaskClasses,
}: any) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `task-${task.id}`,
      data: { task },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const isDone = task.status === TaskStatus.Done;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        const next = new URLSearchParams(searchParams);
        next.set("id", String(task.id));
        setSearchParams(next);
      }}
      className={`relative z-10 flex cursor-pointer flex-col gap-1 rounded-xl px-3 py-2.5 text-xs font-bold wrap-break-word shadow-sm transition-all duration-200 hover:opacity-95 ${
        isDone
          ? "dark:bg-navy-800 bg-gray-100 text-gray-500 line-through opacity-60 dark:text-gray-400"
          : defaultTaskClasses
      } ${isDragging ? "ring-brand-500 z-50! cursor-grabbing! opacity-50 shadow-xl ring-2" : ""}`}
      title={task.name}
    >
      <div className="line-clamp-1 leading-tight font-bold">{task.name}</div>
      {task.assignees && task.assignees.length > 0 && (
        <div
          className={`mt-1 flex flex-wrap gap-1 leading-none ${isDone ? "opacity-70" : ""}`}
        >
          <div className="flex -space-x-1.5">
            {task.assignees.slice(0, 3).map((a: any) => {
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
            {task.assignees.length > 3 && (
              <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[8px] font-bold text-white ring-1 ring-white/40 backdrop-blur-sm">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
};

const TimelineItem = ({
  task,
  isFirst,
  searchParams,
  setSearchParams,
}: {
  task: Task;
  isFirst: boolean;
  searchParams: any;
  setSearchParams: any;
}) => {
  const dueDate = dayjs(task.due);
  const dayName = dueDate.format("ddd");
  const dayNum = dueDate.format("DD");
  const startTime = dueDate.format("HH:mm");

  return (
    <div
      onClick={() => {
        const next = new URLSearchParams(searchParams);
        next.set("id", String(task.id));
        setSearchParams(next);
      }}
      className={`group flex w-full cursor-pointer items-center rounded-3xl p-4 transition-all duration-300 ${
        isFirst
          ? "bg-brand-900 text-white"
          : "dark:bg-navy-800 text-navy-700 dark:border-navy-700 border border-gray-100 bg-white dark:text-white"
      }`}
    >
      <div
        className={`mr-4 flex h-[64px] min-w-[64px] flex-col items-center justify-center rounded-xl ${
          isFirst ? "bg-brand-500" : "bg-lightPrimary dark:bg-navy-700"
        }`}
      >
        <span
          className={`text-[10px] font-bold tracking-wider uppercase ${
            isFirst ? "text-white/80" : "text-gray-400 dark:text-gray-400"
          }`}
        >
          {dayName}
        </span>
        <span className="text-2xl font-black">{dayNum}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col pr-2">
        <h4
          className={`truncate text-base leading-snug font-bold ${
            isFirst ? "text-white" : "text-navy-700 dark:text-white"
          }`}
        >
          {task.name}
        </h4>
        <div
          className={`mt-1.5 flex items-center text-xs opacity-80 ${
            isFirst ? "text-white" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <MdAccessTime className="mr-1.5 h-3.5 w-3.5" />
          {startTime}
        </div>
      </div>
      <MdArrowForward
        className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${
          isFirst ? "text-white" : "text-gray-300 dark:text-gray-600"
        }`}
      />
    </div>
  );
};

const TasksCalendarPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [calendarDate, setCalendarDate] = useState<Dayjs>(dayjs());
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const calendarColRef = useRef<HTMLDivElement>(null);
  const [calendarHeight, setCalendarHeight] = useState<number | undefined>(
    undefined,
  );

  const startOfMonth = calendarDate.startOf("month").format("YYYY-MM-DD");
  const endOfMonth = calendarDate.endOf("month").format("YYYY-MM-DD");

  const { data: tasksResult, isLoading: loading } = useQuery({
    queryKey: ["tasks", "calendar", { startOfMonth, endOfMonth }],
    queryFn: () =>
      tasksService.getList({
        dueDateFrom: startOfMonth,
        dueDateTo: endOfMonth,
        limit: 500,
      }),
    staleTime: 30 * 1000,
  });

  const tasks = tasksResult?.items || [];

  const { data: timelineTasksResult, isLoading: timelineLoading } = useQuery({
    queryKey: ["tasks", "timeline"],
    queryFn: () => {
      const today = dayjs().startOf("day").toISOString();
      return tasksService.getList({
        dueDateFrom: today,
        statuses: [TaskStatus.Todo, TaskStatus.Doing],
        limit: 10,
        orderCol: "due",
        orderDir: "ASC",
      });
    },
    staleTime: 30 * 1000,
  });

  const timelineTasks = timelineTasksResult?.items || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
  );

  // Sync timeline height to match calendar column height
  useEffect(() => {
    const el = calendarColRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      setCalendarHeight(el.offsetHeight);
    });
    observer.observe(el);
    setCalendarHeight(el.offsetHeight);
    return () => observer.disconnect();
  }, []);

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

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const taskIdString = active.id.toString();
    const taskId = parseInt(taskIdString.replace("task-", ""), 10);
    const targetDateStr = over.id as string;

    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask || !draggedTask.due) {
      return;
    }

    const currentDateStr = dayjs(draggedTask.due).format("YYYY-MM-DD");
    if (currentDateStr === targetDateStr) {
      return;
    } // Dropped on the identical day

    // Parse current time to maintain the time component when changing dates
    const oldDateObj = dayjs(draggedTask.due);
    const newDateObj = dayjs(targetDateStr)
      .hour(oldDateObj.hour())
      .minute(oldDateObj.minute())
      .second(oldDateObj.second());

    // Optistic UI Update
    const previousTasks = [...tasks];
    const queryKey = ["tasks", "calendar", { startOfMonth, endOfMonth }];

    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((t: Task) =>
          t.id === taskId ? { ...t, due: newDateObj.toISOString() } : t,
        ),
      };
    });

    try {
      await tasksService.update(taskId, { due: newDateObj.toISOString() });
      toast.success("Cập nhật thành công.");
      // Invalidate timeline so it sorts/refetches correctly too
      queryClient.invalidateQueries({ queryKey: ["tasks", "timeline"] });
    } catch (err: unknown) {
      console.error(err);
      toast.error("Cập nhật thất bại.");
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          items: previousTasks,
        };
      });
    }
  };

  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    const dateStr = value.format("YYYY-MM-DD");

    return (
      <DroppableCell dateStr={dateStr}>
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

          <ul className="m-0 mt-0.5 list-none space-y-1 p-0 px-0.5 py-0.5">
            {listData.map((item) => (
              <DraggableTask
                key={item.id}
                task={item}
                searchParams={searchParams}
                setSearchParams={setSearchParams}
                defaultTaskClasses="bg-lightPrimary text-navy-700 dark:bg-navy-700 dark:text-white"
              />
            ))}
          </ul>
        </div>
      </DroppableCell>
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
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="relative grid w-full grid-cols-1 items-start gap-5 font-sans lg:grid-cols-4">
        {/* Calendar Column */}
        <div
          ref={calendarColRef}
          className="shadow-500 dark:bg-navy-800 relative rounded-4xl bg-white p-6 lg:col-span-3 dark:shadow-none"
        >
          {loading && (
            <div className="dark:bg-navy-800/50 absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/50"></div>
          )}
          <Calendar
            value={calendarDate}
            onPanelChange={onPanelChange}
            onChange={(val) => setCalendarDate(val as Dayjs)}
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

        {/* Timeline Column */}
        <div className="lg:col-span-1">
          <div
            className="shadow-500 dark:bg-navy-800 flex w-full flex-col overflow-hidden rounded-4xl bg-white p-6 dark:shadow-none"
            style={calendarHeight ? { height: calendarHeight } : undefined}
          >
            <div className="mb-6">
              <h2 className="text-navy-700 text-2xl font-black tracking-tight dark:text-white">
                Timeline
              </h2>
            </div>

            <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto py-2">
              {timelineLoading ? (
                <div className="flex items-center justify-center py-10"></div>
              ) : timelineTasks.length > 0 ? (
                timelineTasks.map((t, idx) => (
                  <TimelineItem
                    key={t.id}
                    task={t}
                    isFirst={idx === 0}
                    searchParams={searchParams}
                    setSearchParams={setSearchParams}
                  />
                ))
              ) : (
                <div className="py-20 text-center text-sm text-gray-400">
                  Không có công việc nào sắp tới
                </div>
              )}
            </div>
          </div>
        </div>

        <TaskDetailDrawer
          taskId={selectedId}
          onClose={() => navigate(-1)}
          onTaskChanged={(updated) => {
            const queryKey = [
              "tasks",
              "calendar",
              { startOfMonth, endOfMonth },
            ];
            queryClient.setQueryData(queryKey, (old: any) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.map((x: Task) =>
                  x.id === updated.id ? updated : x,
                ),
              };
            });
            queryClient.invalidateQueries({ queryKey: ["tasks", "timeline"] });
          }}
          onTaskDeleted={(id) => {
            const queryKey = [
              "tasks",
              "calendar",
              { startOfMonth, endOfMonth },
            ];
            queryClient.setQueryData(queryKey, (old: any) => {
              if (!old) return old;
              return {
                ...old,
                items: old.items.filter((x: Task) => x.id !== id),
              };
            });
            queryClient.invalidateQueries({ queryKey: ["tasks", "timeline"] });
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
          height: 125px !important;
          position: relative !important;
          overflow: hidden !important;
        }
        
        /* Make the internal content scrollable instead of spilling out */
        .custom-calendar-wrapper .ant-picker-calendar-date-value {
           position: sticky;
           top: 0;
           z-index: 10;
           background: inherit;
        }
        
        .custom-calendar-wrapper .ant-picker-calendar-date-content {
           height: calc(100% - 24px) !important;
           overflow-y: auto !important;
        }

        /* Custom scrollbar for busy days */
        .custom-calendar-wrapper .ant-picker-calendar-date-content::-webkit-scrollbar {
          width: 4px;
        }
        .custom-calendar-wrapper .ant-picker-calendar-date-content::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .dark .custom-calendar-wrapper .ant-picker-calendar-date-content::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
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
    </DndContext>
  );
};

export default TasksCalendarPage;
