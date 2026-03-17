import {
  type Task,
  TaskPriority,
  TaskStatus,
  TaskStatusColors,
  TaskStatusLabels,
} from "@/types/task";
import {
  defaultDropAnimationSideEffects,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Spin } from "antd";
import dayjs from "dayjs";
import React from "react";
import { MdAccessTime } from "react-icons/md";
import TaskPrioritySelector from "./TaskPrioritySelector";

interface TaskBoardProps {
  tasks: Task[];
  loading: boolean;
  onTaskClick: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => Promise<void>;
  onPriorityChange: (task: Task, newPriority: TaskPriority) => Promise<void>;
}

const COLUMNS: TaskStatus[] = [
  TaskStatus.Todo,
  TaskStatus.Doing,
  TaskStatus.Done,
  TaskStatus.Cancelled,
];

const BoardColumn = ({
  status,
  tasks,
  onTaskClick,
  onPriorityChange,
}: {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onPriorityChange: (task: Task, newPriority: TaskPriority) => void;
}) => {
  const { setNodeRef } = useDroppable({
    id: status,
  });

  const color = TaskStatusColors[status];

  return (
    <div className="dark:bg-navy-800/50 flex h-full min-w-70 flex-1 flex-col rounded-2xl bg-gray-50/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full ${color.bg.replace("bg-", "bg-").replace("-100", "-500")}`}
          />
          <h3 className="text-navy-700 text-sm font-bold dark:text-white">
            {TaskStatusLabels[status]}
          </h3>
          <span className="bg-lightPrimary text-navy-700 dark:bg-navy-700 rounded-lg px-2 py-0.5 text-xs font-bold dark:text-white">
            {tasks.length}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="custom-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto"
      >
        {tasks.map((task) => (
          <BoardTaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
            onPriorityChange={onPriorityChange}
          />
        ))}
      </div>
    </div>
  );
};

const BoardTaskCard = ({
  task,
  onClick,
  onPriorityChange,
  isOverlay = false,
}: {
  task: Task;
  onClick?: () => void;
  onPriorityChange?: (task: Task, newPriority: TaskPriority) => void;
  isOverlay?: boolean;
}) => {
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

  if (isDragging && !isOverlay) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="dark:border-navy-700 h-30 w-full rounded-2xl border-2 border-dashed border-gray-200 bg-transparent"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`group shadow-500 dark:bg-navy-700 flex cursor-grab flex-col gap-3 rounded-2xl bg-white p-4 transition-all active:cursor-grabbing dark:shadow-none ${
        isOverlay
          ? "scale-105 rotate-2 shadow-xl"
          : "hover:border-brand-500 border border-transparent"
      }`}
    >
      <div className="flex items-center justify-between">
        <TaskPrioritySelector
          value={task.priority}
          onChange={(p) => onPriorityChange?.(task, p)}
          className="origin-left scale-90"
          readonly={true}
        />
      </div>

      <h4 className="text-navy-700 line-clamp-2 text-sm font-bold dark:text-white">
        {task.name}
      </h4>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-400">
          <MdAccessTime className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">
            {task.due ? dayjs(task.due).format("DD/MM") : "—"}
          </span>
        </div>

        <div className="flex -space-x-2">
          {task.assignees?.slice(0, 3).map((a) => (
            <div
              key={a.assigneeId}
              className="dark:border-navy-700 h-6 w-6 rounded-full border-2 border-white bg-gray-200"
              title={a.assignee?.name}
            >
              {a.assignee?.picture ? (
                <img
                  src={a.assignee.picture}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="bg-brand-500 flex h-full w-full items-center justify-center rounded-full text-[8px] font-bold text-white">
                  {a.assignee?.name?.[0].toUpperCase() || "?"}
                </div>
              )}
            </div>
          ))}
          {task.assignees && task.assignees.length > 3 && (
            <div className="bg-lightPrimary dark:border-navy-700 dark:bg-navy-800 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[8px] font-bold text-gray-600 dark:text-white">
              +{task.assignees.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  loading,
  onTaskClick,
  onStatusChange,
  onPriorityChange,
}) => {
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [localTasks, setLocalTasks] = React.useState<Task[]>(tasks);

  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = active.data.current?.task as Task;
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      return;
    }

    const taskId = parseInt(active.id.toString().replace("task-", ""), 10);
    const newStatus = over.id as TaskStatus;

    const task = localTasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) {
      return;
    }

    // Optimistic update
    const previousTasks = [...localTasks];
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    try {
      await onStatusChange(task, newStatus);
    } catch {
      setLocalTasks(previousTasks);
    }
  };

  if (loading && localTasks.length === 0) {
    return (
      <div className="flex h-150 w-full items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[90vh] w-full gap-5 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={localTasks.filter((t) => t.status === status)}
            onTaskClick={onTaskClick}
            onPriorityChange={onPriorityChange}
          />
        ))}
      </div>

      <DragOverlay
        dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: "0.5",
              },
            },
          }),
        }}
      >
        {activeTask ? (
          <div className="w-72">
            <BoardTaskCard task={activeTask} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default TaskBoard;
