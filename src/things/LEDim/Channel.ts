import { Entity } from '~classes/Entity';
import { Color } from '~classes/types';
import { RegisterType, RegisterData } from '~services/Modbus';

import { LEDim } from './LEDim';
import { TColor } from './types';

const keys = ['hue', 'saturation', 'brightness'];
const values = [360, 100, 100];

const update = (
  source: number[],
  offset: number,
  destination: Color,
): boolean =>
  keys.map((
    key, idx
  ) => {
    const value = Math.max(0, Math.min(values[idx], source[idx + offset]));
    if (value !== destination[key]) {
      destination[key] = value;
      return true;
    }

    return false;
  })
  .reduce((prev, curr) => prev || curr, false);

export class Channel extends Entity<LEDim, TColor> {
  private _state: TColor = {
    enabled: false,
    brightness: 0,
    hue: 0,
    saturation: 0,
  };

  private _preset: Color = {
    brightness: 0,
    hue: 0,
    saturation: 0,
  }

  constructor(
    thing: LEDim,
  ) {
    super(thing);
    this.thing.on('get', this.read);
    this.on('state', this.change);
  }

  get id(): string {
    // only one channel so ok to share thing's ID
    return this.thing.id;
  }

  get state(): TColor {
    return this._state;
  }

  private read = (
    { [RegisterType.holding]: holding }: RegisterData,
  ): void => {
    let changed = false;

    if ((holding[0] !== 0) !== this._state.enabled) {
      this._state.enabled = holding[0] !== 0;
      changed = true;
    }

    changed = changed || update(holding, 1, this._state);

    if (changed) {
      this.emit('state', this._state);
    }

    if (update(holding, 4, this._preset)) {
      this.emit('preset', this._preset);
    }
  }

  change = async (
    state: Partial<TColor>,
  ): Promise<TColor> => {
    let changed = false;

    for (const key in this._state) {
      if (state[key] !== undefined &&
        state[key] !== this._state[key]) {
        this._state[key] = state[key];
        changed = true;
      }
    }

    if (changed) {
      await this.thing.writeBulk(RegisterType.holding, 0, [
        this._state.enabled ? 1 : 0,
        this._state.hue,
        this._state.saturation,
        this._state.brightness,
      ]);
    }

    return this._state;
  }

  preset = async (
    state: Partial<TColor>,
  ): Promise<Color> => {
    let changed = false;

    for (const key in this._preset) {
      if (state[key] !== undefined &&
        state[key] !== this._preset[key]) {
        this._preset[key] = state[key];
        changed = true;
      }
    }

    if (changed) {
      await this.thing.writeBulk(RegisterType.holding, 0, [
        this._preset.hue,
        this._preset.saturation,
        this._preset.brightness,
      ]);
    }

    return this._preset;
  }

}
