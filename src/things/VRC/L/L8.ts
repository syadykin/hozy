import { Config } from '~services/Modbus';
import { L } from './L';

export class L8 extends L {
  public static  ports = 8;

  constructor(
    config: Config,
  ) {
    super(config, L8.ports);
  }
}
