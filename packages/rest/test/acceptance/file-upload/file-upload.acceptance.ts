// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  RestBindings,
  Request,
  Response,
  ControllerSpec,
  HttpHandler,
  SequenceActions,
  FindRouteProvider,
  ParseParamsProvider,
  InvokeMethodProvider,
  writeResultToResponse,
  RejectProvider,
  DefaultSequence,
  RequestBodyParser,
} from '../../..';
import {inject, Context} from '@loopback/context';
import {expect, Client, createClientForHandler} from '@loopback/testlab';
import {RequestBodyObject} from '@loopback/openapi-v3-types';
import {anOpenApiSpec} from '@loopback/openapi-spec-builder';
import * as path from 'path';
import * as multer from 'multer';
import {createUnexpectedHttpErrorLogger} from '../../helpers';

import * as express from 'express';

describe('multipart/form-data', () => {
  let client: Client;
  beforeEach(givenHandler);
  beforeEach(givenClient);
  beforeEach(givenBodyParamController);

  it('supports file uploads', async () => {
    const FIXTURES = path.resolve(__dirname, '../../../../fixtures');
    const res = await client
      .post('/show-body')
      .field('user', 'john')
      .field('email', 'john@example.com')
      .attach('certFile', path.resolve(FIXTURES, 'cert.pem'), {
        filename: 'cert.pem',
        contentType: 'multipart/form-data',
      })
      .expect(200);
    expect(res.body.files[0]).containEql({
      fieldname: 'certFile',
      originalname: 'cert.pem',
      mimetype: 'multipart/form-data',
    });
  });

  function givenBodyParamController() {
    const spec = anOpenApiSpec()
      .withOperation('post', '/show-body', {
        'x-operation-name': 'showBody',
        requestBody: <RequestBodyObject>{
          description: 'multipart/form-data value.',
          required: true,
          content: {
            'multipart/form-data': {
              // Skip body parsing
              'x-skip-body-parsing': true,
              schema: {type: 'object'},
            },
          },
        },
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
      .build();

    class RouteParamController {
      async showBody(
        request: Request,
        @inject(RestBindings.Http.RESPONSE) response: Response,
      ): Promise<Object> {
        const storage = multer.memoryStorage();
        const upload = multer({storage});
        return new Promise<object>((resolve, reject) => {
          upload.any()(request, response, err => {
            if (err) reject(err);
            else {
              resolve({
                files: request.files,
                // tslint:disable-next-line:no-any
                fields: (request as any).fields,
              });
            }
          });
        });
      }
    }

    givenControllerClass(RouteParamController, spec);
  }

  function givenControllerClass(
    // tslint:disable-next-line:no-any
    ctor: new (...args: any[]) => Object,
    spec: ControllerSpec,
  ) {
    handler.registerController(spec, ctor);
  }

  let rootContext: Context;
  let handler: HttpHandler;
  function givenHandler() {
    rootContext = new Context();
    rootContext.bind(SequenceActions.FIND_ROUTE).toProvider(FindRouteProvider);
    rootContext
      .bind(SequenceActions.PARSE_PARAMS)
      .toProvider(ParseParamsProvider);
    rootContext
      .bind(SequenceActions.INVOKE_METHOD)
      .toProvider(InvokeMethodProvider);
    rootContext
      .bind(SequenceActions.LOG_ERROR)
      .to(createUnexpectedHttpErrorLogger());
    rootContext.bind(SequenceActions.SEND).to(writeResultToResponse);
    rootContext.bind(SequenceActions.REJECT).toProvider(RejectProvider);

    rootContext.bind(RestBindings.SEQUENCE).toClass(DefaultSequence);
    rootContext
      .bind(RestBindings.REQUEST_BODY_PARSER)
      .toClass(RequestBodyParser);

    handler = new HttpHandler(rootContext);
    rootContext.bind(RestBindings.HANDLER).to(handler);
  }

  function givenClient() {
    const app = express();
    app.use((req, res) => {
      handler.handleRequest(req, res).catch(err => {
        // This should never happen. If we ever get here,
        // then it means "handler.handlerRequest()" crashed unexpectedly.
        // We need to make a lot of helpful noise in such case.
        console.error('Request failed.', err.stack);
        if (res.headersSent) return;
        res.statusCode = 500;
        res.end();
      });
    });
    client = createClientForHandler(app);
  }
});
