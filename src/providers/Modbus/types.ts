import ModbusRTU from 'modbus-serial';
import {
  SerialPortOptions, SerialPortUnixPlatformOptions, TcpPortOptions,
  UdpPortOptions, TcpRTUPortOptions, TelnetPortOptions,
} from 'modbus-serial/ModbusRTU';

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


export interface Thing {
  read: (connection: ModbusRTU) => Promise<void>;
}

export type ModbusCallback = (connection: ModbusRTU) => Promise<void>;
