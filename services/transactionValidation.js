// Client feedback only: Firestore rules are the authorization boundary.
export function validateTransactionInput(description, amount, date, type) {
  if (typeof description !== 'string' || !description.trim() || description.length > 2000) {
    throw new Error('Enter a description between 1 and 2,000 characters.');
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000000000) {
    throw new Error('Enter a positive amount no greater than 1,000,000,000,000.');
  }
  if (typeof date !== 'string' || !/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(date)
      || !Number.isFinite(Date.parse(`${date}T00:00:00Z`))
      || new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date) {
    throw new Error('Enter a valid calendar date.');
  }
  if (type !== 'INCOME' && type !== 'EXPENSE') {
    throw new Error('Choose income or expense.');
  }
}

export function transactionFromDocument(snapshot) {
  return { ...snapshot.data(), id: snapshot.id };
}
