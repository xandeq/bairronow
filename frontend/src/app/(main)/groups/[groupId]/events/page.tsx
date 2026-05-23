"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function GroupEventsRedirectPage() {
  const router = useRouter();
  const params = useParams<{ groupId: string }>();

  useEffect(() => {
    router.replace(`/groups/${params.groupId}/`);
  }, [router, params.groupId]);

  return null;
}
