import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  BadRequestErrorDto,
  ErrorEnvelopeDto,
  ForbiddenErrorDto,
  NotFoundErrorDto,
  UnauthorizedErrorDto,
  ValidationErrorDto,
} from './responses/error.response';

export const MONGO_ID_EXAMPLE = '507f1f77bcf86cd799439011';

export function ApiMongoIdParam(
  name = 'id',
  description = 'MongoDB document identifier',
) {
  return ApiParam({
    name,
    type: String,
    description,
    example: MONGO_ID_EXAMPLE,
    required: true,
  });
}

export function ApiStandardErrorResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Invalid request or business rule violation',
      type: BadRequestErrorDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid JWT bearer token',
      type: UnauthorizedErrorDto,
    }),
    ApiForbiddenResponse({
      description: 'Authenticated but insufficient role or permissions',
      type: ForbiddenErrorDto,
    }),
    ApiNotFoundResponse({
      description: 'Requested resource was not found',
      type: NotFoundErrorDto,
    }),
    ApiConflictResponse({
      description: 'Resource conflict (e.g. duplicate email)',
      type: ErrorEnvelopeDto,
    }),
    ApiUnprocessableEntityResponse({
      description: 'Validation failed for request body or query',
      type: ValidationErrorDto,
    }),
    ApiInternalServerErrorResponse({
      description: 'Unexpected server error',
      type: ErrorEnvelopeDto,
    }),
  );
}

export function ApiOkDataResponse<TModel extends Type>(
  model: TModel,
  description: string,
  options?: { isArray?: boolean; status?: 200 | 201 },
) {
  const isArray = options?.isArray ?? false;
  const schema = {
    type: 'object' as const,
    required: ['data'],
    properties: {
      data: isArray
        ? { type: 'array' as const, items: { $ref: getSchemaPath(model) } }
        : { $ref: getSchemaPath(model) },
    },
    example: isArray ? { data: [] } : { data: {} },
  };
  const responseDecorator =
    options?.status === 201
      ? ApiCreatedResponse({ description, schema })
      : ApiOkResponse({ description, schema });

  return applyDecorators(responseDecorator);
}

export function ApiOkEnvelopeResponse(description: string, example: Record<string, unknown>) {
  return applyDecorators(
    ApiOkResponse({
      description,
      schema: {
        type: 'object',
        required: ['data'],
        properties: { data: { type: 'object' } },
        example: { data: example },
      },
    }),
  );
}

export function ApiAdminAuth() {
  return applyDecorators(ApiBearerAuth('access-token'), ApiStandardErrorResponses());
}

export function ApiOptionalQuery(
  name: string,
  description: string,
  options: {
    enum?: readonly string[];
    type?: 'string' | 'number' | 'boolean';
    example?: string | number | boolean;
    default?: string | number | boolean;
  } = {},
) {
  return ApiQuery({
    name,
    required: false,
    description,
    enum: options.enum,
    type: options.type ?? 'string',
    example: options.example,
    schema: options.default !== undefined ? { default: options.default } : undefined,
  });
}
