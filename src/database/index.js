import { v4 as uuidv4 } from "uuid";

export function initializeDatabase() {
  let p2pUsers = [];
  let database = {};

  return {
    addIp: (ips) => {
      p2pUsers = [...new Set([...p2pUsers, ...ips])];
      return p2pUsers;
    },

    getIps: () => {
      return p2pUsers;
    },

    containsUnknownIps: (newIps) => {
      return newIps.filter((ip) => p2pUsers.indexOf(ip) == -1).length > 0;
    },

    addEntry: (entry, id) => {
      console.log(entry, id);
      const entryId = id || uuidv4();
      database[entryId] = entry;
      return { key: entryId, value: entry };
    },

    addAll: (entries) => {
      database = { ...entries };
    },

    getEntries: () => {
      return database;
    },

    entryExists: (key) => {
      return Object.keys(database).indexOf(key) == -1;
    },
  };
}
