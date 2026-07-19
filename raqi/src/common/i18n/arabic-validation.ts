import { BadRequestException, ValidationError } from '@nestjs/common';
import { translateMessage } from './ar-messages';

function flattenValidationErrors(errors: ValidationError[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error.constraints) {
      messages.push(...Object.values(error.constraints));
    }
    if (error.children?.length) {
      messages.push(...flattenValidationErrors(error.children));
    }
  }
  return messages;
}

/** Turns class-validator errors into Arabic BadRequest responses. */
export function arabicValidationExceptionFactory(errors: ValidationError[]) {
  const messages = flattenValidationErrors(errors).map(translateMessage);
  return new BadRequestException({
    statusCode: 400,
    message: messages.length ? messages : ['بيانات الطلب غير صالحة'],
    error: 'طلب غير صالح',
  });
}
