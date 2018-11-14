// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {RequestBodyParserOptions, Request} from '../types';
import {raw} from 'body-parser';
import {inject} from '@loopback/context';
import {RestBindings} from '../keys';
import {RequestBody, BodyParser} from './types';
import {
  BodyParserMiddleware,
  getParserOptions,
  parseRequestBody,
} from './body-parser.helpers';

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
    // Return false so that it won't be used by matching
    // only `x-parser: 'raw' will trigger this parser
    return false;
  }

  async parse(request: Request): Promise<RequestBody> {
    const body = await parseRequestBody(this.rawParser, request);
    return {value: body};
  }
}
