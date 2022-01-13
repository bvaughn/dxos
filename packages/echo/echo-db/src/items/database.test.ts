//
// Copyright 2021 DXOS.org
//

import expect from 'expect';
import { it as test } from 'mocha';

import { ModelFactory, TestListModel } from '@dxos/model-factory';
import { ObjectModel } from '@dxos/object-model';
import { afterTest } from '@dxos/testutils';

import { DataServiceHost } from './data-service-host';
import { Item } from './item';
import { createInMemoryDatabase, createRemoteDatabaseFromDataServiceHost } from './testing';

const OBJECT_ORG = 'example:object/org';
const OBJECT_PERSON = 'example:object/person';
const LINK_EMPLOYEE = 'example:link/employee';

describe('Database', () => {
  describe('remote', () => {
    const setupBackend = async (modelFactory: ModelFactory) => {
      const backend = await createInMemoryDatabase(modelFactory);
      afterTest(() => backend.destroy());
      return backend;
    };

    const setupFrontend = async (modelFactory: ModelFactory, dataServiceHost: DataServiceHost) => {
      const frontend = await createRemoteDatabaseFromDataServiceHost(modelFactory, dataServiceHost);
      afterTest(() => frontend.destroy());
      return frontend;
    };

    const setup = async () => {
      const modelFactory = new ModelFactory().registerModel(ObjectModel).registerModel(TestListModel);
      const backend = await setupBackend(modelFactory);
      const frontend = await setupFrontend(modelFactory, backend.createDataServiceHost());

      return { backend, frontend };
    };

    test('gets items synced from backend', async () => {
      const { backend, frontend } = await setup();

      const [, backendItem] = await Promise.all([
        frontend.update.waitForCount(1),
        backend.createItem({ model: ObjectModel })
      ]);

      const item = frontend.getItem(backendItem.id);

      expect(item).not.toBeUndefined();
      expect(item!.model).toBeInstanceOf(ObjectModel);

      // Mutate model
      await Promise.all([
        item!.model.update.waitForCount(1),
        backendItem.model.setProperty('foo', 'bar')
      ]);

      expect(item!.model.getProperty('foo')).toEqual('bar');
    });

    test('gets items synced from backend that were created before frontend was connected', async () => {
      const modelFactory = new ModelFactory().registerModel(ObjectModel);
      const backend = await setupBackend(modelFactory);

      const backendItem = await backend.createItem({ model: ObjectModel });

      const frontend = await setupFrontend(modelFactory, backend.createDataServiceHost());

      const item = await frontend.waitForItem(item => item.id === backendItem.id);
      expect(item.model).toBeInstanceOf(ObjectModel);
    });

    test('create item', async () => {
      const { frontend: database } = await setup();

      const item = await database.createItem({ model: ObjectModel });

      expect(item.id).not.toBeUndefined();
      expect(item.model).toBeInstanceOf(ObjectModel);

      const items = database.select(s => s.items).getValue();
      expect(items).toHaveLength(1);
      expect(items[0] === item).toBeTruthy();
    });

    test('mutate item with object model', async () => {
      const { frontend: database } = await setup();

      const item = await database.createItem({ model: ObjectModel });

      expect(item.model.getProperty('foo')).toBeUndefined();

      await item.model.setProperty('foo', 'bar');

      expect(item.model.getProperty('foo')).toEqual('bar');
    });

    test('creates two items with ObjectModel', async () => {
      const { frontend: database } = await setup();

      const item1 = await database.createItem({ model: ObjectModel, type: 'test' });
      await item1.model.setProperty('prop1', 'x');
      const item2 = await database.createItem({ model: ObjectModel, type: 'test' });
      await item2.model.setProperty('prop1', 'y');

      expect(item1.model.getProperty('prop1')).toEqual('x');
    });

    test('parent & child items', async () => {
      const { frontend: database } = await setup();

      const parent = await database.createItem({ model: ObjectModel });
      const child = await database.createItem({ model: ObjectModel, parent: parent.id });

      const items = database.select(s => s.items).getValue();
      expect(items).toHaveLength(2);
      expect(items).toEqual([parent, child]);

      expect(parent.children).toHaveLength(1);
      expect(parent.children[0] === child).toBeTruthy();
    });

    test('link', async () => {
      const { frontend: database } = await setup();

      const source = await database.createItem({ model: ObjectModel });
      const target = await database.createItem({ model: ObjectModel });

      const link = await database.createLink({ source, target });

      expect(link.source).toBe(source);
      expect(link.target).toBe(target);
    });

    test('directed links', async () => {
      const { frontend: database } = await setup();

      const p1 = await database.createItem({ model: ObjectModel, type: OBJECT_PERSON, props: { name: 'Person-1' } });
      const p2 = await database.createItem({ model: ObjectModel, type: OBJECT_PERSON, props: { name: 'Person-2' } });

      const org1 = await database.createItem({ model: ObjectModel, type: OBJECT_ORG, props: { name: 'Org-1' } });
      const org2 = await database.createItem({ model: ObjectModel, type: OBJECT_ORG, props: { name: 'Org-2' } });

      await database.createLink({ source: org1, type: LINK_EMPLOYEE, target: p1 });
      await database.createLink({ source: org1, type: LINK_EMPLOYEE, target: p2 });
      await database.createLink({ source: org2, type: LINK_EMPLOYEE, target: p2 });

      // Find all employees for org.
      expect(
        org1.links.filter(link => link.type === LINK_EMPLOYEE).map(link => link.target)
      ).toStrictEqual([p1, p2]);

      // Find all orgs for person.
      expect(
        p2.refs.filter(link => link.type === LINK_EMPLOYEE).map(link => link.source)
      ).toStrictEqual([org1, org2]);
    });

    describe('non-idempotent models', () => {
      test('messages written from frontend', async () => {
        const { frontend: database } = await setup();

        const item = await database.createItem({ model: TestListModel });
        expect(item.model.messages).toHaveLength(0);

        await item.model.sendMessage('foo');
        expect(item.model.messages).toHaveLength(1);

        await item.model.sendMessage('bar');
        expect(item.model.messages).toHaveLength(2);
      });

      test('messages written from backend', async () => {
        const { frontend, backend } = await setup();

        const backendItem = await backend.createItem({ model: TestListModel });

        await backendItem.model.sendMessage('foo');
        await backendItem.model.sendMessage('bar');

        const frontendItem: Item<TestListModel> = await frontend.waitForItem(item => item.id === backendItem.id);
        await frontendItem.model.update.waitForCondition(() => frontendItem.model.messages.length === 2);

        expect(frontendItem.model.messages).toHaveLength(2);
      });
    });
  });
});
