import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/card";
import { SignOutButton } from "@/components/app-shell/sign-out-button";
import { ProfileForm } from "@/components/settings/profile-form";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  let email = user?.email ?? "";
  let fullName = "";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();
    if (profile) {
      email = profile.email;
      fullName = profile.full_name ?? "";
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your account details.</p>
      </div>

      <Card>
        <CardHeader title="Profile" description="Your account information" />
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email</label>
            <p className="text-sm text-muted">{email}</p>
          </div>
          <ProfileForm initialFullName={fullName} />
        </div>
      </Card>

      <Card>
        <CardHeader title="Sign out" description="End your current session on this device" />
        <SignOutButton />
      </Card>

      <DeleteAccountSection />
    </div>
  );
}
