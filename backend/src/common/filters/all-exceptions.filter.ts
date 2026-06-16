import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 5000;
    let message = '服务器内部错误';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();

      if (status === HttpStatus.UNAUTHORIZED) {
        code = 4001;
        message = '未登录或Token已过期';
      } else if (status === HttpStatus.FORBIDDEN) {
        code = 4003;
        message = '无权限访问';
      } else if (status === HttpStatus.NOT_FOUND) {
        code = 4004;
        message = '资源不存在';
      } else if (status === HttpStatus.UNPROCESSABLE_ENTITY || status === HttpStatus.BAD_REQUEST) {
        code = 4220;
        message = typeof res === 'string' ? res : res?.message || '参数校验失败';
        if (Array.isArray(res?.message)) {
          message = res.message.join('; ');
        }
      } else {
        code = status;
        message = typeof res === 'string' ? res : res?.message || exception.message;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      code,
      message,
      data: null,
      timestamp: Date.now(),
      path: request.url,
    });
  }
}
