import { expect } from '@open-wc/testing';
import { formatError } from '../src/utils/errorFormatter.js';

describe('formatError', () => {
  it('formats object errors without any-based narrowing', () => {
    const result = formatError({
      message: '400 Bad Request',
      details: {
        message: JSON.stringify([
          { path: ['payload', 'path'], expected: 'string' },
        ]),
      },
    });

    expect(result).to.deep.equal({
      message: 'Invalid payload.path: expected string',
      code: '400',
      details: {
        message: JSON.stringify([
          { path: ['payload', 'path'], expected: 'string' },
        ]),
      },
    });
  });

  it('formats status codes from generic object errors', () => {
    const result = formatError({
      error: 'Unauthorized',
      status: 401,
    });

    expect(result).to.deep.equal({
      message: 'Unauthorized',
      code: '401',
      details: {
        error: 'Unauthorized',
        status: 401,
      },
    });
  });
});
