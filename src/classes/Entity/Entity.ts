import { EventEmitter } from 'events';

import { Thing } from '~classes/Thing';
import { State } from '~classes/types';

export interface Entity<T, C extends State> {
  on(event: 'state', handler: (state: C) => void): this;
}

export abstract class Entity<T = Thing<{}>, C extends State = {}> extends EventEmitter {
  protected thing: T;

  abstract readonly id: string;
  abstract readonly state: C;

  constructor(
    thing: T,
  ) {
    super();
    this.thing = thing;
  }

  abstract change: (state: C) => Promise<C>;
}
