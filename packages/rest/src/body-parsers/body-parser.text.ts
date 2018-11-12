// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {RequestBodyParserOptions, Request} from '../types';
import {text} from 'body-parser';
import {inject} from '@loopback/context';
import {RestBindings} from '../keys';
import {is} from 'type-is';
import {RequestBody, BodyParser} from './types';
import {
  BodyParserWithCallback,
  getParserOptions,
  parseRequest,
} from './body-parser.helpers';

export class TextBodyParser implements BodyParser {
  name = 'text';
  private textParser: BodyParserWithCallback;

  constructor(
    @inject(RestBindings.REQUEST_BODY_PARSER_OPTIONS, {optional: true})
    options: RequestBodyParserOptions = {},
  ) {
    const textOptions = Object.assign(
      {type: 'text/*'},
      getParserOptions('text', options),
    );
    this.textParser = text(textOptions);
  }

  supports(mediaType: string) {
    // Please note that `text/*` matches `text/plain` and `text/html` but`text`
    // does not.
    return !!is(mediaType, 'text/*');
  }

  async parse(request: Request): Promise<RequestBody> {
    const body = await parseRequest(this.textParser, request);
    return {value: body};
  }
}
