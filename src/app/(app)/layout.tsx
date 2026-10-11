import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileTabBar } from "@/components/app-shell/sidebar";
import { SignOutButton } from "@/components/app-shell/sign-out-button";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  let displayName = auth.user?.email ?? "";
  if (auth.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", auth.user.id)
      .single();
    displayName = profile?.full_name || profile?.email || displayName;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex md:w-64 flex-col border-r border-border bg-surface">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-end gap-4 border-b border-border bg-surface px-4 md:px-8 py-3">
          <span className="text-sm text-muted truncate max-w-[12rem]">{displayName}</span>
          <SignOutButton />
        </header>

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      <div className="md:hidden fixed bottom-0 inset-x-0 border-t border-border bg-surface">
        <MobileTabBar />
      </div>
    </div>
  );
}
