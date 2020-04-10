import { Config } from '~services/Modbus';
import { L } from './L';

export class L2 extends L {
  public static readonly ports = 2;

  constructor(
    config: Config,
  ) {
    super(config, L2.ports);
  }
}
