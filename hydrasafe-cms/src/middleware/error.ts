import { Request, Response, NextFunction } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  errors?: any;
  code?: number;
  value?: any;
}

const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error:', err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';
  const errors: any = {};

  // Mongoose validation error
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    Object.keys(err.errors).forEach((field) => {
      errors[field] = err.errors[field].message;
    });
    message = 'Validation Error';
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
    if (err.value) {
      const field = Object.keys(err.value)[0];
      errors[field] = `${field} already exists`;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;