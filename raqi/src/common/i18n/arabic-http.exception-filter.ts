import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  httpErrorLabelAr,
  translateMessage,
  translateMessages,
} from './ar-messages';

@Catch()
export class ArabicHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ArabicHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();

      if (typeof raw === 'string') {
        response.status(status).json({
          statusCode: status,
          message: translateMessage(raw),
          error: httpErrorLabelAr(status),
        });
        return;
      }

      if (raw && typeof raw === 'object') {
        const body = { ...(raw as Record<string, unknown>) };
        if (typeof body.message === 'string' || Array.isArray(body.message)) {
          body.message = translateMessages(
            body.message as string | string[],
          );
        } else if (body.message != null) {
          body.message = translateMessage(String(body.message));
        }
        if (typeof body.error === 'string') {
          body.error = httpErrorLabelAr(status, body.error);
        } else if (!body.error) {
          body.error = httpErrorLabelAr(status);
        }
        if (typeof body.statusCode !== 'number') {
          body.statusCode = status;
        }
        response.status(status).json(body);
        return;
      }
    }

    // Mongoose validation / cast errors → 400 with a clear Arabic message
    if (isMongooseValidationError(exception)) {
      const details = Object.values(
        (exception as { errors?: Record<string, { message?: string }> }).errors ??
          {},
      )
        .map((err) => err?.message)
        .filter(Boolean) as string[];
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: details.length
          ? details.map((msg) => translateMessage(msg))
          : ['بيانات الطلب غير صالحة'],
        error: httpErrorLabelAr(HttpStatus.BAD_REQUEST),
      });
      return;
    }

    if (isMongooseCastError(exception)) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'معرّف غير صالح',
        error: httpErrorLabelAr(HttpStatus.BAD_REQUEST),
      });
      return;
    }

    if (isMongoDuplicateKeyError(exception)) {
      const field = mongoDuplicateField(exception);
      const message =
        field === 'phone'
          ? translateMessage('Phone already registered')
          : field === 'email'
            ? translateMessage('Email already exists')
            : field === 'code'
              ? translateMessage('Driver code already in use')
              : 'البيانات مكررة؛ تحقق من الحقول الفريدة';
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message,
        error: httpErrorLabelAr(HttpStatus.BAD_REQUEST),
      });
      return;
    }

    const errMessage =
      exception instanceof Error ? exception.message : String(exception);
    this.logger.error(errMessage, exception instanceof Error ? exception.stack : undefined);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'حدث خطأ غير متوقع',
      error: httpErrorLabelAr(HttpStatus.INTERNAL_SERVER_ERROR),
    });
  }
}

function isMongooseValidationError(exception: unknown): boolean {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    (exception as { name?: string }).name === 'ValidationError'
  );
}

function isMongooseCastError(exception: unknown): boolean {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    (exception as { name?: string }).name === 'CastError'
  );
}

function isMongoDuplicateKeyError(exception: unknown): boolean {
  if (typeof exception !== 'object' || exception === null) {
    return false;
  }
  return (exception as { code?: number }).code === 11000;
}

function mongoDuplicateField(exception: unknown): string | null {
  if (typeof exception !== 'object' || exception === null) {
    return null;
  }
  const keyPattern = (exception as { keyPattern?: Record<string, unknown> })
    .keyPattern;
  if (keyPattern && typeof keyPattern === 'object') {
    const keys = Object.keys(keyPattern);
    if (keys.length) {
      return keys[0];
    }
  }
  const message = String((exception as { message?: string }).message ?? '');
  const match = message.match(/index:\s+(\w+)_/);
  return match?.[1] ?? null;
}
