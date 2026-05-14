import Tooltip from "@/components/tooltip/Tooltip.tsx";
import { useMemo, useState, type JSX } from "react";
import { MdAdd, MdChat, MdKeyboardArrowDown } from "react-icons/md";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

const CHATBOT_HREF = "/admin/chatbot";

/** Giống link con trong sidebar (`Links.tsx`), inactive không đậm. */
const sidebarChildLink = (active: boolean) =>
  `mt-1 ml-1 block max-w-full truncate rounded-lg py-0.5 text-base transition-colors ${
    active
      ? "font-medium text-navy-700 dark:text-white"
      : "font-normal text-gray-600 dark:text-gray-300"
  } `;

const PHRASE_A = [
  "Cho em hỏi chi tiết về",
  "Mình cần làm rõ thêm phần",
  "Nhờ hệ thống giải thích giúp",
  "Em muốn xác nhận lại quy trình",
  "Thắc mắc của em liên quan tới",
  "Cho mình hỏi thêm về trường hợp",
  "Em chưa hiểu rõ khoản",
  "Mình đang cần tư vấn nhanh về",
];

const PHRASE_B = [
  "đăng ký học phần tự chọn và điều kiện tín chỉ tối thiểu",
  "thời hạn nộp hồ sơ xin cấp chứng nhận và phụ lục đính kèm",
  "cách tính điểm trung bình tích lũy và điều kiện xét tốt nghiệp",
  "quy định về học lại, học cải thiện và đăng ký trễ so với lịch",
  "thủ tục xin bảng điểm, công chứng và thời gian chờ phản hồi",
  "chính sách miễn, giảm học phí và giấy tờ cần nộp bản scan",
  "lịch thi cuối kỳ, phòng thi dự phòng và quy định về máy tính bỏ túi",
  "điều kiện chuyển ngành, chuyển lớp và phê duyệt của khoa",
  "học phần thay thế tương đương khi chương trình đổi mã môn",
  "xin xác nhận tạm thời, cấp bản sao và mức phí từng loại giấy",
];

const PHRASE_C = [
  "— em đã đọc thông báo trên web nhưng vẫn chưa chắc bước tiếp theo cần làm gì.",
  "— phần này ảnh hưởng trực tiếp tới kế hoạch học kỳ tới của em nên em cần chốt sớm.",
  "— nếu có mẫu đơn hoặc link form chính thức thì em xin được chỉ giúp luôn ạ.",
  "— em lo bị trễ deadline vì đang chờ phản hồi từ phòng đào tạo từ tuần trước.",
  "— mong được tóm tắt ngắn các bước theo thứ tự để em làm đúng một lần cho xong.",
  "— trường hợp của em hơi đặc biệt vì em đã chuyển tín chỉ từ chương trình cũ sang mới.",
  "— em cũng muốn biết thêm ai là đầu mối trả lời nếu sau này cần bổ sung hồ sơ.",
  "— phần quy định in đậm trong PDF em đọc không rõ áp dụng từ học kỳ nào.",
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildFakeTitle(index: number): string {
  const rnd = mulberry32((index + 1) * 999983);
  const a = PHRASE_A[Math.floor(rnd() * PHRASE_A.length)]!;
  const b = PHRASE_B[Math.floor(rnd() * PHRASE_B.length)]!;
  const c = PHRASE_C[Math.floor(rnd() * PHRASE_C.length)]!;
  return `${a} ${b} ${c}`;
}

const FAKE_CHAT_HISTORY = Array.from({ length: 50 }, (_, i) => ({
  id: `fake-${i + 1}`,
  title: buildFakeTitle(i),
}));

export function SidebarChatbotPanel(props: {
  collapsed?: boolean;
}): JSX.Element {
  const { collapsed = false } = props;
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeId = searchParams.get("id");

  const onChatbotPath = useMemo(
    () =>
      location.pathname === CHATBOT_HREF ||
      location.pathname.startsWith(`${CHATBOT_HREF}/`),
    [location.pathname],
  );

  const collapsedHighlight = onChatbotPath && Boolean(activeId);

  const sectionActive = onChatbotPath;

  const [listOpen, setListOpen] = useState(true);

  if (collapsed) {
    return (
      <li className="mb-4">
        <Tooltip label="Chatbot" className="block w-full">
          <Link
            to={CHATBOT_HREF}
            className={`my-0.75 flex w-full items-center justify-center px-1 py-1 text-center text-[11px] leading-tight ${
              collapsedHighlight
                ? "text-brand-500 font-medium dark:text-white"
                : "font-normal text-gray-600 dark:text-gray-300"
            }`}
          >
            Chat
            <br />
            bot
          </Link>
        </Tooltip>
      </li>
    );
  }

  return (
    <li className="mb-4">
      <button
        type="button"
        onClick={() => setListOpen((o) => !o)}
        className="my-0.75 flex w-full items-center px-4 py-0.5 text-left"
        aria-expanded={listOpen}
        aria-controls="sidebar-chatbot-thread-list"
      >
        <span
          className={`inline-flex shrink-0 [&>svg]:h-5 [&>svg]:w-5 ${
            sectionActive
              ? "text-brand-500 dark:text-white"
              : "font-medium text-gray-600"
          }`}
        >
          <MdChat className="h-6 w-6" aria-hidden />
        </span>
        <p
          className={`ml-4 flex flex-1 text-base leading-1 font-medium ${
            sectionActive
              ? "text-navy-700 dark:text-white"
              : "font-medium text-gray-600"
          }`}
        >
          DS hội thoại
        </p>
        <span
          className={`ml-auto shrink-0 text-gray-500 transition-transform duration-200 ease-in-out dark:text-gray-300 ${
            listOpen ? "rotate-180" : "rotate-0"
          }`}
        >
          <MdKeyboardArrowDown className="h-5 w-5" aria-hidden />
        </span>
      </button>

      <ul
        id="sidebar-chatbot-thread-list"
        className={`mt-1.5 ml-4 flex list-none flex-col overflow-hidden transition-all duration-200 ease-in-out ${
          listOpen
            ? "mt-1 max-h-[4800px] gap-1 opacity-100"
            : "mt-0 max-h-0 gap-0 opacity-0"
        }`}
      >
        <li className="min-w-0 pr-4">
          <button
            type="button"
            onClick={() => navigate({ pathname: CHATBOT_HREF })}
            className="flex w-full cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-left text-base font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
          >
            <MdAdd
              className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400"
              aria-hidden
            />
            <span>Hội thoại mới</span>
          </button>
        </li>
        {FAKE_CHAT_HISTORY.map((item) => (
          <li key={item.id} className="relative min-w-0 pr-4">
            <Link
              to={{
                pathname: CHATBOT_HREF,
                search: `?id=${encodeURIComponent(item.id)}`,
              }}
              className={sidebarChildLink(activeId === item.id)}
              title={item.title}
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default SidebarChatbotPanel;
