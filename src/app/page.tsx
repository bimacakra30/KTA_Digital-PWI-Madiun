import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

async function HomeRedirect() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }

  // redirect() throws, so this is never reached.
  // But TypeScript needs a ReactNode return type.
  return null;
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeRedirect />
    </Suspense>
  );
}
