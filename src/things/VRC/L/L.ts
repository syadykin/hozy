import { Modbus } from '~classes/Modbus';
import { Config, RegisterType } from '~classes/Modbus/types';
import { Info } from '~classes/Thing/types';

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
