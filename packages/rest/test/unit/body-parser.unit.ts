// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {OperationObject, RequestBodyObject} from '@loopback/openapi-v3-types';
import {
  expect,
  ShotRequestOptions,
  stubExpressContext,
} from '@loopback/testlab';
import {Request, RequestBodyParser} from '../..';
import {
  RequestBodyParserOptions,
  JsonBodyParser,
  UrlEncodedBodyParser,
  TextBodyParser,
  StreamBodyParser,
} from '../../src';
import {RawBodyParser} from '../../src/body-parsers/body-parser.raw';

describe('body parser', () => {
  let requestBodyParser: RequestBodyParser;
  before(givenRequestBodyParser);

  it('parses body parameter with multiple media types', async () => {
    const req = givenRequest({
      url: '/',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      payload: 'key=value',
    });

    const urlencodedSchema = {
      type: 'object',
      properties: {
        key: {type: 'string'},
      },
    };
    const spec = givenOperationWithRequestBody({
      description: 'data',
      content: {
        'application/json': {schema: {type: 'object'}},
        'application/x-www-form-urlencoded': {
          schema: urlencodedSchema,
        },
      },
    });
    const requestBody = await requestBodyParser.loadRequestBodyIfNeeded(
      spec,
      req,
    );
    expect(requestBody).to.eql({
      value: {key: 'value'},
      coercionRequired: true,
      mediaType: 'application/x-www-form-urlencoded',
      schema: urlencodedSchema,
    });
  });

  it('allows application/json to be default', async () => {
    const req = givenRequest({
      url: '/',
      headers: {
        'Content-Type': 'application/json',
      },
      payload: {key: 'value'},
    });

    const defaultSchema = {
      type: 'object',
    };
    const spec = givenOperationWithRequestBody({
      description: 'data',
      content: {},
    });
    const requestBody = await requestBodyParser.loadRequestBodyIfNeeded(
      spec,
      req,
    );
    expect(requestBody).to.eql({
      value: {key: 'value'},
      mediaType: 'application/json',
      schema: defaultSchema,
    });
  });

  it('allows text/json to be parsed', async () => {
    const req = givenRequest({
      url: '/',
      headers: {
        'Content-Type': 'text/json',
      },
      payload: {key: 'value'},
    });

    const defaultSchema = {
      type: 'object',
    };
    const spec = givenOperationWithRequestBody({
      description: 'data',
      content: {'text/json': {schema: defaultSchema}},
    });
    const requestBody = await requestBodyParser.loadRequestBodyIfNeeded(
      spec,
      req,
    );
    expect(requestBody).to.eql({
      value: {key: 'value'},
      mediaType: 'text/json',
      schema: defaultSchema,
    });
  });

  it('allows */*.+json to be parsed', async () => {
    const req = givenRequest({
      url: '/',
      headers: {
        'Content-Type': 'application/x-xyz+json',
      },
      payload: {key: 'value'},
    });

    const defaultSchema = {
      type: 'object',
    };
    const spec = givenOperationWithRequestBody({
      description: 'data',
      content: {'application/x-xyz+json': {schema: defaultSchema}},
    });
    const requestBody = await requestBodyParser.loadRequestBodyIfNeeded(
      spec,
      req,
    );
    expect(requestBody).to.eql({
      value: {key: 'value'},
      mediaType: 'application/x-xyz+json',
      schema: defaultSchema,
    });
  });

  it('parses body string as json', async () => {
    const req = givenRequest({
      url: '/',
      payload: '"value"',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const defaultSchema = {
      type: 'object',
    };
    const spec = givenOperationWithRequestBody({
      description: 'data',
      content: {},
    });
    const requestBody = await requestBodyParser.loadRequestBodyIfNeeded(
      spec,
      req,
    );
    expect(requestBody).to.eql({
      value: 'value',
      mediaType: 'application/json',
      schema: defaultSchema,
    });
  });

  it('parses body number as json', async () => {
    const req = givenRequest({
      url: '/',
      payload: '123',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const defaultSchema = {
      type: 'object',
    };
    const spec = givenOperationWithRequestBody({
      description: 'data',
      content: {},
    });
    const requestBody = await requestBodyParser.loadRequestBodyIfNeeded(
      spec,
      req,
    );
    expect(requestBody).to.eql({
      value: 123,
      mediaType: 'application/json',
      schema: defaultSchema,
    });
  });

  it('sorts body parsers', () => {
    const options: RequestBodyParserOptions = {};
    const bodyParser = new RequestBodyParser(options, [
      new TextBodyParser(options),
      new StreamBodyParser(),
      new JsonBodyParser(options),
      new UrlEncodedBodyParser(options),
      new RawBodyParser(options),
      {
        name: 'xml',
        supports: mediaType => true,
        parse: async request => {
          return {value: 'xml'};
        },
      },
    ]);
    const names = bodyParser.parsers.map(p => p.name);
    expect(names).to.eql([
      'xml',
      'json',
      'urlencoded',
      'text',
      'raw',
      'stream',
    ]);
  });

  function givenRequestBodyParser() {
    requestBodyParser = new RequestBodyParser();
  }

  function givenOperationWithRequestBody(requestBody?: RequestBodyObject) {
    return <OperationObject>{
      'x-operation-name': 'testOp',
      requestBody: requestBody,
      responses: {},
    };
  }

  function givenRequest(options?: ShotRequestOptions): Request {
    return stubExpressContext(options).request;
  }
});
