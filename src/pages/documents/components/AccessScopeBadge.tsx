import Tag from "@/components/tag/Tag";
import { Role, RoleColors } from "@/types/users";

interface AccessScopeBadgeProps {
  value?: string | string[] | null;
  className?: string;
}

const AccessScopeBadge: React.FC<AccessScopeBadgeProps> = ({
  value,
  className = "",
}) => {
  const scopes = Array.isArray(value)
    ? value
    : value
      ? [value]
      : [];

  const hasLecture = scopes.includes("lecture");
  const hasStudent = scopes.includes("student");
  const isInternal = scopes.length === 0;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {hasLecture && <Tag color={RoleColors[Role.Lecture].hex}>Giảng viên</Tag>}
      {hasStudent && <Tag color={RoleColors[Role.Student].hex}>Sinh viên</Tag>}
      {isInternal && <Tag color="gray">Nội bộ</Tag>}
    </div>
  );
};

export default AccessScopeBadge;
