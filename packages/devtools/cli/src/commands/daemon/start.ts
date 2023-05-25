//
// Copyright 2023 DXOS.org
//

import { Flags } from '@oclif/core';

import { BaseCommand } from '../../base-command';

export default class Start extends BaseCommand {
  static override enableJsonFlag = true;
  static override description = 'Start daemon process.';

  static override flags = {
    ...BaseCommand.flags,
    profile: Flags.string({
      description: 'Profile name.',
      env: 'DX_PROFILE',
    }),
  };

  async run(): Promise<any> {
    return await this.execWithDaemon(async (daemon) => {
      const params = await this.parse(Start);
      const process = await daemon.start(params.flags.profile);
      this.log('Started:', process);
    });
  }
}
