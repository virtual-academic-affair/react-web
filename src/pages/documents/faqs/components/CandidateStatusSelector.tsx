
import Tag from "@/components/tag/Tag";

type CandidateStatus = "pending" | "approved" | "rejected";

interface CandidateStatusSelectorProps {
  value: CandidateStatus;
  onChange: (newValue: CandidateStatus) => void;
  disabled?: boolean;
  className?: string;
}

const STATUS_LABELS: Record<CandidateStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

const STATUS_COLORS: Record<CandidateStatus, string> = {
  pending: "#eab308", // amber-500
  approved: "#22c55e", // green-500
  rejected: "#ef4444", // red-500
};

export default function CandidateStatusSelector({
  value,
  onChange,
  disabled,
  className = "",
}: CandidateStatusSelectorProps) {
  const options = Object.entries(STATUS_LABELS).map(([val, label]) => ({
    value: val,
    label,
  }));

  return (
    <Tag
      variant="selection"
      color={STATUS_COLORS[value]}
      value={value}
      options={options}
      optionColors={STATUS_COLORS}
      onChange={(v) => onChange(v as CandidateStatus)}
      disabled={disabled}
      className={className}
    >
      {STATUS_LABELS[value]}
    </Tag>
  );
}
