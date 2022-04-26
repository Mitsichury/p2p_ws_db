export const transactionStatus = {
  CANCELED: "canceled",
  DONE: "done",
};

export function isTransactionStatusValid(status){
    return Object.keys(transactionStatus).indexOf(status) != -1;
}