export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key in string]?: JsonValue; };
export type JsonArray = JsonValue[];

export type Schema = object;

export type Event = {
  name: string;
  params: {
    raw: JsonObject;
    human?: JsonObject;
  };
  payload?: JsonObject;
};

export type Spec = {
  name: string;
  schema: Record<string, Schema>;
  payload?: object;
  meta: {
    scope: string;
    name: string;
    kind: string;
    labels: Record<string, string>;
    description: string;
  };
};
