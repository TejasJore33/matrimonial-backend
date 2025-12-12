import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
        ? exception.message
        : 'Internal server error';

    // Log the full error
    const errorDetails = {
      status,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      path: request.url,
      method: request.method,
      body: request.body,
    };

    if (exception instanceof Error) {
      this.logger.error(`Exception caught: ${JSON.stringify(errorDetails)}`);
      this.logger.error(`Error stack: ${exception.stack}`);
      this.logger.error(`Error name: ${exception.name}`);
    } else {
      this.logger.error(`Exception caught: ${JSON.stringify({ ...errorDetails, exception })}`);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any).message || message,
    });
  }
}

