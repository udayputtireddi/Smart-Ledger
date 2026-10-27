import { object, text, list, attachment, HttpError } from './security.mjs';
export function validate(body) {
  object(body, ['operation', 'input']);
  const { operation, input } = body;
  let cost = 1;

  if (operation !== 'categorize') throw new HttpError(400, 'Unsupported AI operation.');
  object(input, ['description', 'amount', 'type']);
  text(input.description, 500);
  if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > 1e12 ||
      !['INCOME', 'EXPENSE'].includes(input.type)) throw new HttpError(400, 'Invalid transaction.');

  return { operation, input, cost, stream: operation === 'chat' };
}
