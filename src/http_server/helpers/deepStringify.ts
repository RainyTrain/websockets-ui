export const deepStringify = (object: Object) => {
  let stringifyedObject: Record<string, any> = {};

  for (const key in object) {
    //@ts-ignore
    if (typeof object[key] === 'object' && object[key] !== null) {
      //@ts-ignore
      stringifyedObject[key] = deepStringify(object[key]);
    } else {
      //@ts-ignore
      stringifyedObject[key] = object[key];
    }
  }

  return JSON.stringify(stringifyedObject);
};
