import { Config } from '~classes/Modbus/types';
import { L } from './L';

export class L8 extends L {
  public static  ports = 8;

  constructor(
    config: Config,
  ) {
    super(config, L8.ports);
  }
}
