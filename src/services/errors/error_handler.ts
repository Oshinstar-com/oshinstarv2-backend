



export enum ErrorType {
    db_operation_failed
}

export abstract class ErrorHandler {
    public static async handleError(errorType: ErrorType, e?: any) {
        // console.log(`[${chalk.bold.red('Error')}]: ${e ? `${e} - ${ErrorType[errorType]}` : ErrorType[errorType]}`);
    }

    public static async errorHandler(
        error: any,
        req: any,
        res: any,
        next: any
      ) {
        console.error(error); // Log the error to the console

        // Handle specific error types, e.g., send an appropriate HTTP response
        if (error instanceof TypeError) {
          res.status(400).json({ error: 'Bad Request' });
        } else {
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
}
