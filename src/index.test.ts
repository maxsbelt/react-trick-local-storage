import * as api from '.';

describe('.', () => {
  it('exports correct functions', async () => {
    expect(Object.keys(api)).toEqual(['useStorageValues', 'createStorage']);
  });
});
