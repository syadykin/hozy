import Modbus, { Config, RegisterType } from '~services/Modbus';
import { Info } from '~classes/Thing';

import { Dimmer } from './Dimmer';

export abstract class L extends Modbus {
  protected dimmers: Dimmer[] = [];

  static info(): Info {
    return {
      model: `VRC-L${this.ports}`,
      manufacturer: 'VKModule',
    };
  }

  public static readonly ports: number;

  constructor(
    config: Config,
    ports: number,
  ) {
    super(config, {
      [RegisterType.holding]: {
        start: 1,
        length: ports + 2,
      },
    });

    for (let idx = 0; idx < ports; idx += 1) {
      this.dimmers.push(new Dimmer(this, idx));
    }
  }

  get entities(): Dimmer[] {
    return this.dimmers;
  }
}
