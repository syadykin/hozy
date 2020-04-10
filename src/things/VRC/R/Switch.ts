import { RegisterType, RegisterData } from '~services/Modbus';
import { Entity } from '~classes/Entity';
import { OnOff } from '~classes/types';

import { R } from './R';

export class Switch extends Entity<R, OnOff> {
  protected idx: number;

  protected _state: OnOff = {
    enabled: false,
  };

  constructor(
    thing: R,
    idx: number,
  ) {
    super(thing);
    this.idx = idx;
    this.thing.on('get', this.read);
  }

  get id(): string {
    return `${this.thing.id}/${this.idx}`;
  }

  get state(): OnOff {
    return this._state;
  }

  change = async (state: OnOff): Promise<OnOff> => {
    if (state.enabled !== this._state.enabled) {
      this.thing.write(RegisterType.coil, this.idx, state.enabled);
    }

    return this.state;
  }

  protected read = (
    data: RegisterData,
  ): void => {
    const state = data[RegisterType.coil][this.idx];

    if (state !== this._state.enabled) {
      this._state.enabled = state;
      this.emit('state', this._state);
    }
  }
}
