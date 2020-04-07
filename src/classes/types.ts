import { Entity } from './Entity';

export interface State {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface OnOff extends State {
  enabled: boolean;
}

export interface Brightness {
  brightness: number;
}

export interface HueSaturation extends Brightness {
  hue: number;
  saturation: number;
}

export type Color = Brightness & HueSaturation;

export declare interface WithPreset<T> {
  on(event: 'preset', handler: (preset: T) => void): this;
  on(event: string, handler: (...data: unknown[]) => void): this;
  preset: (preset?: T) => Promise<T>;
}

export const isOnOff = (value: Entity<never, State>): value is Entity<never, OnOff> =>
  value.state && value.state.enabled !== undefined ;

export const isBrightness = (value: Entity<never, State>): value is Entity<never, Brightness> =>
  value.state && value.state.brightness !== undefined;

export const isHueSaturation = (value: Entity<never, State>): value is Entity<never, HueSaturation> =>
  value.state && value.state.hue !== undefined && value.state.saturation !== undefined;

export const isColor = (value: Entity<never, State>): value is Entity<never, Color> =>
  isBrightness(value) && isHueSaturation(value);

