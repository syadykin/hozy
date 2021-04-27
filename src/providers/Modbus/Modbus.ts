import { priorityQueue, AsyncPriorityQueue } from 'async';
import { EventEmitter } from 'events';
import ModbusRTU from 'modbus-serial';
import {
  ModbusRTU as ModbusRTUType,
  SerialPortOptions,
  TcpPortOptions, TcpRTUPortOptions,
  UdpPortOptions,
  TelnetPortOptions,
} from 'modbus-serial/ModbusRTU';

import {
  ModbusOptions,
  ConnectionType, ModbusCallback,
} from './types';

import { Thing } from './types';

interface Connections {
  [port: string]: Modbus;
}


const delay = 500;

export class Modbus extends EventEmitter {
  private static services: Connections = { };

  private type: ConnectionType;
  private port: string;
  private options?: ModbusOptions;

  private devices: Thing[] = [];
  private current = 0;

  private connection: ModbusRTUType;
  private queue: AsyncPriorityQueue<ModbusCallback>;
  private timer: NodeJS.Timeout;

  public static get(
    type: ConnectionType,
    port: string,
    options: ModbusOptions,
  ): Modbus {
    // TODO: warn if type/options differ
    if (!this.services[port]) {
      this.services[port] = new Modbus(type, port, options);
    }

    return this.services[port];
  }

  constructor(
    type: ConnectionType,
    port: string,
    options: ModbusOptions,
  ) {
    super();

    this.type = type;
    this.port = port;
    this.options = options;
    this.connection = new ModbusRTU();
    this.connection.setTimeout(2000);
    this.queue = priorityQueue(this.worker, 1);
    this.queue.drain(this.drain);
  }

  public write = (func: ModbusCallback): void => {
    this.queue.push(func, 1);
  }

  private async connect(): Promise<void> {
    switch (this.type) {
      case ConnectionType.RTU: {
        await this.connection.connectRTU(
          this.port,
          this.options as SerialPortOptions,
        );
        break;
      }

      case ConnectionType.TCP: {
        const [ host, port = "8502" ] = this.port.split(':');
        await this.connection.connectTCP(
          host,
          {
            port: parseInt(port, 10),
            ...(this.options as TcpPortOptions || {}),
          },
        );
        break;
      }

      case ConnectionType.UDP: {
        const [ host, port = "8502" ] = this.port.split(':');
        await this.connection.connectUDP(
          host,
          {
            port: parseInt(port, 10),
            ...(this.options as UdpPortOptions || {}),
          },
        );
        break;
      }

      case ConnectionType.RTUBuffered: {
        await this.connection.connectRTUBuffered(
          this.port,
          this.options as SerialPortOptions,
        );
        break;
      }

      case ConnectionType.TcpRTUBuffered: {
        const [ host, port = "8502" ] = this.port.split(':');
        await this.connection.connectTcpRTUBuffered(
          host,
          {
            port: parseInt(port, 10),
            ...(this.options as TcpRTUPortOptions || {}),
          },
        );
        break;
      }

      case ConnectionType.Telnet: {
        const [ host, port = "9761" ] = this.port.split(':');
        await this.connection.connectTelnet(
          host,
          {
            port: parseInt(port, 10),
            ...(this.options as TelnetPortOptions || {}),
          },
        );
        break;
      }

      case ConnectionType.AsciiSerial: {
        await this.connection.connectAsciiSerial(
          this.port,
          this.options as SerialPortOptions,
        );
        break;
      }
    }
  }

  public attach = (
    device: Thing,
  ): void => {
    this.devices.push(device);
    if (this.devices.length === 1) {
      this.drain();
    }
  }

  public detach = (
    device: Thing,
  ): void => {
    const idx = this.devices.indexOf(device);
    if (idx !== -1) {
      if (this.current === this.devices.length - 1) {
        this.current = 0;
      }
      this.devices.splice(idx, 1);
    }
  }

  private drain = (): void => {
    clearTimeout(this.timer);

    // stop loop if no devices
    if (this.devices.length === 0) {
      return;
    }

    this.timer = setTimeout(() => {
      const idx = Math.min(this.devices.length - 1, this.current);
      this.queue.push(this.devices[idx].read, 0);
      this.current = (this.current + 1) % this.devices.length;
    }, delay);
  }

  private worker = async (
    func: ModbusCallback,
    done: () => void,
  ): Promise<void> => {
    try {
      if (!this.connection.isOpen) {
        console.error(`${this.port} (re)connect`);
        await new Promise((ok) => this.connection.close(ok));
        await this.connect();
      }
      await func(this.connection);
    } catch (e) {
      console.error('Worker error:', e);
    }
    done();
  }
}