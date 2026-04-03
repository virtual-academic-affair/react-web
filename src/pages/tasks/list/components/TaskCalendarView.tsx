import { tasksService } from "@/services/tasks";
import type { Task } from "@/types/task";
import { TaskStatus } from "@/types/task";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calendar, message as toast } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  MdAdd,
  MdChevronLeft,
  MdChevronRight,
  MdDragIndicator,
  MdToday,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";

dayjs.locale("vi");

interface TaskCalendarViewProps {
  onTaskClick: (task: Task) => void;
}

// Droppable wrapper for a calendar date cell
const DroppableCell = ({
  dateStr,
  children,
}: {
  dateStr: string;
  children: React.ReactNode;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: dateStr });

  return (
    <div
      ref={setNodeRef}
      className={`h-full w-full transition-colors duration-200 ${
        isOver ? "bg-brand-50/50 dark:bg-navy-700/50" : ""
      }`}
    >
      {children}
    </div>
  );
};

// Chip for rendering inside DragOverlay (no dnd hooks = no ref issues)
const TaskChip = ({
  task,
  isDone,
  defaultTaskClasses,
  isOverlay = false,
}: {
  task: Task;
  isDone: boolean;
  defaultTaskClasses: string;
  isOverlay?: boolean;
}) => (
  <div
    className={`flex cursor-grabbing flex-col gap-1 rounded-xl px-3 py-2.5 text-xs font-bold shadow-lg ${
      isDone
        ? "dark:bg-navy-800 bg-gray-100 text-gray-500 line-through opacity-60 dark:text-gray-400"
        : defaultTaskClasses
    } ${isOverlay ? "ring-brand-500 scale-105 rotate-1 opacity-90 ring-2" : ""}`}
  >
    <div className="line-clamp-1 leading-tight font-bold">{task.name}</div>
    {task.assignees && task.assignees.length > 0 && (
      <div className="mt-1 flex -space-x-1.5">
        {task.assignees.slice(0, 3).map((a) => {
          const user = a.assignee;
          if (!user) return null;
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
                <div className="bg-brand-500 flex h-full w-full items-center justify-center text-[8px] font-bold text-white uppercase">
                  {(user.name || user.email || "?")[0]}
                </div>
              )}
            </div>
          );
        })}
        {task.assignees.length > 3 && (
          <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[8px] font-bold text-white ring-1 ring-white/40">
            +{task.assignees.length - 3}
          </div>
        )}
      </div>
    )}
  </div>
);

// Draggable task — drag handle appears on hover (right of title, absolute, no reserved space)
const DraggableTask = ({
  task,
  onTaskClick,
  defaultTaskClasses,
}: {
  task: Task;
  onTaskClick: (task: Task) => void;
  defaultTaskClasses: string;
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  });

  const isDone = task.status === TaskStatus.Done;

  return (
    <li
      ref={setNodeRef}
      className={`group relative cursor-pointer rounded-xl px-2.5 py-2 text-xs font-bold shadow-sm transition-all duration-200 ${
        isDone
          ? "dark:bg-navy-800 bg-gray-100 text-gray-500 line-through opacity-60 dark:text-gray-400"
          : defaultTaskClasses
      } ${isDragging ? "opacity-30" : "hover:brightness-95"}`}
      title={task.name}
    >
      {/* Title row — content, drag handle overlaid on the right */}
      <div
        className="relative pr-4"
        onClick={(e) => {
          e.stopPropagation();
          onTaskClick(task);
        }}
      >
        <div className="line-clamp-2 leading-tight font-bold">{task.name}</div>

        {/* Drag handle — absolutely positioned at right of title, invisible until hover */}
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="absolute top-0 right-0 flex h-full cursor-grab items-center opacity-0 transition-opacity group-hover:opacity-50 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          aria-label="Kéo để thay đổi ngày"
        >
          <MdDragIndicator className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 && (
        <div
          className={`mt-1 flex -space-x-1.5 ${isDone ? "opacity-70" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onTaskClick(task);
          }}
        >
          {task.assignees.slice(0, 3).map((a) => {
            const user = a.assignee;
            if (!user) return null;
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
                  <div className="bg-brand-500 flex h-full w-full items-center justify-center text-[8px] font-bold text-white uppercase">
                    {(user.name || user.email || "?")[0]}
                  </div>
                )}
              </div>
            );
          })}
          {task.assignees.length > 3 && (
            <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-black/20 text-[8px] font-bold text-white ring-1 ring-white/40">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
      )}
    </li>
  );
};

const DEFAULT_TASK_CLASSES =
  "bg-lightPrimary text-navy-700 dark:bg-navy-700 dark:text-white";

const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({ onTaskClick }) => {
  const queryClient = useQueryClient();
  const [calendarDate, setCalendarDate] = useState<Dayjs>(dayjs());
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const navigate = useNavigate();

  const startOfMonth = calendarDate.startOf("month").format("YYYY-MM-DD");
  const endOfMonth = calendarDate.endOf("month").format("YYYY-MM-DD");

  const { data: tasksResult } = useQuery({
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // No delay — activation is gated by the drag-handle button
      activationConstraint: { distance: 5 },
    }),
  );

  const onPanelChange = (value: Dayjs, mode: string) => {
    if (mode === "month") {
      setCalendarDate(value);
    }
  };

  const getListData = (value: Dayjs) => {
    const dateStr = value.format("YYYY-MM-DD");
    return tasks.filter(
      (task) => task.due && dayjs(task.due).format("YYYY-MM-DD") === dateStr,
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    setActiveTask(task ?? null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = parseInt(active.id.toString().replace("task-", ""), 10);
    const targetDateStr = over.id as string;

    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask || !draggedTask.due) return;

    const currentDateStr = dayjs(draggedTask.due).format("YYYY-MM-DD");
    if (currentDateStr === targetDateStr) return;

    const oldDateObj = dayjs(draggedTask.due);
    const newDateObj = dayjs(targetDateStr)
      .hour(oldDateObj.hour())
      .minute(oldDateObj.minute())
      .second(oldDateObj.second());

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
        <div className="h-full w-full overflow-y-auto pb-1">
          <div
            className="add-task-btn bg-brand-500 hover:bg-brand-600 pointer-events-none absolute right-1 bottom-1 z-50 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-white opacity-0 shadow-md transition-all"
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
                onTaskClick={onTaskClick}
                defaultTaskClasses={DEFAULT_TASK_CLASSES}
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
    if (info.type === "date") return dateCellRender(current);
    return info.originNode;
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="shadow-500 dark:bg-navy-800 relative w-full rounded-4xl bg-white p-6 dark:shadow-none">
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
              <div className="relative mb-4 flex items-center justify-between pb-4">
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
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <h2 className="text-navy-700 pointer-events-auto text-xl font-bold dark:text-white">
                    Tháng {currentMonth} / {currentYear}
                  </h2>
                </div>
                <div className="z-10 w-24" />
              </div>
            );
          }}
        />
      </div>

      {/* DragOverlay renders via portal at document.body — always above everything */}
      {createPortal(
        <DragOverlay dropAnimation={null}>
          {activeTask ? (
            <div className="pointer-events-none w-40">
              <TaskChip
                task={activeTask}
                isDone={activeTask.status === TaskStatus.Done}
                defaultTaskClasses={DEFAULT_TASK_CLASSES}
                isOverlay
              />
            </div>
          ) : null}
        </DragOverlay>,
        document.body,
      )}

      <style>{`
        .custom-calendar-wrapper { font-family: inherit !important; }
        .custom-calendar-wrapper *:not(svg):not(path) { font-family: inherit !important; }
        .custom-calendar-wrapper .ant-picker-calendar-date {
          height: 130px !important;
          position: relative !important;
        }
        .custom-calendar-wrapper .ant-picker-calendar-date-value {
          position: sticky; top: 0; z-index: 2; background: inherit;
        }
        .custom-calendar-wrapper .ant-picker-calendar-date-content {
          height: calc(100% - 24px) !important;
          overflow-y: auto !important;
        }
        .custom-calendar-wrapper .ant-picker-calendar-date-content::-webkit-scrollbar { width: 3px; }
        .custom-calendar-wrapper .ant-picker-calendar-date-content::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.1); border-radius: 4px;
        }
        .dark .custom-calendar-wrapper .ant-picker-calendar-date-content::-webkit-scrollbar-thumb {
          background-color: rgba(255,255,255,0.2);
        }
        .ant-picker-cell:hover .add-task-btn { opacity: 1; pointer-events: auto; }
        .ant-picker-calendar-date-today { border-color: #4318ff !important; }
        .dark .ant-picker-calendar-date-today { border-color: #7551ff !important; }
      `}</style>
    </DndContext>
  );
};

export default TaskCalendarView;
