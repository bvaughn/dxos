//
// Copyright 2022 DXOS.org
//

import assert from 'node:assert';
import { inspect } from 'node:util';

import { synchronized } from '@dxos/async';
import { ClientServicesProvider, createDefaultModelFactory } from '@dxos/client-services';
import { Config } from '@dxos/config';
import { inspectObject } from '@dxos/debug';
import { ApiError } from '@dxos/errors';
import { log } from '@dxos/log';
import { ModelFactory } from '@dxos/model-factory';
import { StatusResponse } from '@dxos/protocols/proto/dxos/client';

import { DXOS_VERSION } from '../../version';
import { createDevtoolsRpcServer } from '../devtools';
import { EchoProxy, HaloProxy, MeshProxy } from '../proxies';
import { SpaceSerializer } from './serializer';
import { fromIFrame } from './utils';

// TODO(burdon): Define package-specific errors.

/**
 * This options object configures the DXOS Client
 */
export type ClientOptions = {
  /** client configuration object */
  config?: Config;
  /** custom services provider */
  services?: ClientServicesProvider;
  /** custom model factory */
  modelFactory?: ModelFactory;
};

/**
 * The Client class encapsulates the core client-side API of DXOS.
 */
export class Client {
  /**
   * The version of this client API
   */
  public readonly version = DXOS_VERSION;

  private readonly _config: Config;
  private readonly _modelFactory: ModelFactory;
  private readonly _services: ClientServicesProvider;
  private readonly _halo: HaloProxy;
  private readonly _echo: EchoProxy;
  private readonly _mesh: MeshProxy;

  private _initialized = false;

  // prettier-ignore
  constructor({
    config,
    modelFactory,
    services
  }: ClientOptions = {}) {
    this._config = config ?? new Config();
    this._services = services ?? fromIFrame(this._config);

    // NOTE: Must currently match the host.
    this._modelFactory = modelFactory ?? createDefaultModelFactory();

    this._halo = new HaloProxy(this._services);
    this._echo = new EchoProxy(this._services, this._modelFactory, this._halo);
    this._mesh = new MeshProxy(this._services);

    // TODO(wittjosiah): Reconcile this with @dxos/log loading config from localStorage.
    const filter = this.config.get('runtime.client.log.filter');
    if (filter) {
      const prefix = this.config.get('runtime.client.log.prefix');
      log.config({ filter, prefix });
    }
  }

  [inspect.custom]() {
    return inspectObject(this);
  }

  toJSON() {
    return {
      initialized: this.initialized,
      echo: this.echo,
      halo: this.halo,
      mesh: this.mesh
    };
  }

  /**
   * Current configuration object
   */
  get config(): Config {
    return this._config;
  }

  // TODO(burdon): Rename isOpen.
  /**
   * Returns true if the client has been initialized. Initialize by calling `.initialize()`
   */
  get initialized() {
    return this._initialized;
  }

  /**
   * HALO credentials.
   */
  get halo(): HaloProxy {
    assert(this._initialized, 'Client not initialized.');
    return this._halo;
  }

  /**
   * ECHO database.
   */
  get echo(): EchoProxy {
    assert(this._initialized, 'Client not initialized.');
    if (!this.halo.profile) {
      throw new ApiError('This device has no HALO identity available. See https://docs.dxos.org/guide/halo');
    }
    return this._echo;
  }

  get mesh(): MeshProxy {
    assert(this._initialized, 'Client not initialized.');
    return this._mesh;
  }

  /**
   * Initializes internal resources in an idempotent way.
   * Required before using the Client instance.
   */
  @synchronized
  async initialize() {
    if (this._initialized) {
      return;
    }

    await this._services.open();

    // TODO(burdon): Remove?
    if (typeof window !== 'undefined') {
      await createDevtoolsRpcServer(this, this._services);
    }

    assert(this._services.services.SystemService, 'SystemService is not available.');
    await this._services.services.SystemService.initSession();

    await this._halo.open();
    await this._echo.open();
    await this._mesh.open();

    this._initialized = true;
  }

  /**
   * Cleanup, release resources.
   * Open/close is re-entrant.
   */
  @synchronized
  async destroy() {
    if (!this._initialized) {
      return;
    }

    await this._halo.close();
    await this._echo.close();
    await this._mesh.close();

    await this._services.close();

    this._initialized = false;
  }

  /**
   * Get system status.
   */
  async getStatus(): Promise<StatusResponse> {
    assert(this._services.services.SystemService, 'SystemService is not available.');
    return this._services.services?.SystemService.getStatus();
  }

  /**
   * Reinitialized the client session with the remote service host.
   * This is useful when connecting to a host running behind a resource lock
   * (e.g., HALO when SharedWorker is unavailable).
   */
  async resumeHostServices(): Promise<void> {
    assert(this._services.services.SystemService, 'SystemService is not available.');
    await this._services.services.SystemService.initSession();
  }

  /**
   * Resets and destroys client storage.
   * Warning: Inconsistent state after reset, do not continue to use this client instance.
   */
  async reset() {
    if (!this._initialized) {
      throw new ApiError('Client not open.');
    }

    assert(this._services.services.SystemService, 'SystemService is not available.');
    await this._services.services?.SystemService.reset();
    await this.destroy();
    // this._halo.profileChanged.emit(); // TODO(burdon): Triggers failure in hook.
    this._initialized = false;
  }

  createSerializer() {
    return new SpaceSerializer(this._echo);
  }
}
