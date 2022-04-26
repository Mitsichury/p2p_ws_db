import axios from "axios";

const registry = "http://192.168.1.96:4000";

export function getRegistryIps() {
  return axios.get(registry);
}

export function sendIpToRegistry(ip) {
  return axios.post(`${registry}/add`, { ip });
}

export function removeIpFromRegistry(ip) {
  return axios.delete(`${registry}/remove/` + ip);
}
