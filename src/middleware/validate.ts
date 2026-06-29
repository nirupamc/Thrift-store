import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Write coerced/defaulted values back so controllers get the right types
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) Object.assign(req.query, parsed.query);
      if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
      next();
    } catch (err) {
      next(err);
    }
  };
