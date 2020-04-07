import { promises as fs, watch } from 'fs';
import { join } from 'path';

import { Config as BaseConfig, Thing } from '~classes/Thing';
import { OnOff } from '~classes/types';

import { Switch } from './Switch';

export interface Config extends BaseConfig {
  path: string;
  ip: string[];
}

interface SwitchMap {
  [key: string]: Switch;
}

export class IntAc extends Thing<Config> {

  protected switches: SwitchMap;

  constructor(config: Config) {
    super(config);

    this.switches = this.config.ip.reduce((switches: SwitchMap, ip: string) => {
      switches[ip] = new Switch(this, ip);
      return switches;
    }, {});

    // load states asyncroneously and start watch
    this.read();
  }

  get id(): string {
    return '/internetaccess';
  }

  get entities(): Switch[] {
    return Object.values(this.switches);
  }

  protected read = async (): Promise<void> => {
    const files = await fs.readdir(this.config.path);
    await Promise.all(Object.keys(this.switches).map(
      (ip: string): Promise<OnOff> =>
        this.switches[ip].change({ enabled: files.includes(ip) }),
    ));

    watch(this.config.path).on('change', async (event: string, ip: string) => {
      if (event !== 'rename' || !this.switches[ip]) {
        return;
      }

      try {
        await fs.access(join(this.config.path, ip));
        this.switches[ip].set(true);
      } catch (e) {
        this.switches[ip].set(false);
      }
    });
  }

  protected test = async (file: string): Promise<boolean> => {
    try {
      await fs.access(file);
      return true;
    } catch (e) {
      return false;
    }
  }

  write = async (ip: string, enabled: boolean): Promise<void> => {
    const file = join(this.config.path, ip);
    const exists = await this.test(file);

    if (enabled && !exists) {
      await (await fs.open(file, 'w')).close();
    } else if (!enabled && exists) {
      await fs.unlink(file);
    }
  }
}
