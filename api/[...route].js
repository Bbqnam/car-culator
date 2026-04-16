import { handleCarAiRequest } from "../server/carai-proxy.mjs";

export default async function handler(req, res) {
  await handleCarAiRequest(req, res);
}
