import { expireEndedPlans } from "../repo/users.repo";

export async function processPlanExpiration(): Promise<{ expired: number }> {
  const expired = await expireEndedPlans(new Date());
  console.log("[processPlanExpiration] plans expired", { expired });
  return { expired };
}
