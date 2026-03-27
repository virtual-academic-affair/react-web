/**
 * User dashboard — simple landing: header + full-screen video + left text overlay.
 * Public page at "/". On login click:
 *   - Has token + admin  → /admin/email/config
 *   - Has token + student/lecture → /user (already here)
 *   - No token           → /auth/login
 */

import logoBgColor from "@/assets/img/logo/logo-bg-color.svg";
import heroVideo from "@/assets/video/home.mp4";
import { useAuthStore } from "@/stores/auth.store";
import React from "react";
import { LuLogIn } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

const UserDashboard: React.FC = () => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const userRole = useAuthStore((s) => s.userRole);
  const navigate = useNavigate();

  const handleJoin = () => {
    if (accessToken) {
      if (userRole === "admin") {
        navigate("/admin/email/config", { replace: true });
      } else {
        navigate("/user", { replace: true });
      }
    } else {
      navigate("/auth/login");
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="fixed top-0 right-0 left-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <a href="/" aria-label="Trang chủ">
          <img
            src={logoBgColor}
            alt="Giáo vụ số"
            className="h-10 w-auto object-contain dark:brightness-110"
          />
        </a>

        <button
          onClick={handleJoin}
          className="bg-brand-500 hover:bg-brand-600 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold text-white transition-colors"
        >
          <LuLogIn className="text-lg" />
          {"Đăng nhập"}
        </button>
      </header>

      {/* ── Video + Text overlay ──────────────────────────────── */}
      <div className="relative h-full w-full">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          src={heroVideo}
          aria-label="Giới thiệu hệ thống Giáo vụ số"
        />

        {/* Gradient overlay */}
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-transparent"
          aria-hidden
        />

        {/* Left text content */}
        <div className="relative z-10 flex h-full flex-col justify-center px-6 md:px-12 lg:px-16">
          <h1 className="mb-3 max-w-xl text-3xl leading-tight font-bold tracking-tight text-white uppercase sm:text-4xl lg:text-7xl">
            <div className="mb-1 text-sm tracking-widest uppercase">
              Hệ thống
            </div>
            <div className="font-momo-display text-7xl font-semibold tracking-wider">
              Giáo vụ số
            </div>
          </h1>
          <p className="mt-3 text-base leading-loose text-white/80 md:text-lg">
            Tra cứu thông tin học vụ tiện lợi với{" "}
            <span className="font-momo-signature font-bold">
              Virtual Academic Affair
            </span>
            . <br />
            Hệ thống hỗ trợ giáo vụ thông minh dành riêng cho{" "}
            <span className="font-bold">FIT-HCMUS</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
