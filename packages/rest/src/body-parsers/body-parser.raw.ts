// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {inject} from '@loopback/context';
import {raw} from 'body-parser';
import {RestBindings} from '../keys';
import {Request, RequestBodyParserOptions} from '../types';
import {
  BodyParserMiddleware,
  getParserOptions,
  invokeBodyParserMiddleware,
} from './body-parser.helpers';
import {BodyParser, RequestBody} from './types';

/**
 * Parsing the request body into Buffer
 */
export class RawBodyParser implements BodyParser {
  name = 'raw';
  private rawParser: BodyParserMiddleware;

  constructor(
    @inject(RestBindings.REQUEST_BODY_PARSER_OPTIONS, {optional: true})
    options: RequestBodyParserOptions = {},
  ) {
    const rawOptions = getParserOptions('raw', options);
    this.rawParser = raw(rawOptions);
  }

  supports(mediaType: string) {
    // Return `false` to only allow `{x-parser: 'raw'} to trigger this parser
    // It won't be used for
    return false;
  }

  async parse(request: Request): Promise<RequestBody> {
    const body = await invokeBodyParserMiddleware(this.rawParser, request);
    return {value: body};
  }
}
