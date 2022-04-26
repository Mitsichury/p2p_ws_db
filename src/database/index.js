import crypto from "crypto";

export function initializeDatabase() {
  let p2pUsers = [];
  let database = {};

  return {
    addIp: (ips) => {
      p2pUsers = [...new Set([...p2pUsers, ...ips])];
      return p2pUsers;
    },

    removeIp: (ipToRemove) => {
      p2pUsers = p2pUsers.filter((ip) => ip != ipToRemove);
    },

    ipExists: (ipToRemove) => {
      return !!p2pUsers.filter((ip) => ip == ipToRemove)[0];
    },

    getIps: () => {
      return p2pUsers;
    },

    containsUnknownIps: (newIps) => {
      return newIps.filter((ip) => p2pUsers.indexOf(ip) == -1).length > 0;
    },

    addEntry: (entry, id) => {
      const entryId = id || hashObject(entry);
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
      return Object.keys(database).indexOf(key) != -1;
    },
  };
}

function hashObject(object) {
  const stringObject = JSON.stringify(object);
  const hashed = crypto.createHash("sha256").update(stringObject, "utf-8");
  return hashed.digest("hex");
}

export function isHashConsistent(object, expectedId) {
  return hashObject(object) == expectedId;
}