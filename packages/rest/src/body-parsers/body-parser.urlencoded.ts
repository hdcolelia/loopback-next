// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {RequestBodyParserOptions, Request} from '../types';
import {urlencoded} from 'body-parser';
import {inject} from '@loopback/context';
import {RestBindings} from '../keys';
import {is} from 'type-is';

import {RequestBody, BodyParser} from './types';
import {
  BodyParserMiddleware,
  getParserOptions,
  parseRequestBody,
} from './body-parser.helpers';

export class UrlEncodedBodyParser implements BodyParser {
  name = 'urlencoded';
  private urlencodedParser: BodyParserMiddleware;

  constructor(
    @inject(RestBindings.REQUEST_BODY_PARSER_OPTIONS, {optional: true})
    options: RequestBodyParserOptions = {},
  ) {
    const urlencodedOptions = Object.assign(
      {extended: true},
      getParserOptions('urlencoded', options),
    );
    this.urlencodedParser = urlencoded(urlencodedOptions);
  }

  supports(mediaType: string) {
    return !!is(mediaType, 'urlencoded');
  }

  async parse(request: Request): Promise<RequestBody> {
    const body = await parseRequestBody(this.urlencodedParser, request);
    return {value: body, coercionRequired: true};
  }
}
