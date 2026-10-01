import type { Timestamp } from "firebase/firestore";

export class DateUtil {
  public static formatDate(date: Timestamp | Date | string): string {
    if (date instanceof Date) {
      return date.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
    }

    if (typeof date === "string") {
      return new Date(date).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
    }

    return date.toDate().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
  }
}
