import { SocketUser } from "../../socket/userSocket";

export interface GDataType {
    playerSocket: SocketUser | undefined
}

export enum GAMETYPE {
    SLOT = "SL",
    KENO = "KN",
}

export interface UserData {
    Balance: number;
    haveWon: number;
    currentWining: number;
}
