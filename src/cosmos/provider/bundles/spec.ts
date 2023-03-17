const ACCOUNT_PREFIX = process.env['ACCOUNT_PREFIX'];

export type Unknown = {};

export type Skip = {
    type: 'skip'
};

export type Null = {
    type: 'null';
};

export type Boolean = {
    type: 'boolean';
};

export type Number = {
    type: 'number';
};

export type Balance = {
    type: 'number';
    'io.ryabina.notify': {
        type: 'balance';
    };
};

export type Currency = {
    type: 'string';
    'io.ryabina.notify': {
        type: 'currency';
    };
};

export type String = {
    type: 'string';
};

export type AddressOptionsEvm = {
    addressType: 'evm';
};

export type AddressOptionsCosmos = {
    addressType: 'cosmos';
    prefix: string | 'cosmos'
};

export type AddressOptions = AddressOptionsCosmos | AddressOptionsEvm;

export type Address = {
    type: 'string';
    'io.ryabina.notify':
    & {
        type: 'address',
    }
    & AddressOptions
    ;
};

export type Hash = {
    type: 'hash';
};

export type Object = {
    type: 'object';
    properties: Record<string, Spec>;
}

export type Array = {
    type: 'array';
    items: Spec;
};

export type Tuple = {
    type: 'array';
    items: Spec[];
};

export type Spec =
    | Unknown
    | Skip
    | Null
    | Boolean
    | Number
    | Balance
    | Currency
    | String
    | Hash
    | Address
    | Object
    ;

export function unknown(): Unknown {
    return {};
}

export function nullSpec(): Null {
    return {
        type: 'null'
    };
}

export function skip(): Skip {
    return {
        type: 'skip',
    };
}

export function boolean(): Boolean {
    return {
        type: 'boolean',
    };
}

export function number(): Number {
    return {
        type: 'number',
    };
}

export function balance(): Balance {
    return {
        type: 'number',
        'io.ryabina.notify': {
            type: 'balance',
        },
    };
}

export function currency(): Currency {
    return {
        type: 'string',
        'io.ryabina.notify': {
            type: 'currency',
        },
    };
}

export function string(): String {
    return {
        type: 'string',
    };
}

export function address(options: AddressOptions): Address {
    return {
        type: 'string',
        'io.ryabina.notify': {
            type: 'address',
            ...options,
        },
    };
}

export function hash(): Hash {
    return { type: 'hash' };
}

export type ObjectOptions = {
    properties: Record<string, Spec>;
};

export function object(options: ObjectOptions): Object {
    return {
        type: 'object',
        ...options,
    };
}

export type ArrayOptions = {
    items: Spec;
};

export function array(options: ArrayOptions): Array {
    return { type: 'array', ...options };
}

export type TupleOptions = {
    items: Spec[];
};

export function tuple(options: TupleOptions): Tuple {
    return { type: 'array', ...options };
}
