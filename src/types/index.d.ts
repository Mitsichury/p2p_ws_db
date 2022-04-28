import { Server, WebSocket } from 'ws';

declare module 'ws' {
  export interface Server  {
    _url?: string;
  }  
  export interface WebSocket  {
    _url?: string;
  }
}