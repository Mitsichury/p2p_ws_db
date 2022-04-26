export const transactionStatus = {
  CANCELED: "canceled",
  DONE: "done",
};

export function isTransactionStatusValid(status){
    return Object.values(transactionStatus).indexOf(status) != -1;
}