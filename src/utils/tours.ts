import { driver, type DriveStep } from "driver.js";
import "./tours.css";

const MARKER_ID = "tour-column-marker-dynamic";

function createColumnMarker(): HTMLElement | null {
  const header = document.querySelector<HTMLElement>(
    ".table-column-header-systemLabels",
  );
  const table = header?.closest("table");
  if (!header || !table) return null;

  const headerRect = header.getBoundingClientRect();
  const tableRect = table.getBoundingClientRect();

  // Remove any existing marker
  document.getElementById(MARKER_ID)?.remove();

  const marker = document.createElement("div");
  marker.id = MARKER_ID;
  marker.style.position = "fixed";
  marker.style.pointerEvents = "none";
  marker.style.left = `${headerRect.left}px`;
  marker.style.top = `${headerRect.top}px`;
  marker.style.width = `${headerRect.width}px`;
  marker.style.height = `${tableRect.bottom - headerRect.top}px`;
  marker.style.zIndex = "0";
  marker.style.opacity = "0";
  document.body.appendChild(marker);
  return marker;
}

export const startMessageSelectionTour = (
  type: "inquiry" | "class-registration",
) => {
  const targetLabelClass =
    type === "class-registration" ? "classRegistration" : type;
  const labelVi = type === "inquiry" ? "Thắc mắc" : "Đăng ký lớp";

  // Check if any message already has the tag in the column
  const existingTag = document.querySelector(
    `.message-system-label-tag-${targetLabelClass}`,
  );

  const steps: DriveStep[] = [];

  if (existingTag) {
    // Case A: Tag already exists — 1 step, click it to begin
    steps.push({
      element: `.message-system-label-tag-${targetLabelClass}`,
      popover: {
        title: "Bấm để bắt đầu",
        description: `Tìm nhãn "${labelVi}" trên dòng tin nhắn và bấm trực tiếp vào đó để bắt đầu tạo hồ sơ.`,
        side: "top",
        align: "center",
      },
      onHighlighted: (element) => {
        element?.addEventListener("click", () => d.destroy(), { once: true });
      },
    });
  } else {
    // Case B: No tag — exactly 2 steps
    steps.push({
      element: `#${MARKER_ID}`,
      popover: {
        title: "Chưa có nhãn nghiệp vụ",
        description: `Chưa có tin nhắn nào mang nhãn "${labelVi}". Cần gắn nhãn trước khi xử lý hồ sơ.`,
        side: "left",
        align: "center"
      },
      onHighlighted: () => {
        // Recreate marker every time this step is shown (handles back navigation too)
        createColumnMarker();
      }
    });

    steps.push({
      element: ".message-actions-trigger",
      popover: {
        title: "Bấm vào đây để gắn nhãn",
        description: `Bấm vào biểu tượng mũi tên để mở bảng chọn nhãn và gắn nhãn "${labelVi}".`,
        side: "left",
        align: "start",
      },
      onHighlighted: (element) => {
        element?.addEventListener("click", () => d.destroy(), { once: true });
      },
    });

    // Create marker BEFORE driver starts so the element exists in DOM
    createColumnMarker();
  }

  const d = driver({
    showProgress: true,
    progressText: "{{current}}/{{total}}",
    overlayColor: "#0b1437bb",
    stageRadius: 16,
    popoverClass: "tour-popover-custom",
    nextBtnText: "→",
    prevBtnText: "←",
    doneBtnText: "✓",
    onDestroyStarted: () => {
      document.getElementById(MARKER_ID)?.remove();
      d.destroy();
    },
    steps,
  });

  d.drive();
};
