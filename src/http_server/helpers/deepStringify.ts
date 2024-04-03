export type JSONFlag = 'stringify' | 'parse';

const stringify = (object: any) => {
  return JSON.stringify(object);
};

const parse = (object: any) => {
  return JSON.parse(object);
};

const jsonFeatureFlag = (flag: JSONFlag) => {
  switch (flag) {
    case 'parse':
      return parse;

    case 'stringify':
      return stringify;
  }
};

export const jsonHandler = (object: Object, flag: JSONFlag) => {
  let stringifyedObject: Record<string, any> = {};

  for (const key in object) {
    //@ts-ignore
    if (typeof object[key] === 'object' && object[key] !== null && !Array.isArray(object[key])) {
      //@ts-ignore
      stringifyedObject[key] = jsonHandler(object[key], flag);
      //@ts-ignore
    } else if (Array.isArray(object[key])) {
      //@ts-ignore
      stringifyedObject[key] = jsonFeatureFlag(flag)(object[key]);
    } else {
      //@ts-ignore
      stringifyedObject[key] = object[key];
    }
  }

  return jsonFeatureFlag(flag)(stringifyedObject);
};
