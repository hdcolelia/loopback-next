// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Request} from '../types';
import {RequestBody, BodyParser} from './types';

/**
 * A special body parser to retain request stream as is.
 * It will be used by explicitly set `x-parser` to `'stream'` in the request
 * body spec.
 */
export class StreamBodyParser implements BodyParser {
  name = 'stream';

  supports(mediaType: string) {
    // Return false so that it won't be used by matching
    // only `x-parser: 'stream' will trigger this parser
    return false;
  }

  async parse(request: Request): Promise<RequestBody> {
    return {value: request};
  }
}
