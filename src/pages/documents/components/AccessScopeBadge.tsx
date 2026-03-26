import Tag from "@/components/tag/Tag";
import { Role, RoleColors } from "@/types/users";

interface AccessScopeBadgeProps {
  value?: string;
  className?: string;
}

const AccessScopeBadge: React.FC<AccessScopeBadgeProps> = ({
  value,
  className = "",
}) => {
  // lecture → Giảng viên sáng, Sinh viên gray
  // student → Sinh viên sáng, Giảng viên gray
  // both/private → cả 2 gray
  const isLectureBright = value === "lecture" || value === "both";
  const isStudentBright = value === "student" || value === "both";

  return (
    <div className={`flex gap-1.5 ${className}`}>
      {isLectureBright && (
        <Tag color={isLectureBright ? RoleColors[Role.Lecture].hex : "gray"}>
          Giảng viên
        </Tag>
      )}
      {isStudentBright && (
        <Tag color={isStudentBright ? RoleColors[Role.Student].hex : "gray"}>
          Sinh viên
        </Tag>
      )}
      {value === "private" && <Tag color="gray">Nội bộ</Tag>}
    </div>
  );
};

export default AccessScopeBadge;
