import * as EventEmitter from 'events';

import { Entity } from '~classes/Entity';

import { Config, Info } from './types';

export abstract class Thing<C extends Config> extends EventEmitter {
  static info(): Info {
    return {
      model: 'Generic model',
      manufacturer: 'Generic manufacturer',
    };
  }

  private readonly _config: C;

  public abstract readonly id: string;
  public abstract readonly entities: Entity<unknown>[];

  constructor(
    config: C,
  ) {
    super();
    this._config = config;
  }

  get config(): C {
    return this._config;
  }

  get name(): string {
    return this.config.name;
  }

}
