import axios from "axios";

export function getRegistryIps() {
  return axios.get(process.env.REGISTRY!);
}

export function sendIpToRegistry(ip: string) {
  return axios.post(`${process.env.REGISTRY}/add`, { ip });
}

export function removeIpFromRegistry(ip: string) {
  return axios.delete(`${process.env.REGISTRY}/remove/` + ip);
}
