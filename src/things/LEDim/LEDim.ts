import Modbus, { Config, RegisterType } from '~services/Modbus';

import { Channel } from './Channel';

export class LEDim extends Modbus {
  private channels: Channel[];

  constructor(config: Config) {
    super(config, {
      [RegisterType.holding]: { length: 7 },
    });

    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    this.channels = [ new Channel(this) ];
  }

  get entities(): Channel[] {
    return this.channels;
  }
}

