import Card from "@/components/card";
import Tag from "@/components/tag/Tag";
import { settingsService } from "@/services/shared";
import { Role, RoleLabels, type Role as RoleType } from "@/types/users";
import { message } from "antd";
import React from "react";
import { MdAdd, MdClose, MdDomain, MdEdit, MdSave } from "react-icons/md";

type Props = {
  domainsByRole: Partial<Record<RoleType, string[]>> | null;
  onRefresh: () => Promise<void>;
};

const ROLE_TABS: RoleType[] = [Role.Student, Role.Admin];

const normalizeDomain = (value: string): string =>
  value.trim().replace(/^@+/, "").toLowerCase();

const uniqueDomains = (domains: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of domains) {
    const normalized = normalizeDomain(raw);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
};

const AllowedDomainsCard: React.FC<Props> = ({ domainsByRole, onRefresh }) => {
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [activeRole, setActiveRole] = React.useState<RoleType>(Role.Student);
  const [draftByRole, setDraftByRole] = React.useState<Partial<Record<RoleType, string[]>>>({});
  const [newDomain, setNewDomain] = React.useState("");

  // ── edit controls ──────────────────────────────────────────────────────────
  const handleEdit = () => {
    setDraftByRole(structuredClone(domainsByRole ?? {}));
    setNewDomain("");
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setNewDomain("");
  };

  const handleRemove = (index: number) => {
    setDraftByRole((prev) => {
      const cur = [...(prev[activeRole] ?? [])];
      cur.splice(index, 1);
      return { ...prev, [activeRole]: cur };
    });
  };

  const handleAdd = () => {
    const normalized = normalizeDomain(newDomain);
    if (!normalized) {
      return;
    }
    const list = (editing ? draftByRole : domainsByRole)?.[activeRole] ?? [];
    if (list.some((domain) => normalizeDomain(domain) === normalized)) {
      message.warning("Tên miền đã tồn tại.");
      return;
    }
    setDraftByRole((prev) => ({
      ...prev,
      [activeRole]: [...(prev[activeRole] ?? []), normalized],
    }));
    setNewDomain("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  // ── save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Partial<Record<RoleType, string[]>> = {
        [Role.Student]: uniqueDomains(draftByRole[Role.Student] ?? []),
        [Role.Admin]: uniqueDomains(draftByRole[Role.Admin] ?? []),
      };
      await settingsService.update("auth.roleDomains", payload);
      await onRefresh();
      setEditing(false);
      message.success("Cập nhật thành công.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cập nhật thất bại.";
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────
  const displayList = (editing ? draftByRole : domainsByRole)?.[activeRole] ?? [];

  return (
    <Card extra="p-6 flex flex-col gap-4 col-span-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MdDomain className="text-brand-500 h-5 w-5 shrink-0" />
          <h3 className="text-navy-700 text-xl font-bold dark:text-white">
          Cấu hình tên miền & phân quyền
          </h3>
        </div>

        {!editing ? (
          <button
            onClick={handleEdit}
            className="text-brand-500 hover:text-brand-600 flex items-center gap-1 text-sm font-medium transition-colors"
          >
            <MdEdit className="h-4 w-4" />
            Chỉnh sửa
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-4 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            >
              <MdSave className="h-4 w-4" />
              {saving ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        )}
      </div>

      {/* Role tabs */}
      <div className="flex flex-wrap gap-2">
        {ROLE_TABS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setActiveRole(r)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
              activeRole === r
                ? "bg-brand-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
            }`}
          >
            {RoleLabels[r]}
          </button>
        ))}
      </div>

      {activeRole === Role.Student && (
        <p className="text-gray-600 dark:text-gray-400">
          Hệ thống sẽ tự động đọc và xử lý email từ domain này.
        </p>
      )}
      {activeRole === Role.Admin && (
        <p className="text-gray-600 dark:text-gray-400">
          Dùng để định danh quyền truy cập trang quản trị.
        </p>
      )}

      {/* Domain list */}
      {displayList.length === 0 ? (
        <p className="text-sm text-gray-600 italic dark:text-gray-400">
          Chưa có tên miền nào được cấu hình.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {displayList.map((domain, i) => (
            <Tag
              key={i}
              interactive={false}
              className="flex items-center gap-1 px-2 text-sm!"
            >
              @{normalizeDomain(domain)}
              {editing && (
                <button
                  onClick={() => handleRemove(i)}
                  className="ml-1 transition-colors hover:text-red-500"
                  aria-label={`Remove ${domain}`}
                >
                  <MdClose className="h-3.5 w-3.5" />
                </button>
              )}
            </Tag>
          ))}
        </div>
      )}

      {/* Add new domain input (edit mode only) */}
      {editing && (
        <div className="flex items-center gap-2">
          <div className="relative w-full">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              @
            </span>
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="example.com"
              className="focus:ring-brand-500 w-full rounded-xl border border-gray-300 bg-transparent py-1.5 pr-3 pl-7 text-gray-700 transition-colors outline-none placeholder:text-gray-500 dark:bg-transparent dark:text-white dark:placeholder:text-gray-400"
            />
          </div>
          <button
            onClick={handleAdd}
            className="bg-brand-500 hover:bg-brand-600 flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-white transition-colors"
          >
            <MdAdd className="h-4 w-4" />
            Thêm
          </button>
        </div>
      )}
    </Card>
  );
};

export default AllowedDomainsCard;
