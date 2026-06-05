import { trpcServer, HydrateClient } from "~/clients/trpc/server";
import { ErrorBoundary } from "~/components/core/error-boundary";
import { TrustClawChat } from "./_components/chat/trustclaw-chat";
import { OnboardingClient } from "./_components/onboarding/onboarding-client";

import { Suspense } from "react";
import { TrustClawChatSkeleton } from "./_components/chat/trustclaw-chat.skeleton";

export default async function Page() {
  void trpcServer.api.trustclaw.getHistory.prefetchInfinite({ limit: 10 });
  void trpcServer.api.trustclaw.getStreamingMessage.prefetch();

  const status = await trpcServer.api.trustclaw.getStatus();

  if (!status.hasInstance) {
    void trpcServer.api.trustclaw.getInstance.prefetch();

    return (
      <HydrateClient>
        <ErrorBoundary>
          <OnboardingClient
            hasExistingInstance={status.hasInstance}
            hasOnboardingState={status.hasOnboardingState}
          />
        </ErrorBoundary>
      </HydrateClient>
    );
  }

  return (
    <HydrateClient>
      <ErrorBoundary>
        <Suspense fallback={<TrustClawChatSkeleton />}>
          <TrustClawChat />
        </Suspense>
      </ErrorBoundary>
    </HydrateClient>
  );
}
