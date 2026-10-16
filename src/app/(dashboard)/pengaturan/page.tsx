"use client";

import { useEffect, useState } from "react";
import { SettingsForm } from "@/components/settings/settings-form";
import { getUserSettings } from "@/server/actions/settings-actions";

interface UserSettings {
  id: string;
  nama: string;
  email: string;
  role: string;
  batchDeleteEnabled: boolean;
}

export default function PengaturanPage() {
  const [user, setUser] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserSettings()
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-lg" />
          <div>
            <div className="h-6 bg-gray-200 rounded w-44" />
            <div className="h-4 bg-gray-100 rounded w-60 mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <div className="h-48 bg-gray-100 rounded-2xl" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <div className="h-40 bg-gray-100 rounded-2xl" />
            <div className="h-40 bg-gray-100 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Gagal memuat pengaturan.</p>
      </div>
    );
  }

  return <SettingsForm user={user} />;
}
