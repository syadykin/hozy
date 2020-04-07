import { Config } from '~classes/Modbus/types';
import { R } from './R';

export class R8 extends R {
  public static readonly ports = 8;

  constructor(
    config: Config,
  ) {
    super(config, R8.ports);
  }
}
