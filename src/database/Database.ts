import crypto from "crypto";
import { TransactionStatus } from '../model/TransactionStatus';
import { Entry } from './Entry';

export class Database {
  p2pUsers: string[];
  database: Record<string, Entry>;

  constructor() {
    this.p2pUsers = [];
    this.database = {};
  }

  addIp = (ips: string[]) => {
    this.p2pUsers = [...new Set([...this.p2pUsers, ...ips])];
    return this.p2pUsers;
  }

  removeIp = (ipToRemove: string) => {
    this.p2pUsers = this.p2pUsers.filter((ip) => ip != ipToRemove);
  }

  ipExists = (ipToFind: string) => {
    return !!this.p2pUsers.filter((ip) => ipToFind == ip)[0];
  }

  getIps = () => {
    return this.p2pUsers;
  }

  containsUnknownIps = (newIps: string[]) => {
    return newIps.filter((ip) => this.p2pUsers.indexOf(ip) == -1).length > 0;
  }

  addEntry = (entry: Entry, id?: string) => {
    const entryId = id || hashObject(entry);
    this.database[entryId] = entry;
    return { key: entryId, value: entry };
  }

  editEntry = (id: string, status: TransactionStatus) => {
    this.database[id]!.status = status;
  }

  addAll = (entries: Record<string, Entry>) => {
    this.database = { ...entries };
  }

  getEntries = () => {
    return this.database;
  }

  getEntry = (id: string) => {
    return this.database[id];
  }

  entryExists = (id: string) => {
    return Object.keys(this.database).indexOf(id) != -1;
  }
}

function hashObject(entry: Entry) {
  const stringObject = JSON.stringify(entry);
  const hashed = crypto.createHash("sha256").update(stringObject, "utf-8");
  return hashed.digest("hex");
}

export function isHashConsistent(entry: Entry, expectedId: string) {
  return hashObject(entry) == expectedId;
}