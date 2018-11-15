// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  Client,
  createRestAppClient,
  expect,
  givenHttpServerConfig,
} from '@loopback/testlab';
import {
  JsonBodyParser,
  post,
  Request,
  requestBody,
  RestApplication,
  RestBindings,
} from '../../..';

describe('request parsing', () => {
  let client: Client;
  let app: RestApplication;
  beforeEach(givenAClient);
  afterEach(async () => {
    await app.stop();
  });

  it('supports x-parser extension', async () => {
    await postRequest('/show-body-json');
  });

  it('allows built-in body parsers to be overridden', async () => {
    class MyJsonBodyParser extends JsonBodyParser {
      supports(mediaType: string) {
        return false;
      }
    }
    app.bodyParser(MyJsonBodyParser, RestBindings.REQUEST_BODY_PARSER_JSON);
    await postRequest('/show-body', 415);
    await postRequest('/show-body-json');
  });

  it('invokes custom body parsers before built-in ones', async () => {
    let invoked = false;
    class MyJsonBodyParser extends JsonBodyParser {
      name = 'my-json';
      async parse(request: Request) {
        const body = await super.parse(request);
        invoked = true;
        return body;
      }
    }
    app.bodyParser(MyJsonBodyParser);
    await client
      .post('/show-body')
      .set('Content-Type', 'application/json')
      .send({key: 'value'})
      .expect(200, {key: 'new-value'});
    expect(invoked).to.be.true();
  });

  it('allows built-in body parsers to be removed', async () => {
    app.unbind(RestBindings.REQUEST_BODY_PARSER_JSON);
    await postRequest('/show-body', 415);
  });

  async function givenAClient() {
    app = new RestApplication({rest: givenHttpServerConfig()});
    app.controller(
      givenBodyParamController('/show-body-json', 'json'),
      'Controller1',
    );
    app.controller(givenBodyParamController('/show-body'), 'Controller2');
    await app.start();
    client = createRestAppClient(app);
  }

  async function postRequest(url = '/show-body', expectedStatusCode = 200) {
    return await client
      .post(url)
      .set('Content-Type', 'application/json')
      .send({key: 'value'})
      .expect(expectedStatusCode);
  }

  function givenBodyParamController(url: string, parser?: string | Function) {
    class RouteParamController {
      @post(url, {
        responses: {
          200: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
            description: '',
          },
        },
      })
      async showBody(
        @requestBody({
          required: true,
          content: {
            'application/json': {
              // Customize body parsing
              'x-parser': parser,
              schema: {type: 'object'},
            },
          },
        })
        request: // tslint:disable-next-line:no-any
        any,
      ): Promise<object> {
        if (parser === 'stream') {
          // Request body parsing is skipped
          expect(request.body).to.be.undefined();
        }
        if (parser === 'json') {
          expect(request).to.containEql({key: 'value'});
        }
        if (parser === 'raw') {
          expect(request).to.be.instanceOf(Buffer);
        }
        const parserName =
          typeof parser === 'string' ? parser : parser && parser.name;
        return {key: 'new-value', parser: parserName};
      }
    }
    return RouteParamController;
  }
});
