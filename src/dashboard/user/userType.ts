import { Transaction } from "../transaction/transactionType";
import { Games } from "../casinoGames/gamestype";

export interface User {
  username: string;
  nickName?: string;
  activeStatus: boolean;
  password: string;
  designation: string;
  clientList: User[];
  transactions: Transaction[];
  favourite: Games[];
  lastLogin?: string;
  loginTimes: number;
  totalRecharged: number;
  totalRedeemed: number;
  credits: number;
  createdAt: Date;
}

export interface IBaseUser {
  name: string;
  username: string;
  status: string;
  password: string;
  role: string;
  clients: string[];
  transactions: any[];
  lastLogin: Date;
  loginTimes: number;
  totalRecharged: number;
  totalRedeemed: number;
  credits: number;
  createdAt: Date;
}

export interface IPlayer extends IBaseUser {
  favouriteGames: string[];
}

export interface Company extends IBaseUser {}
