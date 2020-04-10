import { Config as ThingConfig } from '~classes/Thing';
import { ConnectionType, ModbusOptions } from '~providers/Modbus';

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
