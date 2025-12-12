declare module 'bech32' {
  export interface Decoded {
    prefix: string;
    words: number[];
  }

  export interface BechLib {
    decodeUnsafe: (str: string, LIMIT?: number) => Decoded | undefined;
    decode: (str: string, LIMIT?: number) => Decoded;
    encode: (prefix: string, words: ArrayLike<number>, LIMIT?: number) => string;
    toWords: (bytes: ArrayLike<number>) => number[];
    fromWordsUnsafe: (words: ArrayLike<number>) => number[] | undefined;
    fromWords: (words: ArrayLike<number>) => number[];
  }

  export const bech32: BechLib;
  export const bech32m: BechLib;
}
