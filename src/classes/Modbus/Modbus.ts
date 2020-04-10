import { ModbusRTU } from 'modbus-serial/ModbusRTU';

import { Thing } from '~classes/Thing';
import { Modbus as ModbusService } from '~services';
import { Thing as ModbusThing } from '~services/Modbus';

import { Config, RegisterConfig, RegisterData, RegisterType } from './types';

export declare interface Modbus extends Thing<Config>, ModbusThing {
  on<T extends RegisterType>(
    event: 'get',
    handler: (type: T, idx: number, value: RegisterData[T][0]) => void,
  ): this;
  on(
    event: string,
    handler: Function,
  ): this;
}

export abstract class Modbus extends Thing<Config> implements ModbusThing {
  protected service: ModbusService;
  protected registers: RegisterConfig;
  protected data: RegisterData;

  constructor(
    config: Config,
    registers: RegisterConfig,
  ) {
    super(config);

    const { type, port, options } = this.config;

    this.service = ModbusService.get(type, port, options);
    this.service.attach(this);

    this.registers = registers;

    this.data = Object.keys(this.registers).reduce(
      (cur: RegisterData, key: string): RegisterData => ({
        ...cur,
        [key]: [],
      }),
      {},
    );
  }

  get id(): string {
    return `/modbus/${[
      this.config.port.replace(/\//g, '.').replace(/^\./, ''),
      this.config.id,
    ].join('/')}`
  }

  public read = async (
    connection: ModbusRTU,
  ): Promise<void> => {
    connection.setID(this.config.id);

    let changed = false;

    for (const type of Object.keys(this.registers)) {
      const { start = 0, length } = this.registers[type];
      try {
        switch (type) {
          case RegisterType.coil: {
            const { data } = await connection.readCoils(start, length);
            if (!changed && JSON.stringify(data) !== JSON.stringify(this.data[type])) {
              changed = true;
            }
            this.data[type] = data;
            break;
          }

          case RegisterType.holding: {
            const { data } = await connection.readHoldingRegisters(start, length);
            if (!changed && JSON.stringify(data) !== JSON.stringify(this.data[type])) {
              changed = true;
            }
            this.data[type] = data;
            break;
          }
        }
      } catch (e) {
        console.error(`${this.config.port}~${this.config.id}: ${e.message}`);
      }
    }

    if (changed) {
      this.emit('get', this.data);
    }
  }

  public write = async <T extends RegisterType>(
    type: T,
    number: number,
    value: RegisterData[T][0],
  ): Promise<void> =>
    this.service.write(async (connection: ModbusRTU): Promise<void> => {
      connection.setID(this.config.id);

      switch (type) {
        case RegisterType.coil: {
          await connection.writeCoil(number, value as boolean);
          break;
        }

        case RegisterType.holding: {
          await connection.writeRegister(number, value as number);
          break;
        }
      }
    });

  public writeBulk = async <T extends RegisterType>(
    type: T,
    start: number,
    value: RegisterData[T],
  ): Promise<void> =>
    this.service.write(async (connection: ModbusRTU): Promise<void> => {
      connection.setID(this.config.id);

      switch (type) {
        case RegisterType.coil: {
          await connection.writeCoils(start, value as boolean[]);
          break;
        }

        case RegisterType.holding: {
          await connection.writeRegisters(start, value as number[]);
          break;
        }
      }
    });
};
