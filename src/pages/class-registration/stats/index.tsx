import Card from "@/components/card";
import { classRegistrationsService } from "@/services/class-registration";
import type { ClassRegistrationStats } from "@/types/classRegistration";
import { message as toast } from "antd";
import React from "react";

const today = new Date().toISOString().slice(0, 10);

const ClassRegistrationStatsPage: React.FC = () => {
  const [from, setFrom] = React.useState(today);
  const [to, setTo] = React.useState(today);
  const [isDetail, setIsDetail] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState<ClassRegistrationStats | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const resp = await classRegistrationsService.getStats({ from, to, isDetail });
      setStats(resp);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải thống kê.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card extra="p-6">
      <h2 className="text-navy-700 text-xl font-bold dark:text-white">Thống kê</h2>
      <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
        Thống kê đăng ký lớp theo khoảng thời gian.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-11 rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-11 rounded-2xl border border-gray-200 bg-transparent px-4 text-sm outline-none dark:border-white/10 dark:text-white"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={isDetail}
            onChange={(e) => setIsDetail(e.target.checked)}
          />
          Lấy chi tiết
        </label>
        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="bg-brand-500 hover:bg-brand-600 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Đang tải..." : "Xem thống kê"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card extra="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-navy-700 text-2xl font-bold dark:text-white">
            {stats?.total ?? 0}
          </p>
        </Card>
        <Card extra="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Opened</p>
          <p className="text-navy-700 text-2xl font-bold dark:text-white">
            {Number(stats?.opened ?? 0)}
          </p>
        </Card>
        <Card extra="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Closed</p>
          <p className="text-navy-700 text-2xl font-bold dark:text-white">
            {Number(stats?.closed ?? 0)}
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <p className="text-sm font-bold text-navy-700 dark:text-white">Raw response</p>
        <pre className="mt-2 overflow-auto rounded-2xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-700 dark:border-white/10 dark:bg-navy-900 dark:text-gray-300">
          {JSON.stringify(stats ?? {}, null, 2)}
        </pre>
      </div>
    </Card>
  );
};

export default ClassRegistrationStatsPage;
