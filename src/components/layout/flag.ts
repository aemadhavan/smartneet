// add flags.ts
import { statsigAdapter, type StatsigUser } from "@flags-sdk/statsig";
import { flag, dedupe } from "flags/next";
import type { Identify } from "flags";
import { auth } from "@clerk/nextjs/server";
//import { statsig } from "@/lib/statsig";

export const identify = dedupe((async () => {
  const { userId } = await auth();
  return {
    userID: userId || "anonymous" // Use Clerk user ID or fallback to anonymous
  };
}) satisfies Identify<StatsigUser>);

export const createFeatureFlag = (key: string) => flag<boolean, StatsigUser>({
  key,
  adapter: statsigAdapter.featureGate((gate) => gate.value, { exposureLogging: true }),
  identify,
});