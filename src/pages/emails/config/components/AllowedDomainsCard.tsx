import Card from "@/components/card";
import { allowedDomainsService } from "@/services/email";
import type { UpdateAllowedDomainsDto } from "@/types/email";
import { message } from "antd";
import React from "react";
import { MdAdd, MdClose, MdDomain, MdEdit, MdSave } from "react-icons/md";

const AllowedDomainsCard: React.FC = () => {
  const [domains, setDomains] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<string[]>([]);
  const [newDomain, setNewDomain] = React.useState("");

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchDomains = async () => {
    setLoading(true);
    try {
      const data = await allowedDomainsService.getAllowedDomains();
      setDomains(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Tải danh sách tên miền thất bại.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDomains();
  }, []);

  // ── edit controls ──────────────────────────────────────────────────────────
  const handleEdit = () => {
    setDraft([...domains]);
    setNewDomain("");
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setNewDomain("");
  };

  const handleRemove = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAdd = () => {
    const trimmed = newDomain.trim();
    if (!trimmed) {
      return;
    }
    if (draft.includes(trimmed)) {
      message.warning("Tên miền đã tồn tại.");
      return;
    }
    setDraft((prev) => [...prev, trimmed]);
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
      const dto: UpdateAllowedDomainsDto = { domains: draft };
      await allowedDomainsService.updateAllowedDomains(dto);
      setDomains(draft);
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
  const displayList = editing ? draft : domains;

  return (
    <Card extra="p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MdDomain className="text-brand-500 h-5 w-5 shrink-0" />
          <h3 className="text-navy-700 text-xl font-bold dark:text-white">
            Tên miền được phép
          </h3>
        </div>

        {!editing ? (
          <button
            onClick={handleEdit}
            disabled={loading}
            className="text-brand-500 hover:text-brand-600 flex items-center gap-1 text-sm font-medium transition-colors disabled:opacity-50"
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

      <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
        Chỉ những email từ các tên miền này mới được đồng bộ.
      </p>

      {/* Domain list */}
      {loading ? (
        <div className="flex flex-wrap gap-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="dark:bg-navy-700 h-7 w-24 animate-pulse rounded-full bg-gray-200"
            />
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <p className="text-sm text-gray-600 italic dark:text-gray-400">
          Chưa có tên miền nào được cấu hình.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {displayList.map((domain, i) => (
            <span
              key={i}
              className="bg-brand-50 text-brand-600 dark:bg-navy-700 flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium dark:text-white"
            >
              {domain}
              {editing && (
                <button
                  onClick={() => handleRemove(i)}
                  className="ml-1 transition-colors hover:text-red-500"
                  aria-label={`Remove ${domain}`}
                >
                  <MdClose className="h-3.5 w-3.5" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Add new domain input (edit mode only) */}
      {editing && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="vd: example.com"
            className="focus:ring-brand-500 w-full rounded-xl border border-gray-300 bg-transparent px-3 py-1.5 text-gray-700 transition-colors outline-none placeholder:text-gray-500 dark:bg-transparent dark:text-white dark:placeholder:text-gray-400"
          />
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
