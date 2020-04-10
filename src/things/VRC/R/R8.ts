import { Config } from '~services/Modbus';
import { R } from './R';

export class R8 extends R {
  public static readonly ports = 8;

  constructor(
    config: Config,
  ) {
    super(config, R8.ports);
  }
}
