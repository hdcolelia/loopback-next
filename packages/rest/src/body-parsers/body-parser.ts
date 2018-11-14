// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import * as debugModule from 'debug';
import {Request, RequestBodyParserOptions} from '../types';
import {
  inject,
  Context,
  instantiateClass,
  Constructor,
} from '@loopback/context';
import {isReferenceObject, OperationObject} from '../..';
import {is} from 'type-is';
import {RestHttpErrors} from '../rest-http-error';

const debug = debugModule('loopback:rest:body-parser');

import {
  RequestBody,
  BodyParser,
  REQUEST_BODY_PARSER_TAG,
  BodyParserFunction,
} from './types';
import {getContentType, normalizeParsingError} from './body-parser.helpers';
import {RestBindings} from '../keys';
import {JsonBodyParser} from './body-parser.json';
import {UrlEncodedBodyParser} from './body-parser.urlencoded';
import {TextBodyParser} from './body-parser.text';
import {StreamBodyParser} from './body-parser.stream';

export class RequestBodyParser {
  private readonly parsers: BodyParser[];

  constructor(
    @inject(RestBindings.REQUEST_BODY_PARSER_OPTIONS, {optional: true})
    options: RequestBodyParserOptions = {},
    @inject.tag(REQUEST_BODY_PARSER_TAG, {optional: true})
    parsers?: BodyParser[],
    @inject.context() private readonly ctx?: Context,
  ) {
    if (!parsers || parsers.length === 0) {
      this.parsers = [
        new JsonBodyParser(options),
        new UrlEncodedBodyParser(options),
        new TextBodyParser(options),
        new StreamBodyParser(),
      ];
    } else {
      this.parsers = parsers;
    }
  }

  async loadRequestBodyIfNeeded(
    operationSpec: OperationObject,
    request: Request,
  ): Promise<RequestBody> {
    const requestBody: RequestBody = {
      value: undefined,
    };
    if (!operationSpec.requestBody) return requestBody;

    const contentType = getContentType(request) || 'application/json';
    debug('Loading request body with content type %j', contentType);

    // the type of `operationSpec.requestBody` could be `RequestBodyObject`
    // or `ReferenceObject`, resolving a `$ref` value is not supported yet.
    if (isReferenceObject(operationSpec.requestBody)) {
      throw new Error('$ref requestBody is not supported yet.');
    }

    let content = operationSpec.requestBody.content || {};
    if (!Object.keys(content).length) {
      content = {
        // default to allow json and urlencoded
        'application/json': {schema: {type: 'object'}},
        'application/x-www-form-urlencoded': {schema: {type: 'object'}},
      };
    }

    // Check of the request content type matches one of the expected media
    // types in the request body spec
    let matchedMediaType: string | false = false;
    for (const type in content) {
      matchedMediaType = is(contentType, type);
      if (matchedMediaType) {
        debug('Matched media type: %s -> %s', type, contentType);
        requestBody.mediaType = type;
        requestBody.schema = content[type].schema;
        const customParser = content[type]['x-parser'];
        if (customParser) {
          // Invoke the custom parser
          const body = await this.invokeParser(customParser, request);
          if (body !== undefined) return Object.assign(requestBody, body);
        }
        break;
      }
    }

    if (!matchedMediaType) {
      // No matching media type found, fail fast
      throw RestHttpErrors.unsupportedMediaType(
        contentType,
        Object.keys(content),
      );
    }

    try {
      for (const parser of this.parsers) {
        if (!parser.supports(matchedMediaType)) {
          debug(
            'Body parser %s does not support %s',
            parser.name || (parser.constructor && parser.constructor.name),
            matchedMediaType,
          );
          continue;
        }
        debug(
          'Body parser %s found for %s',
          parser.name || (parser.constructor && parser.constructor.name),
          matchedMediaType,
        );
        const body = await parser.parse(request);
        return Object.assign(requestBody, body);
      }
    } catch (err) {
      throw normalizeParsingError(err);
    }

    throw RestHttpErrors.unsupportedMediaType(matchedMediaType);
  }

  /**
   * Resolve and invoke a custom parser
   * @param customParser The parser name, class or function
   * @param request Http request
   */
  private async invokeParser(
    customParser: string | Constructor<BodyParser> | BodyParserFunction,
    request: Request,
  ) {
    if (typeof customParser === 'string') {
      const parser = this.parsers.find(p => p.name === customParser);
      if (parser) {
        debug('Using custom parser %s', customParser);
        return parser.parse(request);
      }
    } else if (typeof customParser === 'function') {
      if (isBodyParserClass(customParser)) {
        debug('Using custom parser class %s', customParser.name);
        const parser = await instantiateClass<BodyParser>(
          customParser as Constructor<BodyParser>,
          this.ctx!,
        );
        return parser.parse(request);
      } else {
        debug('Using custom parser function %s', customParser.name);
        return customParser(request);
      }
    }
    throw new Error('Custom parser not found: ' + customParser);
  }
}

/**
 * Test if a function is a body parser class or plain function
 * @param fn
 */
function isBodyParserClass(
  fn: Constructor<BodyParser> | BodyParserFunction,
): fn is Constructor<BodyParser> {
  return fn.toString().startsWith('class ');
}
