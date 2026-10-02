import type { ScheduleOptions } from "firebase-functions/scheduler";

export const scheduleOptions: ScheduleOptions = {
  schedule: "every minute",
  timeZone: "America/Sao_Paulo",
  region: "southamerica-east1",
};
