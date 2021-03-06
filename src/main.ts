import * as moduleAlias from 'module-alias';

moduleAlias.addPath(__dirname + '/build/src');
moduleAlias.addPath(__dirname);
moduleAlias.addAliases(
  ['classes', 'services', 'providers', 'things'].reduce((t, c) => ({
    ...t,
    [`~${c}`]: c,
  }), {}),
);

import * as Mqtt from 'mqtt';
import * as config from 'config';
import { cloneDeep, find, findKey } from 'lodash';

import { isOnOff, isBrightness, isHueSaturation } from '~classes/types';
import { Entity } from '~classes/Entity';

const prefix = config.get('mqtt.prefix');
const mqtt = Mqtt.connect(config.get('mqtt.url'));
mqtt.subscribe(`${prefix}/#`);

interface Device {
  name: string;
  manufacturer: string;
  model: string;
  identifiers: string[];
}

interface Config {
  type: string;
  config: unknown;
  device: Device;
}

interface Options {
  path: string;
  name: string;
  uid: string;
}

const things = config.get('things') as Config[];
const devices = config.get('devices') as Options[];
const entities: Entity[] = [];

things.forEach((def) => {
  const { type, config, device } = def;
  const [ path, driver ] = type.split('.');
  const Thing = require(`~things/${path}`)[driver];
  const thing = new Thing(cloneDeep(config));

  Array.prototype.push.apply(entities, thing.entities);

  for (const entity of thing.entities) {
    const options = devices[entity.id];
    if (!options) {
      continue;
    }

    /* eslint-disable @typescript-eslint/camelcase */
    const entityConfig: { [key: string]: unknown } = {
      '~': `${prefix}/${options.path}`,
      name: options.name,
      unique_id: options.uid,
      device,
    };

    if (isOnOff(entity)) {
      entityConfig.cmd_t = '~/onoff/set';
      entityConfig.stat_t = '~/onoff/state';

      entity.on('state', (state) => {
        if (state.enabled !== undefined) {
          mqtt.publish(
            `${prefix}/${options.path}/onoff/state`,
            state.enabled ? 'ON' : 'OFF',
            { qos: 0, retain: true },
          );
        }
      });
    }

    if (isBrightness(entity)) {
      entityConfig.bri_cmd_t = '~/brightness/set';
      entityConfig.bri_stat_t = '~/brightness/state';

      entity.on('state', (state) => {
        if (state.brightness !== undefined) {
          mqtt.publish(
            `${prefix}/${options.path}/brightness/state`,
            state.brightness.toString(),
            { qos: 0, retain: true },
          );
        }
      });
    }

    if (isHueSaturation(entity)) {
      entityConfig.bri_scl = '100'; // well not the best place
      entityConfig.hs_cmd_t = '~/huesaturation/set';
      entityConfig.hs_stat_t = '~/huesaturation/state';
      entityConfig.opt = 'true';

      entity.on('state', (state) => {
        if (state.hue !== undefined && state.saturation !== undefined) {
          mqtt.publish(
            `${prefix}/${options.path}/huesaturation/state`,
            `${state.hue},${state.saturation}`,
            { qos: 0, retain: true },
          );
        }
      });
    }

    mqtt.publish(
      `${prefix}/${options.path}/config`,
      JSON.stringify(entityConfig),
      { qos: 0, retain: true },
    );
  }
});

mqtt.on('message', (topic, payload) => {
  const id = findKey(
    devices,
    (options: Options) => topic.indexOf(`${prefix}/${options.path}/`) === 0,
  );

  if (id) {
    const entity = find(entities, (entity) => entity.id === id);
    if (entity) {
      if (topic.indexOf('/onoff/') !== -1) {
        entity.change({ enabled: payload.toString() === 'ON' });
      } else if (topic.indexOf('/brightness/') !== -1) {
        entity.change({ brightness: parseInt(payload.toString(), 10) });
      } else if (topic.indexOf('/huesaturation/') !== -1) {
        const [ hue, saturation ] = payload.toString().split(',').map((n) => parseInt(n, 10));
        entity.change({ hue, saturation });
      }
    }
  }
});
