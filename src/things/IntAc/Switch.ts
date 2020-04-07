import { Entity } from '~classes/Entity';
import { OnOff } from '~classes/types';

import { IntAc } from './IntAc';

export class Switch extends Entity<IntAc, OnOff> {
  protected _state: OnOff = {
    enabled: false,
  }

  public readonly ip: string;

  constructor(thing: IntAc, ip: string) {
    super(thing);
    this.ip = ip;
  }

  get id(): string {
    return `${this.thing.id}/${this.ip}`;
  }

  get state(): OnOff {
    return this._state;
  }

  public set = (enabled: boolean): void => {
    if (enabled !== this._state.enabled) {
      this._state.enabled = enabled;
      this.emit('state', this.state);
    }
  }

  public change = async (state: OnOff): Promise<OnOff> => {
    if (state.enabled !== undefined &&
        this._state.enabled !== state.enabled) {
      await this.thing.write(this.ip, state.enabled);
    }

    return this.state;
  }
}
