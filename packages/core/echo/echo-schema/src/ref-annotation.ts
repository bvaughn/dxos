//
// Copyright 2024 DXOS.org
//

import * as S from '@effect/schema/Schema';

import { type EchoObjectAnnotation, getEchoObjectAnnotation, ReferenceAnnotation } from './annotations';
import { DynamicEchoSchema, StoredEchoSchema } from './dynamic';
import { getTypename } from './getter';
import { isReactiveObject } from './proxy';
import type { Identifiable, Ref } from './types';

export const ref = <T extends Identifiable>(schema: S.Schema<T>): S.Schema<Ref<T>> => {
  const annotation = getEchoObjectAnnotation(schema);
  if (annotation == null) {
    throw new Error('Reference target must be an ECHO object.');
  }
  return createEchoReferenceSchema(annotation);
};

export const createEchoReferenceSchema = (annotation: EchoObjectAnnotation): S.Schema<any> => {
  const typePredicate =
    annotation.typename === 'Expando' ? () => true : (obj: object) => getTypename(obj) === annotation.typename;
  return S.any
    .pipe(
      S.filter(
        (obj) => {
          if (obj === undefined) {
            // unresolved reference
            return true;
          }
          if (obj instanceof DynamicEchoSchema) {
            return annotation.typename === StoredEchoSchema.typename;
          }
          return isReactiveObject(obj) && typePredicate(obj);
        },
        { jsonSchema: {} },
      ),
    )
    .annotations({ [ReferenceAnnotation]: annotation });
};
