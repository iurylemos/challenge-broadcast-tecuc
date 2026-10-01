import { RouterPath } from "../interfaces/router.interface";

export class RouterUtil {
  public static generateRouteContacts(connectionId: string): string {
    return `${RouterPath.CONNECTIONS}/${connectionId}${RouterPath.CONTACTS}`;
  }

  public static generateRouteMessages(connectionId: string): string {
    return `${RouterPath.CONNECTIONS}/${connectionId}${RouterPath.MESSAGES}`;
  }
}
