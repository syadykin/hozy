import { Modbus } from '~classes/Modbus';
import { Config, RegisterType } from '~classes/Modbus/types';
import { Info } from '~classes/Thing/types';

import { Switch } from './Switch';

export abstract class R extends Modbus {
  protected switches: Switch[] = [];

  static info(): Info {
    return {
      model: `VRC-R${this.ports}`,
      manufacturer: 'VKModule',
    };
  }

  public static readonly ports: number;

  constructor(
    config: Config,
    ports: number,
  ) {
    super(config, {
      [RegisterType.coil]: { length: ports },
    });

    for (let idx = 0; idx < ports; idx += 1) {
      this.switches.push(new Switch(this, idx));
    }
  }

  get entities(): Switch[] {
    return this.switches;
  }
}
