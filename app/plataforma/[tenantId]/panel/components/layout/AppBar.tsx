"use client";

import { LogOut, User, Menu, Bell } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";

type Role = "PATIENT" | "PROFESSIONAL" | "ADMIN";

interface AppBarProps {
    isMobile: boolean;
    setMobileDrawerOpen: Dispatch<SetStateAction<boolean>>;
    userName: string;
    logout: () => void;
    asideWidth: number;
    tenantId: string;
    role: Role;
}

export default function AppBar({
    isMobile,
    setMobileDrawerOpen,
    userName,
    logout,
    asideWidth,
    tenantId,
    role,
}: AppBarProps) {
    const [notifications, setNotifications] = useState<Array<{ id: string; message: string }>>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const lastCheckRef = useRef(new Date(Date.now() - 5 * 60 * 1000).toISOString());
    const [mounted, setMounted] = useState(false);
    const canNotify = role === "ADMIN" || role === "PROFESSIONAL" || role === "SUPERVISOR";

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!canNotify || !tenantId) return;
        let cancelled = false;
        const fetchNotifications = async () => {
            try {
                const res = await fetch(
                    `/api/plataforma/${tenantId}/notifications?since=${encodeURIComponent(lastCheckRef.current)}`,
                    { credentials: "include" }
                );
                if (!res.ok) return;
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;
                const items = Array.isArray(data.items) ? data.items : [];
                if (items.length > 0) {
                    setNotifications((prev) => [...items, ...prev].slice(0, 20));
                    setUnreadCount((prev) => prev + items.length);
                }
                if (data.now) {
                    lastCheckRef.current = data.now;
                }
            } catch {
                // ignore polling errors
            }
        };
        const interval = setInterval(fetchNotifications, 30000);
        fetchNotifications();
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [canNotify, tenantId]);

    const notificationItems = useMemo(() => {
        if (notifications.length === 0) {
            return [
                <DropdownItem key="empty" isDisabled>
                    Sin notificaciones nuevas
                </DropdownItem>,
            ];
        }
        return notifications.map((item) => (
            <DropdownItem key={item.id}>{item.message}</DropdownItem>
        ));
    }, [notifications]);

    return (
        <header 
            className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4 md:px-6 shadow-sm transition-all duration-300"
            style={{
                marginLeft: isMobile ? 0 : `${asideWidth}px`,
            }}
        >
            <div className="flex items-center gap-4">
                {isMobile && (
                    <button
                        onClick={() => setMobileDrawerOpen((v) => !v)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        aria-label="Toggle menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-4">
                {mounted && canNotify && (
                    <Dropdown onOpenChange={(open) => open && setUnreadCount(0)}>
                        <DropdownTrigger>
                            <Button variant="bordered" isIconOnly aria-label="Notificaciones">
                                <span className="relative">
                                    <Bell className="w-4 h-4" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-danger" />
                                    )}
                                </span>
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Action event example" onAction={() => setUnreadCount(0)}>
                            {notificationItems}
                        </DropdownMenu>
                    </Dropdown>
                )}

                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <User className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 pr-2">
                        {userName}
                    </span>
                </div>

                <button
                    onClick={logout}
                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-all duration-200"
                    title="Cerrar sesión"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}