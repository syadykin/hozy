import { Entity } from '~classes/Entity';
import { RegisterType, RegisterData } from '~classes/Modbus';

import { L } from './L';
import { Brightness, OnOff } from '~classes/types';

type TDimmer = OnOff & Brightness;

export class Dimmer extends Entity<L, TDimmer> {
  protected idx: number;

  protected _state: TDimmer = {
    enabled: false,
    brightness: 0,
  }

  protected _preset: Brightness = {
    brightness: 0,
  }

  /**
   * Content of remote states register
   */
  protected states: number;

  constructor(
    thing: L,
    idx: number,
  ) {
    super(thing);
    this.idx = idx;
    this.thing.on('get', this.read);
  }

  get id(): string {
    return `${this.thing.id}/${this.idx}`;
  }

  get state(): TDimmer {
    return Object.freeze(Object.assign({}, this._state));
  }

  private read = (
    data: RegisterData,
  ): void => {
    const { ports } = this.thing.constructor.prototype.constructor;
    let changed = false;

    const enabled = !!(data[RegisterType.holding][ports + 1] & (1 << this.idx));
    if (enabled !== this._state.enabled) {
      this._state.enabled = enabled;
      changed = true;
    }

    const brightness = data[RegisterType.holding][this.idx];
    const current = brightness & 0xff;
    if (current !== this._state.brightness) {
      this._state.brightness = current;
      changed = true;
    }

    if (changed) {
      this.emit('state', this._state);
    }

    const preset = (brightness & 0xff00) >> 8;
    if (preset !== this._preset.brightness) {
      this._preset.brightness = preset;
      this.emit('preset', this._preset);
    }
  }

  public change = async (state: Partial<TDimmer>): Promise<TDimmer> => {
    if (state.enabled !== undefined &&
        state.enabled !== this._state.enabled) {
      const mask = 1 << this.idx;
      const value = state.enabled ? (this.states | mask) : (this.states & (0xffff ^ mask));
      const { ports } = this.thing.constructor.prototype.constructor;
      this.thing.write(RegisterType.holding, ports + 2, value);
    }

    if (state.brightness !== undefined) {
      const brightness = Math.max(0, Math.min(255, Math.round(state.brightness)));
      if (this._state.brightness !== brightness) {
        const holding = (this._preset.brightness << 8) + brightness;
        this.thing.write(RegisterType.holding, this.idx + 1, holding);
      }
    }

    return this.state;
  }

  public preset = async (preset: Partial<Brightness>): Promise<Brightness> => {
    if (preset) {
      const brightness = Math.max(0, Math.min(255, Math.round(preset.brightness)));
      if (this._preset.brightness !== brightness) {
        const holding = (brightness << 8) + this._state.brightness;
        this.thing.write(RegisterType.holding, this.idx + 1, holding);
      }
    }

    return this._preset;
  }
}
