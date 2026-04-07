import { createFeedClient } from "@bairronow/shared-api-client";
import api from "./api";

export const feedClient = createFeedClient(api);
export type { FeedClient } from "@bairronow/shared-api-client";
