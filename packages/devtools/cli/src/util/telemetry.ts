//
// Copyright 2022 DXOS.org
//

import chalk from 'chalk';
import yaml from 'js-yaml';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { join } from 'node:path';
import { v4 as uuid, validate as validateUuid } from 'uuid';

// read API keys from file generated on publish or deploy

// TODO(nf): read initial values from config or seed file
const DX_TELEMETRY_GROUP = process.env.DX_TELEMETRY_GROUP ?? undefined;
const DX_TELEMETRY_MODE = process.env.DX_TELEMETRY_MODE ?? undefined;
const DX_DISABLE_TELEMETRY = process.env.DX_DISABLE_TELEMETRY ?? false;

export type TelemetryContext = {
  mode: 'disabled' | 'basic' | 'full';
  installationId?: string;
  group?: string;
  timezone: string;
  runtime: string;
  os: string;
  arch: string;
  ci: boolean;
  [key: string]: any;
};

const DEFAULTS: TelemetryContext = {
  mode: 'basic',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  runtime: `node ${process.version}`,
  os: os.platform(),
  arch: os.arch(),
  ci: process.env.CI === 'true',
};

// TODO(nf): presence of file not checked

/**
 * Print telemetry banner once per installation.
 */
// TODO(nf): move to Observability
export const showTelemetryBanner = async (configDir: string) => {
  const path = join(configDir, '.telemetry-banner-printed');
  if (await exists(path)) {
    return;
  }
  process.stderr.write(
    chalk`{bold {magenta DXOS collects anonymous telemetry data to improve the CLI. To disable it add DX_DISABLE_TELEMETRY=true to your environment.}}`,
  );
  await writeFile(path, '', 'utf-8');
};

export const getTelemetryContext = async (configDir: string): Promise<TelemetryContext> => {
  const configDirExists = await exists(configDir);
  if (!configDirExists) {
    await mkdir(configDir, { recursive: true });
  }

  // TODO(burdon): Is this config or state?
  const idPath = join(configDir, 'telemetry.yml');
  if (await exists(idPath)) {
    const context = await readFile(idPath, 'utf-8');
    return validate(context) ?? createContext(idPath);
  }

  return createContext(idPath);
};

const createContext = async (idPath: string) => {
  const installationId = uuid();
  const seedContext = {
    installationId,
    ...(DX_TELEMETRY_GROUP ? { group: DX_TELEMETRY_GROUP } : {}),
    ...(DX_TELEMETRY_MODE ? { mode: DX_TELEMETRY_MODE as 'disabled' | 'basic' | 'full' } : {}),
  };

  if (DX_DISABLE_TELEMETRY) {
    seedContext.mode = 'disabled';
  }

  await writeFile(
    idPath,
    '# This file is automatically generated by the @dxos/cli.\n' + yaml.dump(seedContext),
    'utf-8',
  );

  return { ...DEFAULTS, ...seedContext };
};

const validate = (contextString: string) => {
  const context = yaml.load(contextString) as TelemetryContext;
  if (Boolean(context.installationId) && validateUuid(context.installationId!)) {
    return {
      ...DEFAULTS,
      ...context,
      mode: DX_DISABLE_TELEMETRY ? 'disabled' : context.mode ?? DEFAULTS.mode,
    };
  }
};

// TODO(wittjosiah): Factor out.
const exists = async (...args: string[]): Promise<boolean> => {
  try {
    const result = await stat(join(...args));
    return !!result;
  } catch (err: any) {
    if (/ENOENT/.test(err.message)) {
      return false;
    } else {
      throw err;
    }
  }
};
