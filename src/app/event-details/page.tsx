import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EventDetails from "./event-details-client";

export const dynamic = "force-dynamic";

export default async function EventDetailsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <EventDetails />;
}
