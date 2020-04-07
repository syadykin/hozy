import {
  SerialPortOptions, SerialPortUnixPlatformOptions,
  TcpPortOptions,
  UdpPortOptions,
  TcpRTUPortOptions,
  TelnetPortOptions,
  ModbusRTU,
} from 'modbus-serial/ModbusRTU';

import { Config as ThingConfig } from '~classes/Thing';

export enum ConnectionType {
  RTU = 'RTU',
  TCP = 'TCP',
  UDP = 'UDP',
  RTUBuffered = 'RTUBuffered',
  TcpRTUBuffered = 'TcpRTUBuffered',
  Telnet = 'Telnet',
  AsciiSerial = 'AsciiSerial',
}

export type ModbusOptions =
  | SerialPortOptions
  | SerialPortUnixPlatformOptions
  | TcpPortOptions
  | UdpPortOptions
  | TcpRTUPortOptions
  | TelnetPortOptions;

export interface Config extends ThingConfig {
  type: ConnectionType;
  port: string;
  options?: ModbusOptions;
  id: number;
}

export enum RegisterType {
  coil = 'coil',
  holding = 'holding',
}

export interface Register {
  start?: number;
  length: number;
}

export type RegisterConfig = {
  [type in RegisterType]?: Register;
}

export type RegisterData = {
  [RegisterType.coil]?: boolean[];
  [RegisterType.holding]?: number[];
}

export type ConnectionCallback = (connection: ModbusRTU) => Promise<void>;
